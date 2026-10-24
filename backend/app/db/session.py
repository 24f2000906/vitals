from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.database_url, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def init_models() -> None:
    from app import models  # noqa: F401  (register tables)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate(sync_conn):
            try:
                cur = sync_conn.connection.cursor()
                for table in ["users", "family_members"]:
                    cur.execute(f"PRAGMA table_info({table})")
                    cols = [r[1] for r in cur.fetchall()]
                    if cols and "share_code" not in cols:
                        cur.execute(f"ALTER TABLE {table} ADD COLUMN share_code VARCHAR(64)")
                        cur.execute(f"UPDATE {table} SET share_code = lower(hex(randomblob(8))) WHERE share_code IS NULL")
                        cur.execute(f"CREATE UNIQUE INDEX IF NOT EXISTS ix_{table}_share_code ON {table}(share_code)")
            except Exception:
                pass

        await conn.run_sync(_migrate)
