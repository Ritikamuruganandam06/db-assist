<h1 align="center">Query Genie</h1>

<p align="center">
  <strong>Not a chatbot. An agent.</strong><br/>
  Query Genie autonomously plans, writes SQL, executes queries, and updates its own context — all from a single message. Powered by LangChain's agentic framework.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/LangChain-Agent-FF6B6B?style=flat-square"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white"/>
  <img src="https://img.shields.io/badge/Anthropic_Claude-D4A574?style=flat-square"/>
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/Azure_OpenAI-0078D4?style=flat-square&logo=microsoftazure&logoColor=white"/>
</p>

<br/>

https://private-user-images.githubusercontent.com/214265469/573901098-43d2dee5-2c87-4726-8101-3a2e755bbbe3.mp4?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzUzODU1OTIsIm5iZiI6MTc3NTM4NTI5MiwicGF0aCI6Ii8yMTQyNjU0NjkvNTczOTAxMDk4LTQzZDJkZWU1LTJjODctNDcyNi04MTAxLTNhMmU3NTViYmJlMy5tcDQ_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwNDA1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDQwNVQxMDM0NTJaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04OTI5NWU3NDQzNTVjMzk3NWM1NWE0ZmRkNTBiMjI3NmMyZDVmYjIzNWViOTc5MGZiNGM2MDczYTMyZjQwNGE4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.2OCGtAyRzsYmpnt64ozn1xTgtOuMFV5XF-_8-08v4Wg

---

## Why this is interesting

| | |
|---|---|
| **Agentic architecture** | Built with LangChain's agent framework - the agent decides *when* to query, *what* SQL to write, and *how* to present results. Not a wrapper, an actual reasoning loop. |
| **Real-time tool visibility** | Watch the agent think. Every tool call and result streams to the UI live via SSE, so you see exactly what SQL ran and why. |
| **Multi-LLM support** | Swap between OpenAI, Azure OpenAI, Gemini, and Anthropic Claude with a single env variable. Same agent, different brain. |
| **Persistent memory** | Conversations are stateful across sessions using LangChain's checkpointer. The agent remembers what you built. |
| **Schema-aware prompting** | The agent always knows your current schema. DDL changes (CREATE TABLE, ALTER) automatically update the context. |
| **Full-stack, production-shaped** | FastAPI backend with SSE streaming + React frontend. Proper separation, not a notebook or demo script. |

---

## How it works

```
User message
     │
     ▼
 FastAPI (SSE stream)
     │
     ▼
 LangChain Agent  ◄──── System prompt with live schema
     │
     ├──► Tool: sql_query_execution   →  psycopg2  →  PostgreSQL
     │         (SELECT / INSERT / UPDATE / DELETE / DDL)
     │
     └──► Tool: write_markdown_schema →  Updates schema store
               (keeps agent context current after DDL)
     │
     ▼
 Streamed response (tokens + tool call events)
     │
     ▼
 React UI (renders markdown, shows tool calls in real time)
```

The agent is **not** a simple prompt-to-SQL translator. It reasons over the schema, handles multi-step operations, and decides whether to show raw data, summarize results, or ask for clarification.

---

## Tech stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) - async API with Server-Sent Events for streaming
- [LangChain](https://www.langchain.com/) - agent framework with tool use and memory checkpointing
- [psycopg2](https://www.psycopg.org/) - PostgreSQL driver

**Frontend**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- SSE-based streaming - no polling, no websockets
- Live tool call viewer - shows agent reasoning in real time

**LLM Providers**
- OpenAI
- Azure OpenAI
- Google Gemini
- Anthropic Claude

---

## Getting started

### Prerequisites
- Python 3.11+, Node.js 18+
- A PostgreSQL instance ([Docker quickstart](#postgresql-via-docker))
- API key for any one LLM provider

### PostgreSQL via Docker
```bash
docker run --name querygenie-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 -d postgres
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in your keys
uv sync                # or: pip install -e .
uv run python main.py  # → http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # → http://localhost:5173
```

### Environment variables

```env
# Required
LLM_PROVIDER=openai                        # openai | azure-openai | gemini | anthropic
POSTGRES_DB_CONNECTION_STRING=postgresql://user:password@localhost:5432/mydb

# OpenAI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1

# Anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Gemini
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# Azure OpenAI
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=gpt-4.1
OPENAI_API_VERSION=2025-03-01-preview
```

---

## Project structure

```
query-genie/
├── backend/
│   └── app/
│       ├── agent.py         # LangChain agent - the core reasoning loop
│       ├── model.py         # Multi-provider LLM factory
│       ├── tools.py         # SQL execution + schema update tools
│       ├── api.py           # FastAPI routes + SSE streaming
│       ├── database.py      # PostgreSQL connection management
│       ├── prompt.py        # Schema-aware system prompt
│       └── schema_store.py  # Persistent schema state
└── frontend/
    └── src/
        ├── App.jsx               # State management + API orchestration
        └── components/
            ├── Chat.jsx          # Message renderer + SSE stream handler
            ├── Sidebar.jsx       # Thread management + theme switcher
            └── SchemaDisplay.jsx # Live schema panel
```
