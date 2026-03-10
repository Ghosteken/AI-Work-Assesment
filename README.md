# Backend Engineering Take-Home Assessment

This repository contains a dual-service backend application designed to handle financial briefings and candidate summarization.

## Project Structure

- `python-service/`: FastAPI service for generating mini briefing reports (Part A).
- `ts-service/`: NestJS service for candidate document intake and async summarization (Part B).
- `docker-compose.yml`: Infrastructure setup (PostgreSQL).

---

## Manual Verification Scripts

I have provided two automated PowerShell scripts in the root directory to test the services with realistic data:

### **1. Python Service Test**
Tests the full lifecycle of a briefing report for a sample company (Tesla).
```powershell
powershell -File test_python_service.ps1
```
- **Actions**: Creates briefing -> Generates HTML -> Fetches JSON verification.
- **Result**: Provides a direct link to the professional HTML report.

### **2. TypeScript Service Test**
Tests the recruiter workflow with a live AI summarization call using Gemini.
```powershell
powershell -File test_ts_service.ps1
```
- **Actions**: Onboards candidate -> Uploads document -> Triggers AI Summary -> Waits for worker -> Displays results.
- **Result**: Prints the AI-generated score, strengths, and candidate summary to the console.

---

## Part A: Mini Briefing Report Generator (Python)

### Setup & Run
1.  **Database**: Ensure the Docker database is running:
    ```bash
    docker compose up -d postgres
    ```
2.  **Install Dependencies**:
    ```bash
    cd python-service
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    ```
3.  **Run Migrations**:
    ```bash
    python -m app.db.run_migrations up
    ```
4.  **Start Service**:
    ```bash
    $env:PYTHONPATH = (Get-Item .).FullName
    uvicorn app.main:app --port 8000 --reload
    ```
5.  **Test**:
    ```bash
    python -m pytest tests/test_briefings.py
    ```

### Key Features
- **Relational Data**: Normalized tables for briefings, points, risks, and metrics.
- **Validation**: Strict Pydantic validation for mandatory fields, ticker normalization, and minimum list lengths.
- **HTML Reports**: Professional Jinja2 templates with dynamic data injection.

---

## Part B: Candidate Summarization Workflow (TypeScript)

### Setup & Run
1.  **Install Dependencies**:
    ```bash
    cd ts-service
    npm install
    ```
2.  **Environment**: Copy `.env.example` to `.env` and provide a `GEMINI_API_KEY` (optional, falls back to mock).
3.  **Run Migrations**:
    ```bash
    npm run migration:run
    ```
4.  **Start Service**:
    ```bash
    npm run start:dev
    ```
5.  **Test**:
    ```bash
    npm run test src/candidates/candidate.service.spec.ts
    ```

### Key Features
- **Async Workflow**: Queue/worker pattern for summary generation using fire-and-forget background tasks.
- **Access Control**: Strict workspace-level isolation for all candidate data.
- **LLM Integration**: Abstracted `SummarizationProvider` with support for Google Gemini API.

---

## Design Decisions & Tradeoffs (NOTES)

### Data Modeling
- **Part A**: Used a fully normalized relational schema instead of JSONB for metrics/points to ensure data integrity and easier querying for future analytics.
- **Part B**: Implemented a state machine for summaries (`pending` -> `completed`/`failed`) to provide clear feedback to the recruiter via the API.

### Infrastructure
- **Port Mapping**: Moved the PostgreSQL container to port `5433` in `docker-compose.yml` to prevent conflicts with local database installations.

### Improvements with More Time
- **Real Queue**: Replace the internal `processJob` fire-and-forget logic with a robust message broker like Redis/BullMQ.
- **S3 Storage**: Use actual cloud storage (S3/GCS) for candidate documents instead of local mock paths.
- **Authentication**: Implement JWT-based auth instead of the current `FakeAuthGuard` headers.

---
