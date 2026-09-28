# 🩺 Virtual Scribe Assistant

> **AI-Powered Voice-First Clinical Documentation & Emergency Health Assistant for Senior Citizens & Healthcare Providers**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.6%20Flash-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

**Virtual Scribe Assistant** is a multilingual clinical AI assistant designed to eliminate documentation burdens for healthcare providers and empower patients—especially senior citizens—to record symptoms, receive preliminary home care remedies, and generate structured medical consultation reports.

Built with **natural voice interaction**, **live multi-language support (English, Telugu తెలుగు, and Hindi हिंदी)**, **automated GPS emergency SOS alerts**, and **fluid cyber-medical visual animations**.

---

## ✨ Key Features

### 🎙️ 1. Voice-First Multilingual Clinical Console
- **Hands-Free Voice Recognition**: Speak naturally using Web Speech API with automatic silence detection.
- **Fluent Multilingual Speech Output (TTS)**: Listens and speaks back in **English**, **Telugu (`తెలుగు`)**, and **Hindi (`हिंदी`)**.
- **Interactive Voice Orb**: Visual pulsing feedback during listening, thinking, and speaking states.

### 📋 2. Automated 6-Section Clinical Reports
- Generates structured, physician-ready consultation reports:
  1. **History of Present Illness (HPI)**
  2. **Differential Diagnosis & Clinical Reasoning**
  3. **Comprehensive Actionable Treatment Plan** (Home remedies, OTC guidance)
  4. **Recommended Doctor Specialist & Diagnostic Tests**
  5. **Critical Warning Signs (Red Flags)**
  6. **Prognosis & Follow-Up Timeline**
- Instant report download (`.txt`) and conversation transcript export.

### 🚨 3. Emergency Support & Live GPS WhatsApp SOS
- **1-Tap National Emergency Hotlines**: Immediate phone dialer links (`tel:`) for **108 (Ambulance)**, **104 (Tele-Health)**, and **14567 (Elder Line)**.
- **Automated WhatsApp SOS with Live GPS**: Automatically fetches real-time GPS coordinates (`navigator.geolocation`) and generates a Google Maps location link directly sent to saved caregivers via WhatsApp.

### 👴 4. Senior-Friendly Accessibility & Cinematic Aesthetics
- **One-Tap Quick Entry**: No complex passwords needed for seniors.
- **Senior Text Scaler**: Instant toggle between `Normal A` and `Large A+` font sizes across the entire UI.
- **Dynamic 3D Zoom Transitions**: Smooth, springy zoom-in page transitions and staggered pop-in card animations.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS (Custom Cyber-Medical Design System)
- **Backend**: Node.js, Express, TypeScript, TSX
- **AI / LLM**: Google Gemini 3.6 Flash
- **Database / Auth**: Supabase (with automatic resilient in-memory fallback)
- **Voice APIs**: Web Speech API (`webkitSpeechRecognition`), Browser Speech Synthesis

---

## 📂 Project Structure

```
Virtual-Scribe-Assistant/
├── client/                     # Frontend React SPA
│   ├── public/                 # Static assets & routing redirects (_redirects)
│   ├── src/
│   │   ├── components/         # Consultation, Summary, History, Navigation, Auth
│   │   ├── context/            # AuthContext, ConsultationContext
│   │   ├── hooks/              # useVoice, useSpeechSynthesis, useConsultation
│   │   ├── pages/              # Dashboard, Consultation, Summary, History, Support, About
│   │   ├── services/           # api.ts, supabase.ts
│   │   ├── index.css           # Custom Design System, Animations & Responsive styles
│   │   └── App.tsx             # Root Application & Dynamic Router
│   ├── vercel.json             # Vercel SPA routing rewrite
│   └── package.json
│
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── engine/             # Consultation engine & clinical field mergers
│   │   ├── middleware/         # Auth & error handling
│   │   ├── routes/             # Consultation, history, and TTS routes
│   │   ├── services/           # Gemini AI & Supabase services
│   │   └── index.ts            # Server entry point & CORS configuration
│   └── package.json
│
├── supabase/                   # Database schemas & SQL migrations
├── .gitignore                  # Git ignore rules for node_modules and secrets
└── README.md                   # Project Documentation
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18 or higher
- **Google Gemini API Key**: [Get one here](https://aistudio.google.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/ManishKumar981/Virtual-Scribe-Assistant.git
cd Virtual-Scribe-Assistant
```

---

### 2. Configure Backend Environment
Navigate to the `server/` directory and create a `.env` file:
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
CLIENT_ORIGIN=http://localhost:5173
```

Install dependencies and start the backend:
```bash
npm install
npm run dev
```

---

### 3. Configure Frontend Environment
In a new terminal window, navigate to `client/`:
```bash
cd client
cp .env.example .env
```

Install dependencies and start the frontend:
```bash
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser!

---

## 🌐 Deployment Guide

### Deploy Backend (on [Render.com](https://render.com))
1. Create a **New Web Service** pointing to this GitHub repository.
2. Root Directory: `server`
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/index.js`
5. Add Environment Variables:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`: `gemini-3.6-flash`
   - `PORT`: `5000`
   - `CLIENT_ORIGIN`: `*`

### Deploy Frontend (on [Vercel.com](https://vercel.com))
1. Import this GitHub repository into Vercel.
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api`

---

## ⚖️ Medical Disclaimer

*Virtual Scribe Assistant is an AI-driven documentation and clinical triage aid intended to assist healthcare workflows and provide general informative guidance. It does not provide formal medical prescriptions or replace direct diagnosis by a licensed physician.*

---

## 📄 License

This project is licensed under the **MIT License**.
