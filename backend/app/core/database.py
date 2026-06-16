from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

BASE_DIR = Path(__file__).resolve().parents[2]

Base = declarative_base()

"""
Database configuration and connection setup.
This module defines the SQLAlchemy Base class for ORM models and sets up the asynchronous database engine and session maker.
The engine is created using the DATABASE_URL from the application settings, and the AsyncSessionLocal is an asynchronous session maker that provides database sessions for interacting with the database.
"""
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)