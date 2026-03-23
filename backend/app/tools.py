from langchain.tools import tool
from app.database import execute_postgres_query
from app.schema_store import write_markdown_schema


@tool
def sql_query_execution_tool(query: str):
    """Execute a SQL query on the PostgreSQL database."""
    try:
        return execute_postgres_query(query)
    except Exception as e:
        return f"Error executing SQL query: {e}"


@tool
def write_markdown_schema_tool(markdown_schema: str | None):
    """Write the database schema in markdown format. Must stay in sync with the actual PostgreSQL schema."""
    return write_markdown_schema(markdown_schema)
