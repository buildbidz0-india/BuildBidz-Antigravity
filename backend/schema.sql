
-- BuildBidz Database Schema
-- Run this to initialize the tables for Phase 9 features

-- Projects Table (Existing)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    progress INTEGER DEFAULT 0,
    deadline TIMESTAMP,
    image TEXT,
    team_json JSONB DEFAULT '[]',
    milestones_json JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tenders Table (Phase 9)
CREATE TABLE IF NOT EXISTS tenders (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Open', -- Open, Closed, Reviewing
    deadline TIMESTAMP,
    min_budget NUMERIC(15, 2),
    max_budget NUMERIC(15, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bids Table (Phase 9)
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER REFERENCES tenders(id),
    contractor_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Shortlisted, Rejected, Accepted
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Agent Logs (For AI copilot history)
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    session_id TEXT,
    timestamp TIMESTAMP,
    agent_name TEXT,
    role TEXT,
    content TEXT,
    metadata_json JSONB
);

-- Award Decisions (For audit trail)
CREATE TABLE IF NOT EXISTS award_decisions (
    id SERIAL PRIMARY KEY,
    project_id TEXT,
    timestamp TIMESTAMP,
    winner_bid_id TEXT,
    winner_supplier TEXT,
    score NUMERIC(5, 2),
    justification TEXT,
    rankings_json JSONB
);
