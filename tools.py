import json 
from langchain.tools import tool
from utils import execute_postgres_query
@tool
def sql_query_execution_tool(query:str) :
    """This is the tool used to execute a SQL Query on the database"""
    try:
        print("Executing SQL query:",query)
        result = execute_postgres_query(query)
        return result
    except Exception as e:
        error = "Error executing SQL query:" + e
        print(error)
        return error

def _extract_tables(schema_str):
    """Parse markdown schema into a dict of {table_name: section_content}."""
    import re
    if not schema_str:
        return {}
    sections = re.split(r'\n(?=###)', schema_str.strip())
    tables = {}
    for section in sections:
        match = re.match(r'###\s+(\w+)', section)
        if match:
            tables[match.group(1).lower()] = section.strip()
    return tables

@tool
def write_markdown_schema_tool(markdown_schema:str | None):
    """This tool is used to write the schema in markdown format in the database, It is exact copy of the actual postgres schema in markdown format.
    So, this markdown schema should be in sync with actual postgres schema.
    """
    try:
        print("writing schema in markdown format: ", markdown_schema)
        file_path = "./db.json"
        with open(file_path,"r") as f:
            data = json.load(f)

        previous_schema = data.get("schema") or ""

        if markdown_schema is None:
            data["schema"] = None
            data["latest_schema"] = None
        else:
            prev_tables = _extract_tables(previous_schema)
            new_tables = _extract_tables(markdown_schema)

            # latest_schema = tables that are new or modified since last write
            latest_parts = [
                content for name, content in new_tables.items()
                if name not in prev_tables or prev_tables[name] != content
            ]

            data["schema"] = markdown_schema
            data["latest_schema"] = "\n\n".join(latest_parts) if latest_parts else markdown_schema

        with open(file_path,"w") as f:
            json.dump(data,f,indent = 2)
    except Exception as e:
        error = "Error writing schema in markdown format:" + str(e)
        print(error)
        return error
        