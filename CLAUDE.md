# RBC Lab — Red Blood Cell Counting System

## Project Overview

A medical laboratory support system for automated Red Blood Cell (RBC) counting from blood smear images.
The system accepts patient profiles and microscopy images, detects and counts RBCs using computer vision,
generates a clinical report via a locally-running LLM, and persists all data to a database.

All AI inference (counting model + LLM) runs fully offline — no external API calls.

---

## Environment

| Tool | Version |
| --- | --- |
| Node.js | 23.11.0 |
| Python | 3.13.0 |
| pip | 24.2 |
| Docker | 28.3.2 |
| Docker Compose | v2.39.1 |
| Ollama | 0.14.3 (installed, host-native) |

**Available Ollama models (already pulled):**

- `llama3.2:latest` (2.0 GB) — primary model for report generation
- `deepseek-r1:latest` (5.2 GB) — alternative if higher reasoning quality is needed

---

## Feature Specifications

### 1. Patient Profile Input

- Collect patient demographics: name, age, sex, patient ID, date of test
- Collect lab metadata: requesting physician, lab technician, specimen type
- Upload one or more blood smear microscopy images per session

### 2. RBC Counting

- Detect and count individual Red Blood Cells in the uploaded image(s)
- Output: total RBC count, count per image, and an annotated image showing detected cells
- Model runs locally (no cloud inference)

### 3. Report Generation

- Feed RBC count results + patient profile into a locally-running LLM
- LLM produces a structured clinical summary (findings, interpretation, remarks)
- Report must be human-readable and exportable as PDF

### 4. Data Persistence

- Store per record: patient profile, original image(s), annotated image(s), RBC count results, generated report
- All records queryable by patient ID and test date

### 5. Containerized Frontend

- The frontend application runs inside a Docker container
- Backend, CV model, LLM, and database run outside the container on the host

---

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│  Docker Container                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Frontend  (React / Next.js)                │   │
│  └─────────────────────┬───────────────────────┘   │
└────────────────────────│────────────────────────────┘
                         │ HTTP / REST
          ┌──────────────▼──────────────┐
          │  Backend API  (FastAPI)      │
          └──┬──────────┬───────────────┘
             │          │
     ┌───────▼──┐  ┌────▼────────────────┐
     │ CV Model │  │  Ollama             │
     │ (YOLOv8 +│  │  llama3.2:latest    │
     │  OpenCV) │  └─────────────────────┘
     └───────┬──┘
             │
     ┌───────▼──────────────┐
     │  PostgreSQL          │
     └──────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | React + Next.js | Runs in Docker container |
| Backend | Python 3.13 + FastAPI | REST API, orchestrates all services |
| RBC Detection | YOLOv8 + OpenCV | Runs locally, no cloud inference |
| Local LLM | Ollama 0.14.3 + llama3.2 | Already installed and pulled |
| Database | PostgreSQL + SQLAlchemy | Stores patients, images, reports |
| Containerization | Docker + Docker Compose | Frontend container only (per spec) |

See [tech_stack.md](tech_stack.md) for detailed rationale on each choice.

---

## Data Model (Draft)

```text
Patient
  id, name, age, sex, patient_id, requesting_physician, lab_technician, specimen_type, created_at

TestRecord
  id, patient_id, test_date, status

Image
  id, test_record_id, original_path, annotated_path, uploaded_at

RBCResult
  id, test_record_id, image_id, rbc_count, metadata (JSON)

Report
  id, test_record_id, content (text), pdf_path, generated_at
```

---

## Port Assignments

| Service | Port | Status |
| --- | --- | --- |
| Frontend (Next.js, Docker) | 3000 | free |
| Backend (FastAPI) | 8000 | free |
| PostgreSQL | 5432 | free |
| Ollama | 11434 | already running on host |

Avoid: `5000`, `7000`, `7265`, `7768` — occupied on host.

---

## Constraints & Decisions

| Concern | Decision |
| --- | --- |
| LLM inference | Fully local via Ollama — no OpenAI / Anthropic / cloud APIs |
| LLM model | `llama3.2:latest` (primary); `deepseek-r1:latest` available as fallback |
| Frontend deployment | Docker container only |
| Image storage | Filesystem (paths stored in DB) — not DB blobs |
| Report format | PDF export + raw text stored in DB |
| CV model execution | Local — model weights bundled or downloaded on first run |
| Port allocation | 3000 (frontend), 8000 (backend), 5432 (postgres), 11434 (ollama) |

---

## Open Questions

- Which pretrained YOLO weights perform best on RBC microscopy datasets (BCCD vs. custom)?
- Is the host machine CPU-only or does it have a GPU available for inference?
- Authentication / access control required, or single-user local tool?
- Should the system support batch processing of multiple patients?
