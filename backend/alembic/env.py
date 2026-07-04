import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

load_dotenv()

from app.services.database import Base
from app.models import User, HelpRequest, VolunteerAssignment, Review  # noqa

config = context.config

raw_db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./helpme.db")
if "sqlite+aiosqlite" in raw_db_url:
    sync_db_url = raw_db_url.replace("sqlite+aiosqlite", "sqlite")
elif "postgresql+asyncpg" in raw_db_url:
    sync_db_url = raw_db_url.replace("postgresql+asyncpg", "postgresql")
else:
    sync_db_url = raw_db_url

config.set_main_option("sqlalchemy.url", sync_db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()