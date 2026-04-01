# Implementation Plan — RBC Lab

## Overview

The system is built in 5 sequential phases. Each phase produces a working, testable increment.
Dependencies flow top-down: later phases build on earlier ones.

---

## Phase 1 — Project Scaffold & Infrastructure

**Goal:** Get the project skeleton, tooling, and local environment running before writing any feature code.

### Phase 1 Tasks

1. Initialize project repository structure:

   ```text
   lab-rbc/
   ├── frontend/          # Next.js app
   ├── backend/           # FastAPI app
   ├── cv/                # YOLOv8 detection module
   ├── docker/            # Dockerfiles
   ├── storage/           # Images and generated PDFs (gitignored)
   ├── docker-compose.yml
   └── .env.example
   ```

2. Set up the **Frontend** container:
   - Scaffold Next.js app inside `frontend/`
   - Write `docker/Dockerfile.frontend`
   - Add frontend service to `docker-compose.yml`: host port **3000** → container port **3000**, with hot-reload volume mount

3. Set up the **Backend**:
   - Scaffold FastAPI app inside `backend/`
   - Create `backend/requirements.txt`: `fastapi`, `uvicorn`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `ultralytics`, `opencv-python`, `ollama`, `reportlab`
   - Run backend natively: `uvicorn main:app --reload --port 8000`
   - Implement `GET /health` endpoint returning `{ "status": "ok" }`

4. Set up **PostgreSQL**:
   - Add PostgreSQL service to `docker-compose.yml` on port **5432**
   - Configure `DATABASE_URL=postgresql://user:password@localhost:5432/rbclab` in `.env`

5. Verify **Ollama**:
   - Ollama 0.14.3 is already installed on host at port **11434** — no install needed
   - `llama3.2:latest` is already pulled — no download needed
   - Confirm `POST http://localhost:11434/api/generate` is reachable from backend

6. Run the full stack and verify all services communicate.

**Exit criteria:** `docker compose up` starts the frontend (port 3000) and PostgreSQL (port 5432); backend on port 8000 returns `200` from `GET /health`; Ollama responds on port 11434.

---

## Phase 2 — Data Model & Patient Input

**Goal:** Define the database schema and implement the patient profile + image upload flow end-to-end.

### Phase 2 Tasks

1. Define **SQLAlchemy models** in `backend/models.py`:
   - `Patient` — demographics and lab metadata
   - `TestRecord` — links patient to a test session
   - `Image` — original and annotated image file paths
   - `RBCResult` — count and JSON metadata per image
   - `Report` — text content and PDF file path

2. Write **Alembic migrations** and apply to PostgreSQL.

3. Implement **Backend API endpoints**:

   | Method | Path | Description |
   | --- | --- | --- |
   | POST | `/patients` | Register a new patient |
   | GET | `/patients/{id}` | Retrieve patient profile |
   | POST | `/tests` | Create a new test record for a patient |
   | POST | `/tests/{id}/images` | Upload one or more blood smear images |
   | GET | `/tests/{id}` | Get test record with associated images and results |

4. Implement **file storage** for uploaded images:
   - Save originals to `storage/images/original/{test_id}/`
   - Return stored file path in API response

5. Build the **Frontend patient intake form**:
   - Fields: name, age, sex, patient ID, date of test, requesting physician, lab technician, specimen type
   - Image upload component with preview (supports multiple images)
   - Submit flow: `POST /patients` → `POST /tests` → `POST /tests/{id}/images`

**Exit criteria:** A lab user can fill in the patient form, upload images, and see the record persisted in the database.

---

## Phase 3 — RBC Detection & Counting

**Goal:** Implement the CV pipeline that detects and counts RBCs from uploaded images and stores results.

### Phase 3 Tasks

1. Set up the **CV module** in `cv/`:
   - Install `ultralytics` and `opencv-python`
   - Download or fine-tune YOLOv8 weights on an RBC dataset (e.g., BCCD Dataset)
   - Write `cv/detector.py` exposing a single function:

     ```python
     def detect(image_path: str) -> DetectionResult:
         # returns: rbc_count, annotated_image_path, metadata
     ```

