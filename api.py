from fastapi import FastAPI
from pydantic import BaseModel
from agent import call_agent
app = FastAPI()
class ChatRequest(BaseModel):
    user_query : str 
@app.post("/chat")
async def chat(request:ChatRequest):
    return call_agent(request.user_query)