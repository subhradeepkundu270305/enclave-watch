# 🛡️ Enclave Watch

> **AI-Based Threat Detection System for Unidirectional IP Traffic Flows**  
> Developed for **Smart India Hackathon (SIH) 2026** · **Problem Statement 26145**  
> Organization: **National Technical Research Organisation (NTRO)**

---

[![License: MIT](https://img.shields.io/badge/License-MIT-00f0ff.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)](https://tailwindcss.com/)
[![Security: Passive Only](https://img.shields.io/badge/Security-Passive%20Only%20(Air--Gapped)-ff0055.svg)](#-unidirectional-security-architecture)

---

## 📌 Executive Summary

**Enclave Watch** is an air-gapped, zero-trust cybersecurity monitoring system engineered to detect advanced threats within strictly unidirectional network streams. Operating behind a physical **Hardware Data Diode**, Enclave Watch receives mirrored TAP/SPAN traffic copies and applies **6 parallel statistical & machine learning detectors** without transmitting a single IP packet back out.

All detected anomalies generate cryptographically chained evidence logs signed with **Ed25519** signatures and hashed via **SHA-256**, ensuring mathematical auditability and tamper evidence.

---

## 🔒 Unidirectional Security Architecture

```
                       ┌──────────────────────────────────────────────────────────┐
                       │                   MONITORING ENCLAVE                     │
                       │                                                          │
   Critical            │  01 TAP Feed     ──► Mirrored Inbound IP Traffic         │
   Infrastructure ───► │  02 Hardware Diode─► Optical Physical One-Way Valve      │
   (Unidirectional     │  03 Processing   ──► Zeek-style Connection Log Extractor│
    IP Stream)         │  04 AI Engine    ──► 6 Parallel Machine Learning Modules│
                       │  05 Evidence Chain──► Cryptographic SHA-256 + Ed25519    │
                       │  06 UI Dashboard ──► WebSocket Stream (Cyber-Dark UI)    │
                       └──────────────────────────────────────────────────────────┘

   ⛔ PHYSICAL BARRIER — ZERO RETURN PATH / EGRESS STRICTLY BLOCKED
   ❌ No TCP ACKs, No Outbound Probes, No External DNS Lookups
```

---

## 🧠 6 AI Threat Detection Modules

Enclave Watch implements mathematical and statistical algorithms tailored for passive network observation:

| Module | Algorithm | Mathematical Model / Formula | Detection Target |
| :--- | :--- | :--- | :--- |
| **DDoS Attack Detector** | EWMA + Adaptive Variance Threshold | $\mu_t = \alpha \cdot x_t + (1-\alpha) \cdot \mu_{t-1}$<br>Alert when $x_t > \mu_t + k \cdot \sigma_t$ | High-volume volumetric flood attacks & packet bursts |
| **C2 Beaconing Detector** | Fast Fourier Transform (FFT) Power Spectrum | $P_k = \|FFT(x)_k\|^2$<br>Identifies dominant periodic peaks | Periodic malware callback signals to Command & Control servers |
| **DNS Tunneling Detector** | Shannon Entropy + N-gram Score | $H(X) = -\sum p_i \log_2(p_i)$<br>Evaluates subdomain randomness | Data exfiltration hidden inside DNS queries |
| **Encrypted Malware Detector** | Mahalanobis Distance | $D_M(x) = \sqrt{(x-\mu)^T \Sigma^{-1} (x-\mu)}$<br>Applied to JA3 TLS fingerprints | TLS handshake anomaly detection without decrypting payload |
| **Port Scan Detector** | Sliding-Window Dual Threshold | $R_c = \frac{N_{ports}}{W_{seconds}}$<br>Triggers on rapid connection fan-out | Reconnaissance port scanning & horizontal sweeps |
| **Data Exfiltration Detector**| Cumulative Sum (CUSUM) | $S_t = \max(0, S_{t-1} + x_t - \omega)$<br>Alert when $S_t > Threshold$ | Slow, low-and-slow data exfiltration attempts |

---

## 💎 Key Features

- **Cyber-Dark Glassmorphic UI**: High-contrast matte black interface with neon accents, custom interactive charts, and smooth Framer Motion micro-animations.
- **Interactive SVG Topology Map**: Displays real-time data streaming across network layers with zero graphical overlaps and clear hardware diode boundary indicators.
- **Integrated AI Assistant**: Contextual quick-guide AI assistant for instant operator guidance and threat explanation.
- **Tamper-Evident Evidence Verification**: Built-in cryptographic chain viewer allowing operators to test evidence integrity and simulate hash mismatch detection.
- **Instant Attack Simulation (Demo Mode)**: One-click attack generator for hackathon live judging and capability demonstration.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm 9+**
- (Optional) **Docker** & **Docker Compose**

---

### Option A: Running with Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/your-username/enclave-watch.git
cd enclave-watch

# 2. Build and launch services
docker-compose up --build
```
- **Frontend Dashboard**: `http://localhost:3000` (or `http://localhost:5173`)
- **Backend API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

---

### Option B: Manual Local Setup

#### 1. Backend Setup (FastAPI & AI Engine)
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

#### 2. Frontend Setup (React + Vite)
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🎮 Demo Mode & Live Testing

You can trigger synthetic attack traffic directly from the **Demo Mode** dashboard view or via cURL:

```bash
# Trigger a specific attack type (e.g. DDoS)
curl -X POST http://localhost:8000/demo/generate/ddos

# Trigger all 6 threat modules simultaneously
curl -X POST http://localhost:8000/demo/run-all
```

### Cryptographic Tamper Verification API:

```bash
# Fetch latest alert ID
ALERT_ID=$(curl -s http://localhost:8000/alerts | jq -r '.alerts[0].alert.id')

# Verify cryptographic evidence chain integrity
curl -X POST http://localhost:8000/verify/$ALERT_ID
# Response: {"verified": true, "reason": "ok"}

# Run simulated tamper detection test
curl -X POST http://localhost:8000/tamper-test/$ALERT_ID
# Response: {"verified": false, "reason": "content_hash_mismatch"}
```

---

## 📂 Project Structure

```
Enclave Watch/
├── backend/                  # FastAPI Python Backend
│   ├── main.py               # Application Entrypoint & CORS configuration
│   ├── detectors/            # 6 AI/ML Detection Engine Modules
│   ├── evidence/             # SHA-256 Merkle Chain + Ed25519 Signatures & SQLite
│   ├── generator/            # Synthetic Unidirectional IP Packet Generator
│   ├── pipeline/             # Asyncio Streaming & Feature Extraction
│   └── websocket/            # Real-Time Telemetry Broadcast Manager
├── frontend/                 # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/       # Glassmorphic UI Components, Sidebar, AI Chatbot
│   │   ├── pages/            # Overview, Dashboard, Network Topology, Evidence
│   │   ├── context/          # WebSocket Provider & Global Telemetry State
│   │   └── lib/              # Framer Motion animations & API clients
├── docker-compose.yml        # Multi-container orchestration
├── LICENSE                   # MIT Open Source License
├── .gitignore                # Production ignore configuration
└── README.md                 # System documentation
```

---

## ⚖️ License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 👨‍💻 Team & Acknowledgments

Developed for **Smart India Hackathon 2026** under **Problem Statement 26145** (National Technical Research Organisation - NTRO).
