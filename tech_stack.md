# Tech Stack — RBC Lab

This document explains each technology selected for the RBC Lab system, its role, and why it was chosen over alternatives.

---

## 1. Frontend — React + Next.js

**Role:** The user-facing interface where lab staff enter patient profiles, upload blood smear images, trigger analysis, and view or download reports.

**Contribution to the system:**

- **React** provides a component-based UI, making it straightforward to build reusable form elements (patient input), image upload previews, and report viewers.
- **Next.js** adds file-based routing, server-side rendering capability, and a built-in API proxy layer — useful for forwarding requests to the backend without exposing it directly to the browser.
- Runs inside a **Docker container** on port **3000**, satisfying the project constraint that the frontend is the containerized component.

**Why not alternatives:**

- Plain HTML/JS — too manual for a form-heavy, multi-step workflow.
- Vue / Angular — React ecosystem has broader library support for medical UI patterns and image handling.

---

## 2. Backend — Python + FastAPI

**Role:** The central orchestration layer. Receives requests from the frontend, coordinates the CV model, LLM, and database, and returns results.

**Contribution to the system:**

- **FastAPI** exposes REST endpoints for each major operation: patient registration, image upload, RBC counting, report generation, and record retrieval. Runs on port **8000** via uvicorn.
- **Python 3.13** is the natural language for both computer vision (OpenCV, Ultralytics YOLO) and LLM integration (Ollama Python SDK), keeping the entire backend in one language with no cross-language bridges.
- Async support in FastAPI handles long-running tasks (model inference, LLM generation) without blocking the server.
- Auto-generated OpenAPI docs (`/docs`) make it easy to test endpoints during development.

**Why not alternatives:**

- Node.js / Express — weaker ecosystem for CV and ML libraries.
- Django — heavier framework than needed; REST-only API doesn't require Django's full ORM + admin stack.
- Flask — lacks native async support and auto-validation that FastAPI provides out of the box.

---

## 3. RBC Detection — YOLOv8 + OpenCV

**Role:** Detects and counts individual Red Blood Cells in each uploaded microscopy image, and produces an annotated output image marking each detected cell.

**Contribution to the system:**

- **YOLOv8** (Ultralytics) is a real-time object detection model well-suited for cell detection tasks. It can be fine-tuned on RBC microscopy datasets (e.g., BCCD Dataset) to accurately identify and localize individual cells.
- **OpenCV** handles all image preprocessing steps — resizing, normalization, color space conversion — before images are passed to the model, and post-processing steps such as drawing bounding boxes on the annotated output image.
- Both run entirely on local hardware (CPU or GPU), satisfying the no-cloud-inference constraint.

**Why not alternatives:**

- Pure OpenCV (classical methods: Hough circles, watershed) — lower accuracy on overlapping or irregular cells common in real blood smears.
- Other YOLO versions — YOLOv8 offers the best balance of speed, accuracy, and ease of fine-tuning with the Ultralytics Python library.
- Cloud Vision APIs — excluded by the offline constraint.

---

## 4. Local LLM — Ollama + LLaMA 3

**Role:** Generates the clinical narrative report from structured RBC count data and patient profile information, without any internet connection.

**Contribution to the system:**

- **Ollama 0.14.3** is already installed and running on the host at port **11434**. It serves open-weight LLMs via a local REST API. The FastAPI backend calls `POST http://localhost:11434/api/generate` exactly as it would call a cloud LLM API, but everything stays on the local machine.
- **`llama3.2:latest`** (2.0 GB, already pulled) is the primary model — a high-quality open-weight model capable of producing coherent, structured clinical text from a prompt containing RBC count results and patient context.
- **`deepseek-r1:latest`** (5.2 GB, already pulled) is available as a fallback if higher reasoning quality is needed for report generation.
- The prompt template will instruct the model to produce a fixed-structure report: **Findings**, **Interpretation**, and **Remarks** sections — keeping output predictable and parseable.

**Why not alternatives:**

- OpenAI / Anthropic APIs — excluded; project requires fully offline inference.
- llama.cpp directly — more complex setup; Ollama wraps it with a clean API and model management CLI.
- Other models — `llama3.2` chosen as primary because it is already available on the host; no additional download required.

---

## 5. Database — PostgreSQL + SQLAlchemy

**Role:** Persistent storage for all system data: patient profiles, test records, image file paths, RBC count results, and generated reports.

**Contribution to the system:**

- **PostgreSQL** is a production-grade relational database that supports JSON columns (used for storing RBC result metadata), full-text search, and robust querying by patient ID and date range. Runs on port **5432**.
- **SQLAlchemy** (with Alembic for migrations) provides Python ORM models that map directly to the data model defined in the spec, keeping database logic in Python rather than raw SQL strings.
- Storing image **paths** (not blobs) in PostgreSQL keeps the database lean while large files live on the filesystem.

**Why not alternatives:**

- SQLite — suitable for single-user local tools but lacks concurrent write support; PostgreSQL is safer for a lab environment with potential multi-user access.
- MongoDB — a relational structure fits this domain better; patient → test record → image → result is a clear relational hierarchy.
- MySQL — PostgreSQL's JSON support and open-source ecosystem are preferred.

---

## 6. Containerization — Docker + Docker Compose

**Role:** Packages the frontend into a portable, reproducible container. Docker Compose orchestrates the frontend container alongside the other host services during development and deployment.

**Contribution to the system:**

- **Docker** ensures the frontend runs identically across environments (developer machines, lab workstation) without dependency conflicts.
- **Docker Compose** defines the full local development environment in a single `docker-compose.yml` file — frontend container, and optionally PostgreSQL and Ollama as additional services for convenience.
- Per project spec, only the frontend is containerized; the backend, CV model, and LLM run natively on the host (or via their own service processes).

**Why not alternatives:**

- Kubernetes — excessive complexity for a local/single-machine deployment.
- Bare process management — no containerization means environment drift across machines.

---

## Summary Table

| Technology | Layer | Primary Role |
| --- | --- | --- |
| React + Next.js | Frontend | UI — port 3000 (Docker container) |
| FastAPI (Python 3.13) | Backend | REST API — port 8000 (host) |
| YOLOv8 + OpenCV | CV / Detection | Cell detection, counting, image annotation (host) |
| Ollama 0.14.3 + llama3.2 | LLM | Offline report generation — port 11434 (host) |
| PostgreSQL + SQLAlchemy | Database | Persistent storage — port 5432 (host) |
| Docker + Docker Compose | Infrastructure | Frontend container only |
