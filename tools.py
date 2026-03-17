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
        data["schema"] = markdown_schema 
        with open(file_path,"w") as f:
            json.dump(data,f,indent = 2)
    except Exception as e:
        error = "Error writing schema in markdown format:" + e
        print(error)
        return error
        