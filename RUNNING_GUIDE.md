# Codex Detective — Running Guide

> **Codex Detective** is an Autonomous AI Multi-Agent Software Engineer Workspace.
> This guide covers how to run the project manually (no Docker) on Windows.

---

## 🚀 Quick Start (One Click)

Double-click **`run.bat`** in the project root (`d:\Codex\run.bat`).
It will:
1. Create the Python virtual environment (first time)
2. Install backend + frontend dependencies (first time)
3. Start the **Backend** at `http://localhost:8000`
4. Start the **Frontend** at `http://localhost:5173`
5. Open the browser automatically

---

## 🛠️ Manual Run

### 1. Backend (FastAPI)

Open a terminal and run:

```powershell
cd d:\Codex\backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: **http://localhost:8000**
- Swagger docs: **http://localhost:8000/docs**

### 2. Frontend (React + Vite)

Open a **second** terminal and run:

```powershell
cd d:\Codex\frontend
npm install
npm run dev
```

- App: **http://localhost:5173** (or **5174** if 5173 is busy — check terminal output)

---

## 🔑 API Keys (Optional but Recommended)

For real AI reasoning in the agents, set keys in `backend\.env`:

```
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

Without keys, the app runs but agents use static/heuristic analysis (no LLM).

---

## 🗄️ Database

| Mode | Connection |
|------|-----------|
| **SQLite (default)** | File: `d:\Codex\backend\codex_detective.db` — zero config, auto-created |
| **Postgres (Docker)** | `postgresql+asyncpg://codex_user:codex_password@localhost:5432/codex_detective` |

Tables are created automatically at backend startup:
`users`, `projects`, `repositories`, `issues`, `fixes`, `reports`, `ai_requests`, `sessions`, `logs`.

---

## 🐳 Docker Compose (Alternative)

```powershell
cd d:\Codex
docker-compose up --build
```

- Frontend: **http://localhost**
- Backend: **http://localhost:8000**
- Postgres: `localhost:5432` / Redis: `localhost:6379`

---

## ✅ Verified Fixes Applied

1. **CORS** — `backend/app/main.py` now allows the Vite dev ports (`5173`, `5174`, etc.).
2. **bcrypt/passlib** — `backend/requirements.txt` pins `bcrypt==4.1.3` to avoid the
   `passlib` + `bcrypt>=5` incompatibility crash.

---

## ❓ Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 8000 in use | Change `--port 8001` in the uvicorn command |
| Port 5173 in use | Vite auto-switches to 5174 — use that URL |
| `bcrypt` version error | Run `pip install bcrypt==4.1.3` in the backend venv |
| Registration 400 | The email is already registered — use a new email |
| `python` not found | Install Python 3.10+ and check "Add to PATH" during install |
| `npm` not found | Install Node.js 18+ from https://nodejs.org |

