# DB Assist - Backend

A conversational AI agent that helps manage PostgreSQL databases through natural language. It handles both DDL (schema design) and DML (data manipulation) operations via an interactive chat interface with streaming support.

## Prerequisites

- Python >= 3.11
- A running PostgreSQL instance
- API key for at least one supported LLM provider

## Getting Started

### 1. Set up PostgreSQL

For simplicity, use a Docker container:

```bash
docker run --name learn-db-container -e POSTGRES_USER=username -e POSTGRES_PASSWORD=password -e POSTGRES_DB=learndb -p 5432:5432 -d postgres
```

This gives you a connection string of:

```
postgresql://username:password@localhost:5432/learndb
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
LLM_PROVIDER=azure-openai          # azure-openai | openai | gemini | anthropic

POSTGRES_DB_CONNECTION_STRING=postgresql://username:password@localhost:5432/learndb

# --- Fill in the variables for your chosen provider below ---

# Azure OpenAI
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_MODEL=gpt-4.1
AZURE_OPENAI_DEPLOYMENT=gpt-4.1

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1

# Gemini
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

# Anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

### 3. Install dependencies (uv recommended)

```bash
uv sync
```

Or with pip:

```bash
pip install -e .
```

### 4. Run the server

```bash
uv run python main.py
```

Or with pip:

```bash
python main.py
```

The API will be available at `http://localhost:8000`.

## Provider-specific Variables

### `azure-openai`

| Variable | Description |
|---|---|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL |
| `OPENAI_API_VERSION` | API version (e.g. `2025-03-01-preview`) |
| `AZURE_OPENAI_MODEL` | Model name (e.g. `gpt-4.1`) |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name (e.g. `gpt-4.1`) |

### `openai`

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Model name (e.g. `gpt-4.1`) |

### `gemini`

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Google AI API key |
| `GEMINI_MODEL` | Model name (e.g. `gemini-2.0-flash`) |

### `anthropic`

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `ANTHROPIC_MODEL` | Model name (e.g. `claude-sonnet-4-20250514`) |

## Architecture

```
app/
├── api.py            # FastAPI routes (chat streaming, schema, threads)
├── agent.py          # LangChain agent setup and streaming
├── model.py          # Multi-provider LLM helper (Azure OpenAI, OpenAI, Gemini, Anthropic)
├── tools.py          # Agent tools (SQL execution, schema writing)
├── database.py       # PostgreSQL query execution via psycopg2
├── prompt.py         # System prompt with schema awareness
├── schema_store.py   # Schema persistence in db.json
└── thread_repo.py    # In-memory chat thread management
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/stream` | Stream a chat response (SSE). Body: `{ "user_query": "...", "thread_id": "..." }` |
| `GET` | `/schema` | Get the current database schema in markdown |
| `GET` | `/threads` | List all chat threads |
| `POST` | `/threads` | Create a new thread. Body: `{ "thread_id": "..." }` |
| `DELETE` | `/threads/{thread_id}` | Delete a thread |
| `GET` | `/threads/{thread_id}/messages` | Get message history for a thread |
