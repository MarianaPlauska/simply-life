# backend/database.py
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL não definido. Adicione ao .env "
        "(ex: postgresql://postgres:SENHA@db.xxx.supabase.co:5432/postgres)"
    )

# SQLAlchemy aceita tanto postgresql:// quanto postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_with_rls(user_id: int):
    """Retorna uma sessão DB com RLS context configurado."""
    db = SessionLocal()
    try:
        db.execute(
            text("SET LOCAL app.current_user_id = :uid"),
            {"uid": str(user_id)},
        )
        yield db
    finally:
        db.close()