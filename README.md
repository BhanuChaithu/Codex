# Codex Detective 🕵️‍♂️
> An Autonomous AI Multi-Agent Software Engineer Workspace

Codex Detective is a production-quality, multi-agent AI system designed to analyze repositories, locate logic flaws, audit security leaks (OWASP Top 10), suggest performance optimizations, generate unified git diff patches, compile unit test suites, and draft comprehensive documentation manuals automatically.

---

## 🏗️ System Architecture

The application implements a serial supervisor-planner pipeline where dedicated LLM/static agents communicate results and status updates back to the coordinating manager.

```
AI Planner (Supervisor)
   │
   ├───► Repository Analyzer Agent (LOC, frameworks, files structural tree)
   ├───► Bug Hunter Agent (Syntax errors, infinite loop traps, unused imports)
   ├───► Security Agent (SQL injections, exposed credentials, XSS risks)
   ├───► Performance Agent (Deep nested loops O(N^2), blocking async sleep calls)
   ├───► Auto Fix Agent (Compiles git diff patches and writes corrections to files)
   ├───► Test Generator Agent (Drafts Jest and Pytest unit test suites)
   └───► Documentation Agent (Compiles custom README and API description tables)
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Monaco Editor, Recharts, Framer Motion.
- **Backend**: FastAPI, Python 3.12, SQLAlchemy v2, Async SQLite/Postgres.
- **Queue/Cache**: Redis.
- **Deployment**: Docker, Docker Compose, Nginx.

---

## 🚀 Getting Started

### Local Running Mode

#### 1. Backend Service
1. Navigate to directory:
   ```bash
   cd backend
   ```
2. Create python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure key secrets in backend `.env` file (copy from root `.env` template):
   ```bash
   # Add your OpenAI / Gemini API Keys to activate LLM reasoning
   OPENAI_API_KEY=your_key
   ```
5. Run server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The server runs at `http://localhost:8000`. Swagger API docs are accessible at `http://localhost:8000/docs`.*

#### 2. Frontend React Client
1. Navigate to directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run client dev-server:
   ```bash
   npm run dev
   ```
   *Open browser client at `http://localhost:5173`.*

---

### Docker Compose Run Mode (Containers)

Deploy the entire microservice structure (including Postgres and Redis) in one click:
```bash
docker-compose up --build
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`

---

## 🛡️ Security Measures

- **JWT Authentication**: Token validation guards user access endpoints.
- **Input Sanitization**: Zip-slip protection checks path traversal vectors when extracting archives.
- **Parameterized SQL**: Enforces SQL statement binding models.
