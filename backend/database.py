import pymysql
import os
from decimal import Decimal
from datetime import datetime, date

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "admin")
MYSQL_DB = os.getenv("MYSQL_DB", "urbab366_db")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))

def get_db_connection():
    return pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        port=MYSQL_PORT,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def _convert_types(item):
    if isinstance(item, list):
        return [_convert_types(x) for x in item]
    elif isinstance(item, dict):
        return {k: _convert_types(v) for k, v in item.items()}
    elif isinstance(item, Decimal):
        return float(item)
    elif isinstance(item, (datetime, date)):
        return item.isoformat()
    return item

def query_all(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            mysql_query = query.replace("?", "%s")
            cursor.execute(mysql_query, params)
            rows = cursor.fetchall()
            return _convert_types(rows)
    finally:
        conn.close()

def query_one(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            mysql_query = query.replace("?", "%s")
            cursor.execute(mysql_query, params)
            row = cursor.fetchone()
            return _convert_types(row) if row else None
    finally:
        conn.close()

def execute_write(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            mysql_query = query.replace("?", "%s")
            cursor.execute(mysql_query, params)
            conn.commit()
            return cursor.lastrowid
    finally:
        conn.close()

def init_db():
    print(f"Connected to MySQL database '{MYSQL_DB}' on {MYSQL_HOST}:{MYSQL_PORT}")

if __name__ == "__main__":
    init_db()
    cats = query_all("SELECT count(*) as count FROM categories")
    print("MySQL Categories Count:", cats)
