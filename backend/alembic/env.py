import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from alembic import context

"""
Alembic migration environment configuration.
This module sets up the Alembic migration environment for the application. It configures the database connection, logging, and migration context for both offline and online migration modes."""

# update path so app package imports work when alembic runs from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402
import app.models  # noqa: F401

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        excluded = {
            "spatial_ref_sys",
            "geometry_columns",
            "geography_columns",
            "raster_overviews",
            "topology",
        }

        if name in excluded:
            return False

        if reflected and compare_to is None:
            # ignore tables that exist in the database but are not present in the SQLAlchemy metadata
            return False
    return True


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        render_as_batch=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio

    asyncio.run(run_migrations_online())
