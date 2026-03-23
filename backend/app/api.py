import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.agent import stream_agent, agent
from app.schema_store import get_markdown_schema
from app.thread_repo import (
    list_threads,
    create_thread,
    delete_thread,
    get_thread_messages,
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    user_query: str
    thread_id: str


class ThreadCreateRequest(BaseModel):
    thread_id: str


def _sse(event_type, data):
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def _normalize_content(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    return str(content)


def _generate_stream(user_query, thread_id):
    try:
        for event in stream_agent(user_query, thread_id):
            if "model" in event:
                for msg in event["model"].get("messages", []):
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            yield _sse("tool_call", {
                                "name": tc["name"],
                                "args": tc["args"]
                            })
                    if msg.content:
                        yield _sse("response", {"content": _normalize_content(msg.content)})

            if "tools" in event:
                for msg in event["tools"].get("messages", []):
                    yield _sse("tool_result", {
                        "name": msg.name,
                        "content": msg.content
                    })

        yield _sse("done", {})
    except Exception as e:
        yield _sse("error", {"message": str(e)})


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        _generate_stream(request.user_query, request.thread_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.get("/schema")
async def get_schema():
    return {"schema": get_markdown_schema()}


@app.get("/threads")
async def threads_list():
    return {"threads": list_threads(agent)}


@app.post("/threads")
async def threads_create(request: ThreadCreateRequest):
    return create_thread(request.thread_id)


@app.delete("/threads/{thread_id}")
async def threads_delete(thread_id: str):
    delete_thread(thread_id)
    return {"ok": True}


@app.get("/threads/{thread_id}/messages")
async def threads_messages(thread_id: str):
    return {"messages": get_thread_messages(agent, thread_id)}
