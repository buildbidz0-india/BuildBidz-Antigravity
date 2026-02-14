# Persistence & Documentation Implementation

## Goal
To automatically save:
1.  **AI Chat History & Decisions:** Persist all agent interactions and award justifications to the PostgreSQL database for future reference and auditing.
2.  **Planning Artifacts:** Archive the current planning documents (`task.md`, `implementation_plan.md`, etc.) into the codebase so future agents can understand the context.

## Proposed Changes

### [Backend / Database]
#### [NEW] [backend/app/db/models.py](file:///c:/Users/user/.gemini/antigravity/scratch/BuildBidz-Antigravity/backend/app/db/models.py)
- Define `AgentLog` table: Stores chat history (User/AI) for all agents.
- Define `AwardDecision` table: Stores the results of the "Compare & Award" engine.

#### [NEW] [backend/app/db/repository.py](file:///c:/Users/user/.gemini/antigravity/scratch/BuildBidz-Antigravity/backend/app/db/repository.py)
- `log_agent_interaction(session_id, agent_name, role, content)`
- `save_award_decision(project_id, winner_id, score, justification, details)`

#### [NEW] [backend/scripts/init_db.py](file:///c:/Users/user/.gemini/antigravity/scratch/BuildBidz-Antigravity/backend/scripts/init_db.py)
- Script to initialize the database tables (since we aren't using Alembic yet).

### [Backend / Services]
#### [MODIFY] [backend/app/api/v1/endpoints/ai.py](file:///c:/Users/user/.gemini/antigravity/scratch/BuildBidz-Antigravity/backend/app/api/v1/endpoints/ai.py)
- Inject `log_agent_interaction` to save chat request/response pairs.

#### [MODIFY] [backend/app/services/award_engine.py](file:///c:/Users/user/.gemini/antigravity/scratch/BuildBidz-Antigravity/backend/app/services/award_engine.py)
- Inject `save_award_decision` to persist the recommendation after generation.

### [Documentation / Meta-Persistence]
#### [NEW Directory] `docs/agent_history/session_2026_02_14`
- Copy `task.md`, `implementation_plan.md`, `walkthrough.md` to this folder.

## Verification Plan
### Automated
- Run `backend/scripts/init_db.py` to create tables.
- Run `verify_router.py` (modified to check DB) or a new `verify_persistence.py`.
