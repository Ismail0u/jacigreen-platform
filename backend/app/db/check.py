from sqlalchemy import text

from app.core.database import engine

"""
Database connection check utility.
This module provides a utility function to check the database connection by executing a simple SQL query.
The check_db_connection function attempts to connect to the database and execute a "SELECT 1" query.
"""
async def check_db_connection() -> bool:
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False