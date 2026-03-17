import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
def get_markdown_schema():
    try:
        print("getting schema in markdown format.")
        file_path ="./db.json"
        with open(file_path,"r") as f:
            data = json.load(f)
        return data["schema"]
    except Exception as e:
        error = "Error writing schema in markdown format:" + e
        raise

def execute_postgres_query(sql_query:str) -> str:
    connection = None
    cursor = None
    try :
        POSTGRES_CONNECTION_STRING = os.getenv("POSTGRES_DB_CONNECTION_STRING")
        connection = psycopg2.connect(POSTGRES_CONNECTION_STRING)
        cursor = connection.cursor(cursor_factory = RealDictCursor)
        cursor.execute(sql_query)
        result = None
        if cursor.description is not None:
            result = str(cursor.fetchall())
        connection.commit()
        return result if result is not None else "Query executed successfully"
    except Exception as e:
        if connection:
            connection.rollback()
        return f"Error executing query:{str(e)}"
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()    