2. Integrate the CV module into the **Backend**:
   - Add `POST /tests/{id}/analyze` — triggers detection on all uploaded images for the test
   - For each image: run `detector.detect()`, save annotated image to `storage/images/annotated/{test_id}/`, write `RBCResult` row to DB
   - Return aggregate count (sum across all images) and per-image breakdown

3. Build the **Frontend analysis view**:
   - After image upload, show an "Analyze" button
   - On click, call `POST /tests/{id}/analyze`
   - Display a loading state during inference
   - On completion, show: total RBC count, per-image count table, and annotated image previews

**Exit criteria:** Uploaded images are analyzed, cells are counted and annotated, results are displayed in the UI and persisted in the database.

---

## Phase 4 — LLM Report Generation

**Goal:** Generate a structured clinical report from the RBC count results and patient profile using the local LLM, and persist it.

### Phase 4 Tasks

1. Write the **prompt template** in `backend/prompts/report_template.txt`:
   - Include patient demographics, test date, RBC count per image, and total count
   - Instruct the model to produce three sections: **Findings**, **Interpretation**, **Remarks**
   - Set a consistent output format so the response is parseable

2. Implement the **LLM service** in `backend/services/llm.py`:
   - Call Ollama at `POST http://localhost:11434/api/generate` with model `llama3.2`
   - Pass the populated prompt template
   - Parse and return the structured report text

3. Implement **PDF generation** in `backend/services/pdf.py`:
   - Use `reportlab` to render the report text + patient header + annotated images into a PDF
   - Save PDF to `storage/reports/{test_id}/report.pdf`

4. Add **Backend endpoints**:

   | Method | Path | Description |
   | --- | --- | --- |
   | POST | `/tests/{id}/report` | Generate report via LLM and save to DB |
   | GET | `/tests/{id}/report` | Retrieve report content and PDF download link |

5. Build the **Frontend report view**:
   - After analysis, show a "Generate Report" button
   - Display the three report sections (Findings, Interpretation, Remarks) in a readable layout
   - Provide a "Download PDF" button linking to the PDF file

**Exit criteria:** A report is generated from LLM output, displayed in the UI, downloadable as PDF, and stored in the database.

---

## Phase 5 — Record Management & Polish

**Goal:** Allow users to search and retrieve past records, and harden the system for real lab use.

### Phase 5 Tasks

1. Implement **record retrieval endpoints**:

   | Method | Path | Description |
   | --- | --- | --- |
   | GET | `/tests` | List all test records (filterable by patient ID, date range) |
   | GET | `/tests/{id}/report/pdf` | Download the PDF for a test |

2. Build the **Frontend records list**:
   - Table view of all past tests with patient name, date, total RBC count, and report status
   - Search/filter by patient ID and date
   - Click a row to view the full test detail and report

3. **Input validation & error handling**:
   - Validate patient form fields (required fields, value ranges for age)
   - Return meaningful error messages from the API for missing/invalid input
   - Handle LLM timeout or failure gracefully (show error, allow retry)

4. **Environment configuration**:
   - All secrets and service addresses in `.env`: `DATABASE_URL`, `OLLAMA_HOST`, `STORAGE_PATH`
   - Document all required environment variables in `README.md`

5. **End-to-end testing**:
   - Manual walkthrough of the full flow: patient input → image upload → analyze → report → download
   - Fix any integration issues found during testing

**Exit criteria:** Full workflow operates end-to-end without errors; past records are searchable and viewable; the system handles edge cases gracefully.

---

## Port Reference

| Service | Port | Where it runs |
| --- | --- | --- |
| Frontend (Next.js) | 3000 | Docker container |
| Backend (FastAPI) | 8000 | Host (native) |
| PostgreSQL | 5432 | Docker container |
| Ollama | 11434 | Host (already running) |

**Avoid:** ports `5000`, `7000`, `7265`, `7768` — occupied on host.

---

## Dependency & Sequencing Summary

```text
Phase 1 — Scaffold & Infrastructure
    └── Phase 2 — Data Model & Patient Input
            └── Phase 3 — RBC Detection & Counting
                    └── Phase 4 — LLM Report Generation
                            └── Phase 5 — Record Management & Polish
```

---

## Open Questions to Resolve Before Phase 3

- Which pretrained YOLO weights to use — BCCD-trained vs. custom fine-tune?
- Is the host machine CPU-only or does a GPU available for YOLO inference?
- Authentication / access control required, or single-user local tool?
