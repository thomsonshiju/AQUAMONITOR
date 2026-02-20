# 🚀 AquaMonitor Deployment Guide

This guide will help you host your application online.

## 1. Prepare Database (MySQL)
The backend requires a MySQL database.
*   **Provider:** [Aiven.io](https://aiven.io/) (Free tier available).
*   **Setup:**
    1.  Create a MySQL Service on Aiven.
    2.  Download the SSL certificate if required (or set `DB_SSL=true` in environment variables).
    3.  Run the contents of `server/database.sql` on your new database using MySQL Workbench or any SQL client.

---

## 2. Deploy Backend (Node.js/Express)
*   **Provider:** [Render.com](https://render.com/) or [Railway.app](https://railway.app/).
*   **Steps for Render:**
    1.  Create a **New Web Service**.
    2.  Connect your GitHub repo.
    3.  **Root Directory:** `server`
    4.  **Build Command:** `npm install`
    5.  **Start Command:** `node index.js`
    6.  **Environment Variables:** Add the following:
        *   `PORT`: (Render sets this automatically)
        *   `DB_HOST`: Your cloud database host.
        *   `DB_USER`: Your cloud database user.
        *   `DB_PASSWORD`: Your cloud database password.
        *   `DB_NAME`: `aquamonitor_db`
        *   `DB_PORT`: `3306`
        *   `DB_SSL`: `true`
        *   `EMAIL_USER`: `aquamonitor2025@gmail.com`
        *   `EMAIL_PASS`: (Your Gmail App Password)
        *   `MQTT_HOST`, `MQTT_USER`, `MQTT_PASS`: (Your CloudAMQP credentials)

---

## 3. Deploy Frontend (React/Vite)
*   **Provider:** [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/).
*   **Steps for Vercel:**
    1.  Import your GitHub repo.
    2.  **Environment Variables:** Add everything from your local `.env`:
        *   `VITE_FIREBASE_API_KEY`: ...
        *   `VITE_FIREBASE_AUTH_DOMAIN`: ...
        *   `VITE_FIREBASE_PROJECT_ID`: ...
        *   `VITE_FIREBASE_STORAGE_BUCKET`: ...
        *   `VITE_FIREBASE_MESSAGING_SENDER_ID`: ...
        *   `VITE_FIREBASE_APP_ID`: ...
        *   `VITE_FIREBASE_MEASUREMENT_ID`: ...
        *   `VITE_MQTT_HOST`: ...
        *   `VITE_MQTT_USER`: ...
        *   `VITE_MQTT_PASS`: ...
        *   **CRITICAL:** `VITE_API_URL`: Set this to your **Render Backend URL** (e.g., `https://your-backend.onrender.com`).

---

## 4. Final Steps
1.  **Firebase Config:** Ensure you add your production domain (e.g., `aquamonitor.vercel.app`) to the "Authorized Domains" in your Firebase Project settings (Authentication > Settings).
2.  **CloudAMQP:** Your MQTT connection should work as long as the credentials are correct.

---

## Summary of URL Changes
The code has been updated to use `process.env.PORT` on the backend and `import.meta.env.VITE_API_URL` on the frontend for seamless deployment.
