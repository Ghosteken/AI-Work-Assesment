# Design Decisions & Schema Choices

This document outlines the design decisions, schema choices, and assumptions made during the implementation of the assessment.

## Part A: FastAPI / Python Service

### Schema Decisions
- **Relational Normalization**: The briefing data is normalized into four tables: `briefings`, `briefing_points`, `briefing_risks`, and `briefing_metrics`. This allows for flexible storage of variable-length lists and ensures data integrity through foreign keys and constraints.
- **Unique Metrics**: A unique constraint was added to `(briefing_id, name)` in the `briefing_metrics` table to enforce the requirement that metric names must be unique within a single briefing.
- **Audit Fields**: Added `is_generated` and `generated_at` to the `briefings` table to track the report generation state and provide a timestamp for the rendered HTML.

### Design Decisions
- **Service Layer**: Introduced a `BriefingService` to handle the business logic of creating briefings, retrieving them, and managing the generation lifecycle. This keeps the API controllers thin and focused on HTTP concerns.
- **Report Formatter**: Implemented a `ReportFormatter` to separate the data transformation logic from the database models. This layer transforms the SQLAlchemy models into a presentation-friendly view model, handling sorting, label normalization, and display-ready metadata.
- **Jinja2 Rendering**: Used Jinja2 for server-side HTML generation. The template `report.html` is designed to be a standalone, professional internal report with embedded CSS, ensuring semantic structure and security (auto-escaping).

---

## Part B: NestJS / TypeScript Service

### Schema Decisions
- **Document Storage**: Candidate documents are stored with a `storageKey` (e.g., `local://...`) and `rawText`. While the task allowed for text-only input, this structure prepares the system for future integration with actual file storage (like S3).
- **Summary States**: Implemented a `status` field in the `candidate_summaries` table with an enum (`pending`, `completed`, `failed`) to track the lifecycle of the asynchronous summarization job.
- **Structured LLM Output**: The `candidate_summaries` table includes specific fields for `score`, `strengths`, `concerns`, and `recommendedDecision`, which are extracted from the structured LLM response.

### Design Decisions
- **Workspace Access Control**: Enforced access control at the service layer by verifying that the candidate being accessed belongs to the recruiter's `workspaceId` (provided via the `FakeAuthGuard`). This ensures data isolation between workspaces.
- **LLM Abstraction**: Used the `SummarizationProvider` interface to abstract the LLM logic. The `GeminiSummarizationProvider` implements this using the Google Generative AI SDK, while a `FakeSummarizationProvider` is used for testing and when an API key is missing.
- **Async Queue/Worker**: Implemented the summarization workflow using a background processing pattern. When a summary is requested, it is enqueued via the `QueueService`, and the processing happens asynchronously outside the request-response cycle. This ensures the API remains responsive.
- **Structured Response Validation**: Used Gemini's `responseSchema` feature (JSON mode) to ensure the LLM returns data in the exact format required by the application, minimizing the risk of malformed output.

---

## Assumptions & Tradeoffs

- **In-Memory Queue**: The `QueueService` provided in the starter is in-memory. For production, this would be replaced with a robust queue like BullMQ (Redis) or RabbitMQ to ensure persistence and reliability across service restarts.
- **Local File Paths**: Assumed that document storage is represented by local paths for this assessment, focusing on the metadata and text extraction rather than actual binary storage.
- **Simplified Auth**: Leveraged the `FakeAuthGuard` as provided, which uses headers for user identification. In a real application, this would be replaced with a proper JWT/OAuth2 implementation.

## Future Improvements

- **Pagination**: Implement pagination for listing briefings and summaries.
- **Search**: Add full-text search capabilities for candidate documents.
- **Validation Refinement**: Enhance validation with more complex rules (e.g., ticker symbol verification via external API).
- **Observability**: Add logging, tracing, and monitoring for the background worker processes.
- **File Storage**: Integrate with S3 or a similar service for actual document uploads.
