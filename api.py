from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import call_agent
from utils import get_markdown_schema
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
@app.post("/chat")
async def chat(request: ChatRequest):
    return call_agent(request.user_query)
@app.get("/schema")
async def get_schema():
    import json
    with open("./db.json", "r") as f:
        data = json.load(f)
    return {"schema": data.get("latest_schema") or data.get("schema")}
