from app.core.database import AsyncSessionLocal

"""
Database session management utility.
This module provides a utility function to obtain an asynchronous database session.
The get_db_session function is an asynchronous generator that yields an instance of AsyncSessionLocal.
This allows for proper session management and ensures that the session is closed after use.
"""
__all__ = ["AsyncSessionLocal"]