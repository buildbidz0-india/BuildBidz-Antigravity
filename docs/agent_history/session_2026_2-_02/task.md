# Persistence & Documentation Implementation

- [ ] Research Database & Artifacts <!-- id: 0 -->
- [/] **Runtime Persistence (PostgreSQL)** <!-- id: 1 -->
    - [x] Create SQL schema for `agent_logs` and `award_decisions` <!-- id: 2 -->
    - [x] Implement DB models/repositories in backend <!-- id: 3 -->
    - [x] Integrate DB saving into `ai.py` (Chat) <!-- id: 4 -->
    - [x] Integrate DB saving into `award_engine.py` (Awards) <!-- id: 5 -->
- [/] **Meta-Persistence (Repository History)** <!-- id: 6 -->
    - [/] Create `docs/agent_history` directory <!-- id: 7 -->
    - [/] Copy current brain artifacts (task, plan, walkthrough) to codebase <!-- id: 8 -->
    - [ ] Sync logic to auto-archive these files (script? or just one-off?) -> *User asked for "automatically", implies a process or hook, but for now copying them is the first step.* <!-- id: 9 -->
- [ ] Verify persistence <!-- id: 10 -->
