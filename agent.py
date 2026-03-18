from langchain.agents import create_agent
from langchain_openai import AzureChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from tools import sql_query_execution_tool,write_markdown_schema_tool
from prompt import get_system_prompt
from dotenv import load_dotenv
load_dotenv()
model = AzureChatOpenAI(
     model ="gpt-4.1",
     azure_deployment="gpt-4.1"
 )
tools = [
     sql_query_execution_tool,
     write_markdown_schema_tool
 ]

memory = MemorySaver()
agent = create_agent(model,tools,checkpointer = memory,system_prompt=get_system_prompt())
def call_agent(user_query:str) :
     configuration = {"configurable":{"thread_id":"1"}}
     messages = agent.invoke({"messages":[("user",user_query)]},configuration)
     response = {
         "content" : messages["messages"][-1].content
     }
     return response