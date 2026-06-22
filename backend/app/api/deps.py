from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal

"""API dependency utilities.
This module provides utility functions for API dependencies, such as obtaining a database session.
The get_db function is an asynchronous generator that yields an instance of AsyncSessionLocal, which is used to interact with the database in API routes. This allows for proper session management and ensures that the session is closed after use.
"""

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
