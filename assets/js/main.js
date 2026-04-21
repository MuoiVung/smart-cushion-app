document.addEventListener("DOMContentLoaded", () => {
    const inPagesDir = window.location.pathname.includes("/pages/");
    const prefix = inPagesDir ? "" : "pages/";
    const root = inPagesDir ? "../" : "";

    const pageMap = {
        dashboard: root + "index.html",
        videocam: prefix + "live-monitor.html",
        insights: prefix + "insights.html",
        psychology: prefix + "ai-advisor.html",
        history: prefix + "session-history.html",
        settings: prefix + "settings.html",
        account_circle: prefix + "settings.html",
    };

    document.querySelectorAll(".material-symbols-outlined").forEach((icon) => {
        const parent = icon.parentElement;
        const name = icon.textContent.trim() || icon.getAttribute("data-icon");
        if (!pageMap[name]) return;
        const target = ["A", "DIV", "BUTTON"].includes(parent.tagName) ? parent : icon;
        target.style.cursor = "pointer";
        target.onclick = (e) => {
            e.preventDefault();
            window.location.href = pageMap[name];
        };
    });

    const buttonActions = [
        ["Test Connection", () => alert("📡 Simulating Connection Test... Connected successfully to esp32-cushion-01!")],
        ["Export CSV", () => alert("📊 File generated: posture_data_export.csv started downloading.")],
        ["Export PDF", () => alert("📑 File generated: clinical_report.pdf started downloading.")],
        ["Start New Session", () => (window.location.href = prefix + "start-new-session.html")],
        ["Exit Session", () => (window.location.href = root + "index.html")],
        ["Begin Tracking", () => (window.location.href = prefix + "live-monitor.html")],
        ["Logout", () => alert("👋 Logging out of Dr. Smith's Dashboard...")],
    ];

    document.querySelectorAll("button").forEach((btn) => {
        const text = btn.textContent.trim();
        for (const [match, handler] of buttonActions) {
            if (text.includes(match)) {
                btn.onclick = handler;
                break;
            }
        }
    });
});
