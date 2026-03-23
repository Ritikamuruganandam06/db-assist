from langgraph.prebuilt import create_react_agent
from app.tools import sql_query_execution_tool, write_markdown_schema_tool
from app.prompt import get_system_prompt
from app.thread_repo import get_memory
from app.model import get_model
from dotenv import load_dotenv

load_dotenv()

model = get_model()

tools = [sql_query_execution_tool, write_markdown_schema_tool]

agent = create_react_agent(
    model,
    tools,
    checkpointer=get_memory(),
    prompt=get_system_prompt()
)


def stream_agent(user_query, thread_id):
    config = {"configurable": {"thread_id": thread_id}}
    for event in agent.stream(
        {"messages": [("user", user_query)]},
        config,
        stream_mode="updates"
    ):
        yield event
