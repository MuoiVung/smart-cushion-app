(() => {
    const FSR_MAX = 4095;
    const TEMP_MIN = 15, TEMP_MAX = 45;
    const STORAGE_KEY = "deviceUrl";
    const SESSIONS_KEY = "posture_sessions";
    const MAX_STORED_SESSIONS = 30;
    const MIN_MESSAGES_TO_SAVE = 10;
    const CHART_WINDOW = 60; // rolling points

    const POSTURE_META = {
        correct:        { label: "Good",           icon: "check_circle",   color: "text-tertiary",  border: "border-tertiary" },
        lean_left:      { label: "Leaning Left",   icon: "arrow_back",     color: "text-secondary", border: "border-secondary" },
        lean_right:     { label: "Leaning Right",  icon: "arrow_forward",  color: "text-secondary", border: "border-secondary" },
        slouch_forward: { label: "Slouching",      icon: "arrow_downward", color: "text-error",     border: "border-error" },
        lean_back:      { label: "Leaning Back",   icon: "arrow_upward",   color: "text-secondary", border: "border-secondary" },
        unknown:        { label: "No Person",      icon: "help",           color: "text-outline",   border: "border-outline" },
    };

    const POSTURE_TO_NUM = {
        unknown: 0, correct: 1, lean_left: 2, lean_right: 3, slouch_forward: 4, lean_back: 5,
    };
    const NUM_TO_LABEL = ["No Person", "Correct", "Lean L", "Lean R", "Slouch", "Lean Bk"];
    const POSTURE_HEX = {
        correct:        "#00685f",
        lean_left:      "#712ae2",
        lean_right:     "#8a4cfc",
        slouch_forward: "#ba1a1a",
        lean_back:      "#f59e0b",
        unknown:        "#6d7a77",
    };
    const NUM_TO_HEX = ["#6d7a77", "#00685f", "#712ae2", "#8a4cfc", "#ba1a1a", "#f59e0b"];

    // ── Chart.js CDN loader (dynamic injection) ─────────────────────────────
    const CHART_CDN = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    const chartReady = new Promise((resolve, reject) => {
        if (window.Chart) return resolve();
        const s = document.createElement("script");
        s.src = CHART_CDN;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Chart.js failed to load"));
        document.head.appendChild(s);
    });

    const $ = (id) => document.getElementById(id);

    const el = {
        urlInput:   $("ws-url-input"),
        toggleBtn:  $("ws-toggle-btn"),
        btnLabel:   $("ws-btn-label"),
        statusText: $("ws-status-text"),
        pingDot:    $("ws-ping-dot"),
        latency:    $("ws-latency"),
        msgCount:   $("ws-msg-count"),

        postureLabel: $("posture-label"),
        postureIcon:  $("posture-icon"),
        postureHead:  $("posture-heading"),
        timeActive:   $("time-active"),
        confPct:      $("confidence-pct"),
        confBar:      $("confidence-bar"),

        tempVal:   $("temp-val"),
        personVal: $("person-val"),
        motorVal:  $("motor-val"),

        alertsCard:   $("alerts-card"),
        alertsStatus: $("alerts-status"),
        alertsList:   $("alerts-list"),
        rawJson:      $("raw-json"),
    };

    // Full 3×3 grid (matches data/schema.py AggregatedSensorReading).
    // Each entry: [slot id, schema field, isGauge]
    //   isGauge=true → also has a progress bar in the middle column.
    const fsrKeys = [
        ["fl", "fsr_front_left",  true],
        ["fm", "fsr_front_mid",   false],
        ["fr", "fsr_front_right", true],
        ["ml", "fsr_mid_left",    false],
        ["mm", "fsr_mid_mid",     false],
        ["mr", "fsr_mid_right",   false],
        ["bl", "fsr_back_left",   true],
        ["bm", "fsr_back_mid",    false],
        ["br", "fsr_back_right",  true],
    ];

    let ws = null;
    let sessionStart = null;
    let timerId = null;
    let msgCount = 0;
    let lastMsgTs = 0;

    // Rolling posture history (last CHART_WINDOW points).
    // Each entry: { t: epochMs, p: posture string, n: numeric }
    let postureHistory = [];

    // Per-session stats (populated on connect, cleared on save).
    let sessionStats = null;

    // Chart.js instance (created once DOM card + CDN are ready).
    let chart = null;

    // ── Connection ──────────────────────────────────────────────────────────
    function connect() {
        const url = el.urlInput.value.trim();
        if (!url) return;
        try {
            localStorage.setItem(STORAGE_KEY, url);
        } catch {}

        setStatus("connecting", `Connecting to ${url}…`);
        el.toggleBtn.disabled = true;

        try {
            ws = new WebSocket(url);
        } catch (err) {
            setStatus("error", `Invalid URL: ${err.message}`);
            el.toggleBtn.disabled = false;
            return;
        }

        ws.onopen = () => {
            setStatus("connected", "Real-time mode — Connected");
            el.btnLabel.textContent = "Disconnect";
            el.toggleBtn.disabled = false;
            el.urlInput.disabled = true;
            startSessionTimer();
            resetSessionStats();
            postureHistory = [];
            msgCount = 0;
            el.msgCount.textContent = `Msgs: 0`;
        };

        ws.onmessage = (e) => handleMessage(e.data);

        ws.onerror = () => {
            setStatus("error", "Connection error — check device URL");
        };

        ws.onclose = (ev) => {
            ws = null;
            setStatus("disconnected", `Disconnected (code ${ev.code})`);
            el.btnLabel.textContent = "Connect";
            el.toggleBtn.disabled = false;
            el.urlInput.disabled = false;
            stopSessionTimer();
            saveSessionSummary();
        };
    }

    function disconnect() {
        if (ws) ws.close(1000, "User disconnected");
    }

    // ── Message handler ─────────────────────────────────────────────────────
    function handleMessage(raw) {
        let data;
        try { data = JSON.parse(raw); } catch { return; }

        if (data.type === "connected") {
            setStatus("connected", `Connected — ${data.message || "Device ready"}`);
            return;
        }

        msgCount++;
        const now = Date.now();
        if (lastMsgTs) el.latency.textContent = `Latency: ${now - lastMsgTs} ms`;
        lastMsgTs = now;
        el.msgCount.textContent = `Msgs: ${msgCount}`;

        const posture = data.posture || "unknown";
        const sensors = data.sensors || {};
        const conf    = data.confidence ?? 0;
        const person  = !!data.person_detected;
        const alerted = !!data.alert_sent;

        updatePosture(posture, conf, person);
        updateSensors(sensors);
        updateMotor(alerted);
        if (alerted) pushAlert(posture, data.timestamp);
        el.rawJson.textContent = JSON.stringify(data, null, 2);

        trackSessionStats(posture, alerted);
        pushHistoryPoint(posture, now);
        updateChart();
    }

    // ── UI updaters ─────────────────────────────────────────────────────────
    function updatePosture(posture, conf, person) {
        const meta = POSTURE_META[posture] || POSTURE_META.unknown;

        el.postureLabel.textContent = meta.label;
        el.postureIcon.textContent = meta.icon;
        el.postureHead.className = `text-[48px] font-black ${meta.color} leading-none flex items-center gap-2`;

        const pct = Math.round(conf * 100);
        el.confPct.textContent = `${pct}%`;
        el.confBar.style.width = `${pct}%`;

        el.personVal.textContent = person ? "Yes" : "No";
    }

    // 3-stop heatmap: 0–30% blue, 30–60% amber, 60–100% red.
    // Linearly interpolates RGB across stops for smooth transitions.
    function heatmapColor(pct) {
        // pct in [0, 1]
        const stops = [
            { at: 0.0,  rgb: [59, 130, 246] }, // blue
            { at: 0.3,  rgb: [59, 130, 246] }, // blue
            { at: 0.6,  rgb: [245, 158, 11] }, // amber
            { at: 1.0,  rgb: [239, 68, 68] },  // red
        ];
        let lo = stops[0], hi = stops[stops.length - 1];
        for (let i = 0; i < stops.length - 1; i++) {
            if (pct >= stops[i].at && pct <= stops[i + 1].at) {
                lo = stops[i];
                hi = stops[i + 1];
                break;
            }
        }
        const span = hi.at - lo.at || 1;
        const t = (pct - lo.at) / span;
        const rgb = lo.rgb.map((c, i) => Math.round(c + (hi.rgb[i] - c) * t));
        return { r: rgb[0], g: rgb[1], b: rgb[2] };
    }

    function updateSensors(s) {
        fsrKeys.forEach(([slot, key, isGauge]) => {
            const v = s[key] ?? 0;
            const pct = Math.min(100, Math.round((v / FSR_MAX) * 100));
            const norm = Math.min(1, v / FSR_MAX);

            const cell = $(`fsr-${slot}`);
            if (cell) cell.textContent = v;

            if (isGauge) {
                const gaugePct = $(`gauge-${slot}-pct`);
                const gaugeBar = $(`gauge-${slot}-bar`);
                if (gaugePct) gaugePct.textContent = `${pct}%`;
                if (gaugeBar) gaugeBar.style.width = `${pct}%`;
            }

            const cellBox = $(`cell-${slot}`);
            if (cellBox) {
                const { r, g, b } = heatmapColor(norm);
                // alpha scales with pressure (intensity); clamp so even strong
                // colors don't fully obscure the label text
                const alpha = 0.15 + norm * 0.65;
                cellBox.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                // Fade cells that never receive data (mid sensors with no ESP32-2)
                cellBox.style.opacity = v === 0 ? "0.35" : "1";
            }
        });

        const temp = s.temperature;
        if (temp != null) {
            el.tempVal.textContent = `${Number(temp).toFixed(1)}°C`;
        }
    }

    function updateMotor(alerted) {
        el.motorVal.textContent = alerted ? "ON" : "OFF";
        el.motorVal.style.color = alerted ? "#ba1a1a" : "";
    }

    function pushAlert(posture, ts) {
        const meta = POSTURE_META[posture] || POSTURE_META.unknown;
        const time = ts ? new Date(ts * 1000).toLocaleTimeString() : new Date().toLocaleTimeString();

        el.alertsStatus.textContent = "Active";
        el.alertsStatus.className = "text-[10px] font-bold text-error px-2 py-1 bg-error/10 rounded-full";
        el.alertsCard.className = el.alertsCard.className.replace("border-outline", "border-error");

        const placeholder = el.alertsList.querySelector(".opacity-60");
        if (placeholder) placeholder.remove();

        const entry = document.createElement("div");
        entry.className = "flex gap-3 items-start";
        entry.innerHTML = `
            <div class="mt-1 h-6 w-6 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-xs text-error">notification_important</span>
            </div>
            <div>
                <p class="text-sm font-bold text-on-surface">${meta.label}</p>
                <p class="text-xs text-outline mt-0.5 mono-data">${time}</p>
            </div>`;
        el.alertsList.prepend(entry);

        while (el.alertsList.children.length > 20) {
            el.alertsList.removeChild(el.alertsList.lastChild);
        }
    }

    // ── Posture history chart ───────────────────────────────────────────────
    function injectHistoryCard() {
        if ($("posture-history-chart")) return;

        const grid = document.querySelector("main .p-8.grid.grid-cols-12");
        if (!grid) return;

        const card = document.createElement("div");
        card.className = "mx-8 mb-8 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_20px_40px_rgba(11,28,48,0.05)]";
        card.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm uppercase tracking-widest font-black text-on-surface">Posture history — current session</h3>
                <span class="text-[10px] font-bold text-outline">last ${CHART_WINDOW} readings</span>
            </div>
            <div style="height: 160px; position: relative;">
                <canvas id="posture-history-chart"></canvas>
            </div>`;
        grid.insertAdjacentElement("afterend", card);
    }

    function pushHistoryPoint(posture, tMs) {
        const n = POSTURE_TO_NUM[posture] ?? 0;
        postureHistory.push({ t: tMs, p: posture, n });
        if (postureHistory.length > CHART_WINDOW) {
            postureHistory.shift();
        }
    }

    function buildChart() {
        if (chart || !window.Chart) return;
        const canvas = $("posture-history-chart");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        chart = new window.Chart(ctx, {
            type: "line",
            data: {
                datasets: [{
                    label: "Posture",
                    data: [],
                    stepped: true,
                    tension: 0,
                    fill: false,
                    pointRadius: 2,
                    borderWidth: 2,
                    borderColor: "#6d7a77",
                    pointBackgroundColor: (c) => NUM_TO_HEX[c.raw?.y ?? 0] || "#6d7a77",
                    pointBorderColor: (c) => NUM_TO_HEX[c.raw?.y ?? 0] || "#6d7a77",
                    segment: {
                        borderColor: (c) => NUM_TO_HEX[c.p0?.raw?.y ?? 0] || "#6d7a77",
                    },
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (c) => `${NUM_TO_LABEL[c.raw?.y ?? 0]}`,
                            title: (items) => `${Math.round(items[0]?.raw?.x ?? 0)}s ago`,
                        },
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                        reverse: true,
                        title: { display: true, text: "Seconds ago", color: "#6d7a77", font: { size: 10 } },
                        ticks: { color: "#6d7a77", font: { size: 10 } },
                        grid: { color: "rgba(109,122,119,0.1)" },
                    },
                    y: {
                        min: -0.5,
                        max: 5.5,
                        ticks: {
                            stepSize: 1,
                            color: "#6d7a77",
                            font: { size: 10 },
                            callback: (v) => NUM_TO_LABEL[v] ?? "",
                        },
                        grid: { color: "rgba(109,122,119,0.1)" },
                    },
                },
            },
        });
    }

    function updateChart() {
        if (!chart) return;
        const now = Date.now();
        const pts = postureHistory.map(({ t, n }) => ({
            x: (now - t) / 1000,
            y: n,
        }));
        chart.data.datasets[0].data = pts;
        chart.update("none");
    }

    // ── Session tracking + persistence ──────────────────────────────────────
    function resetSessionStats() {
        sessionStats = {
            startTime: Date.now(),
            messages: 0,
            alerts: 0,
            postureCounts: {
                correct: 0, lean_left: 0, lean_right: 0,
                slouch_forward: 0, lean_back: 0, unknown: 0,
            },
        };
    }

    function trackSessionStats(posture, alerted) {
        if (!sessionStats) return;
        sessionStats.messages++;
        if (alerted) sessionStats.alerts++;
        if (sessionStats.postureCounts[posture] != null) {
            sessionStats.postureCounts[posture]++;
        } else {
            sessionStats.postureCounts[posture] = 1;
        }
    }

    function saveSessionSummary() {
        if (!sessionStats) return;
        const total = sessionStats.messages;
        if (total < MIN_MESSAGES_TO_SAVE) {
            sessionStats = null;
            return;
        }

        const durationSec = Math.max(1, Math.floor((Date.now() - sessionStats.startTime) / 1000));
        const today = new Date().toISOString().slice(0, 10);
        const correctPct = Math.round((sessionStats.postureCounts.correct / total) * 100);

        // Drop the "unknown" bucket from the saved report (not a reportable posture)
        const { unknown: _drop, ...reportCounts } = sessionStats.postureCounts;

        const summary = {
            date: today,
            duration_seconds: durationSec,
            posture_counts: reportCounts,
            total_alerts: sessionStats.alerts,
            correct_pct: correctPct,
        };

        let arr = [];
        try {
            arr = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
            if (!Array.isArray(arr)) arr = [];
        } catch {
            arr = [];
        }
        arr.push(summary);
        if (arr.length > MAX_STORED_SESSIONS) {
            arr = arr.slice(-MAX_STORED_SESSIONS);
        }
        try {
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(arr));
        } catch {}

        sessionStats = null;
    }

    // ── Status / session timer ──────────────────────────────────────────────
    function setStatus(state, text) {
        el.statusText.textContent = text;
        const dotColor = {
            connected:    "bg-tertiary-fixed-dim",
            connecting:   "bg-secondary-fixed-dim",
            error:        "bg-error",
            disconnected: "bg-outline",
        }[state] || "bg-outline";
        el.pingDot.innerHTML = `<span class="relative inline-flex rounded-full h-3 w-3 ${dotColor} ${state === "connected" ? "animate-pulse" : ""}"></span>`;
    }

    function startSessionTimer() {
        sessionStart = Date.now();
        const tick = () => {
            const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
            const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
            const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
            const s = String(elapsed % 60).padStart(2, "0");
            el.timeActive.textContent = `${h}:${m}:${s}`;
        };
        tick();
        timerId = setInterval(tick, 1000);
    }

    function stopSessionTimer() {
        if (timerId) clearInterval(timerId);
        timerId = null;
    }

    // ── Init ────────────────────────────────────────────────────────────────
    const saved = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } })();
    if (saved) el.urlInput.value = saved;

    injectHistoryCard();
    chartReady.then(buildChart).catch((err) => console.warn(err));

    el.toggleBtn.addEventListener("click", () => (ws ? disconnect() : connect()));
    el.urlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !ws) connect();
    });

    setStatus("disconnected", "Real-time mode — Not connected");
})();
