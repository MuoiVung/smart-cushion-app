# 📱 Smart Cushion Companion App

### Real-time Posture Telemetry & Gamified Dashboard

An interactive web application designed to act as the user interface for the Smart Cushion system. It provides real-time posture visualization, historical session tracking, and a "Capy Gacha" gamification system to encourage healthy sitting habits.

<p align="center">
  <b>Live Monitor ｜ WebSocket Streaming ｜ Session History ｜ Gamified Rewards ｜ Capy Gacha</b>
</p>

---

## 🔗 Project Links

| Item                    | Link                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| 🌐 Project Website      | [https://tonguyentanphuong.github.io/smart-cushion-web/](https://github.com/tonguyentanphuong/smart-cushion-web) |
| 📊 Live Dashboard       | [https://smart-cushion-app.vercel.app/](https://smart-cushion-app.vercel.app/)                |
| 🧑‍💻 App Repository     | [https://github.com/MuoiVung/smart-cushion-app](https://github.com/MuoiVung/smart-cushion-app)    |
| ⚙️ Main Architecture    | [https://github.com/MuoiVung/smart-cushion](https://github.com/MuoiVung/smart-cushion)            |

---

## 📌 Project Overview

The **Companion App** is the user-facing component of the CapyCushion IoT system. 

It connects to the local **Fog Node** via WebSockets to stream real-time posture classifications (processed by the Edge AI) and visualizes the user's current posture using an animated Capybara avatar and a 3x3 sensor heatmap. 

When a sitting session concludes, the app pulls historical data from the **AWS Cloud backend**, allowing users to review their daily sitting habits. To promote adherence, the app features a gamified economy where users earn **Gems** for maintaining proper posture, which can be spent in the **Capy Gacha** to unlock collectible stickers.

This repository includes:
* 📊 **Live Monitor** — Real-time telemetry visualization via WebSockets
* 📅 **Session History** — Integration with AWS API Gateway for historical data
* 🎰 **Capy Gacha System** — Gamified UI for spending earned Gems
* 🎨 **Modern Interface** — Built with React, Vite, and Tailwind CSS

---

## 🛠️ Technology Stack

| Layer              | Tools / Components                             |
| ------------------ | ---------------------------------------------- |
| Frontend Framework | React.js (Single Page Application)             |
| Build Tool         | Vite (Optimized build and Fast HMR)            |
| Styling            | Tailwind CSS                                   |
| Animations         | Framer Motion, CSS Transitions                 |
| Real-Time Network  | WebSockets (Connecting to local Fog Node)      |
| REST Network       | Axios (Connecting to AWS API Gateway)          |
| Hosting/Deployment | Vercel                                         |

---

## 💡 Motivation

While the hardware and AI layers handle the technical task of posture detection, the actual improvement of user habits depends entirely on **user engagement**. 

Traditional posture apps fail because:
* 📉 The interfaces are static and boring.
* 🥱 Text notifications are easily ignored.
* ❌ There is no positive reinforcement for sitting correctly.

Therefore, this app focuses on **Gamification** and **Real-Time Visual Feedback**. By showing users exactly how their weight is distributed and rewarding them with a fun gacha system, we convert a boring medical task into an engaging daily habit.

---

## 🧩 System Architecture (Application Layer)

The application layer sits at the top of our 4-Tier Cloud-Fog topology. It interacts with two distinct systems:

### 1. Fog Node Integration (Low Latency)
The app connects to the local Fog Node via a WebSocket connection. 
* **Input:** Receives `realtime_update` JSON packets at 10Hz containing the AI's current posture classification and raw sensor values.
* **Action:** Drives the Live Monitor heatmap and updates the Capybara avatar animation.

### 2. Cloud Integration (Persistence & Gamification)
The app connects to the AWS Cloud via REST APIs.
* **Input:** Fetches `SessionSummary` logs, Daily Aggregations, and the user's `Gem Balance`.
* **Action:** Populates the History charts and determines if the user has enough currency to play the Gacha mini-game.

---

## 📊 Dashboard & Interface Design

### 🪑 Live Monitor Page
Visualizes the immediate state of the cushion.
* **Animated Avatar:** A Capybara that mimics the user's detected posture (e.g., leaning left, leaning right).
* **Sensor Heatmap:** A 3x3 grid showing exactly which FSR sensors are bearing the most weight.
* **Real-time Status:** Displays current inference confidence and posture label.

### 📅 Session History Page
Converts raw IoT data into readable health metrics.
* **7-Day Completion Rate:** How often the user maintained a healthy "Natural Upright" posture over the week.
* **Recent Sessions:** A detailed table of the latest sitting sessions, including duration and posture breakdown pie charts.

### 🎰 Capy Gacha Page
The gamification hub.
* **Gem Balance:** Displays currently available Gems (earned at 1 Gem / 10s of good posture).
* **Roll Button:** Spends 50 Gems to trigger a randomized drop of a Capybara sticker.
* **Collection:** A gallery showing all unlocked stickers.

---

## 🔄 App Workflow

| Status      | Condition                                                       |
| ----------- | --------------------------------------------------------------- |
| 🟢 **Live** | App is connected to Fog WebSocket. Capybara avatar moves in real-time. |
| 🟡 **End Session** | User stands up. App fetches updated Gem balance from AWS after 5 seconds. |
| 💎 **Reward** | User navigates to Gacha page, spends Gems, and unlocks a new sticker. |

---

## 🗂️ Repository Structure

```text
smart-cushion-app/frontend/
│
├── README.md
├── package.json
├── vite.config.ts
├── tailwind.config.js
│
├── public/                  (Static assets: Capybara stickers, favicons)
│
└── src/
    ├── components/          (Reusable UI: Buttons, Layouts, Avatar SVGs)
    ├── pages/               (LiveMonitor, History, Gacha views)
    ├── hooks/               (useWebSocket, useApi business logic)
    └── context/             (Global state: Gem balance, Auth)
```

---

## 🚀 Deployment Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod
VITE_DEVICE_ID=cushion-01
VITE_WS_URL=ws://192.168.1.100:8765   # Local IP of the Fog Node
```

### 3. Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`.

### 4. Vercel Production Deployment
This app is optimized for Vercel.
1. Push to GitHub and import into Vercel.
2. Vercel automatically detects the Vite framework.
3. Add your `VITE_API_BASE_URL` in the Vercel environment variables settings.
4. Click **Deploy**.


---

## 🎯 Conclusion

The application layer of CapyCushion successfully transforms raw IoT edge data and AWS backend storage into a highly engaging, user-friendly experience. By leveraging React, WebSockets, and gamification principles, the app actively encourages users to correct their posture and build healthier sitting habits.
