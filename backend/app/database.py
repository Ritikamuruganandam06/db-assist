import os
import psycopg2
from psycopg2.extras import RealDictCursor


def execute_postgres_query(sql_query: str) -> str:
    connection = None
    cursor = None
    try:
        conn_str = os.getenv("POSTGRES_DB_CONNECTION_STRING")
        connection = psycopg2.connect(conn_str)
        cursor = connection.cursor(cursor_factory=RealDictCursor)
        cursor.execute(sql_query)
        result = None
        if cursor.description is not None:
            result = str(cursor.fetchall())
        connection.commit()
        return result if result is not None else "Query executed successfully"
    except Exception as e:
        if connection:
            connection.rollback()
        return f"Error executing query: {str(e)}"
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
