# ErgoVita - Smart Cushion Monitoring App

A modern, real-time dashboard for the Smart Cushion system. Built with ReactJS, Vite, and Tailwind CSS.

## 🚀 Quick Start

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure environment**:
    Copy `.env.example` to `.env` and update the `VITE_WS_URL` to point to your Fog Node's IP address.
    ```bash
    cp .env.example .env
    ```

3.  **Run in development mode**:
    ```bash
    npm run dev
    ```

## 📊 Features
-   **Live Monitor**: Real-time visualization of 9 FSR pressure sensors (3x3 grid).
-   **Posture Recognition**: Displays 11 different states (9 postures + EMPTY + OBJECT) detected by the AI Fog Node.
-   **Alert Logging**: Real-time log of posture corrections and vibration alerts.
-   **Session History**: Track your sitting habits over time.
-   **AI Advisor**: Get personalized ergonomic suggestions.

## 🔌 Connection
The app connects to the **Fog Node** via WebSocket (Interface 02). Ensure your computer/mobile device can reach the Fog Node's IP address on the local network.
