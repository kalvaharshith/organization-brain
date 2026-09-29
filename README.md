# Organizational Brain

An AI organizational memory that combines current organizational state, current knowledge, and historical experience to help teams solve new problems and learn from outcomes.

## Overview

The Organizational Brain helps an organization solve problems using:

1. Canonical organizational state
2. RAG current knowledge
3. Hindsight historical experience

The workflow is simple:

Problem
→ retrieve knowledge and experience
→ reason across projects
→ recommendation
→ human action
→ outcome
→ lesson
→ Hindsight
→ future retrieval

## Why Hindsight

Hindsight stores organizational experience, including:

- what happened
- what was tried
- what failed
- what worked
- decisions
- outcomes
- lessons

This is different from ordinary document RAG. RAG retrieves current reference material and policies. Hindsight captures historical experience, decisions, tradeoffs, and outcomes so the system can learn from what happened before.

## Architecture

User
↓
React frontend
↓
FastAPI backend
↓
Canonical DB + RAG + Hindsight
↓
Context builder
↓
Cross-project reasoning
↓
LLM
↓
Recommendation
↓
Outcome
↓
Hindsight learning

## Data Layers

### Canonical Database

Current organizational facts and state.

### RAG

Current/reference organizational knowledge.

### Hindsight

Historical organizational experience.

## Core Workflow

New Problem
→ Current State
→ RAG Knowledge
→ Hindsight Experience
→ Cross-Project Reasoning
→ Recommendation
→ Outcome
→ Lesson
→ New Hindsight Memory
→ Future Retrieval

## Demonstration

The seeded scenario follows Phoenix → Atlas → Nova.

Phoenix:
- historical migration problem
- failed approach
- successful approach
- lesson

Atlas:
- similar problem
- Phoenix retrieved
- recommendation
- actual outcome
- new lesson stored

Nova:
- new related problem
- Phoenix + Atlas experiences retrieved

## Current Seeded Data

The current implementation is seeded with verified demo data:

- 18 projects
- 25 tasks
- 20 people
- 14 RAG records
- 25 Hindsight experiences
- 11 successful
- 7 failed
- 7 partial
- 5 decision/tradeoff experiences

## Tech Stack

### Backend

- Python
- FastAPI
- Hindsight
- RAG
- Groq/LLM integration
- SQLite/local database layer
- pypdf
- python-docx

### Frontend

- React
- TypeScript
- Vite
- lucide-react

## Project Structure

```text
organizational-brain/
├── README.md
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   ├── services/
│   │   └── ...
│   ├── seed/
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       ├── views/
│       ├── types/
│       └── data/
└── docs/
   └── README.md

```

## Setup

### Backend

1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   cd backend
   python -m pip install -r requirements.txt
   ```
3. Copy the example environment file and fill in the required values:
   ```bash
   cp .env.example .env
   ```
4. Start the API:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite app:
   ```bash
   npm run dev
   ```

### Docker

If you want to run the stack with Docker Compose:

```bash
docker compose up --build
```

## Environment Variables

List of environment variables used by the app:

- HINDSIGHT_API_KEY
- HINDSIGHT_BANK_ID
- HINDSIGHT_BASE_URL
- GROQ_API_KEY
- GROQ_MODEL
- DATABASE_URL
- EMBEDDING_MODEL
- EMBEDDING_DIM
- UPLOAD_DIR
- SEED_ON_START
- TOP_K
- CHUNK_SIZE
- CHUNK_OVERLAP
- ALLOWED_ORIGINS
- VITE_API_BASE_URL

## Testing

The current implementation was validated with:

- Backend: `python -m pytest`
- Frontend: `npm run lint`
- Frontend: `npm run build`

The complete learning flow was verified, including current state retrieval, RAG recall, Hindsight memory recall, and outcome recording.

## Demo Flow

The demo is designed to run in roughly 60-90 seconds:

1. Enter Atlas problem
2. Retrieve Phoenix experience
3. Show RAG evidence
4. Show recommendation
5. Record Atlas outcome
6. Store lesson in Hindsight
7. Ask Nova
8. Show Phoenix + new Atlas memory

## Design Principles

- Hindsight is historical experience
- RAG is current knowledge
- canonical DB is current state
- no fabricated evidence
- evidence lineage
- learn from outcomes
- deterministic seeded data

## License

This repository does not currently declare a license.

# organization-brain
