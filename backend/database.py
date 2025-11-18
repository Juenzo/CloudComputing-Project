import os
from typing import Generator
from pathlib import Path
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv


# Load .env from repo root if present
try:
	repo_root = Path(__file__).resolve().parents[1]
	dotenv_path = repo_root / ".env"
	if dotenv_path.exists():
		load_dotenv(dotenv_path=dotenv_path)
	else:
		load_dotenv()  # fallback to default search
except Exception:
	# Safe to ignore if dotenv is not available or any issue occurs
	pass

# Environment-driven DB URL. Example for Azure PostgreSQL Flexible Server:
# postgresql+psycopg2://<user>:<password>@<fqdn>:5432/elearningdb?sslmode=require
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("database_url")

# If not provided, attempt to construct from individual env vars placed in .env
if not DATABASE_URL:
	host = os.getenv("postgres_server_fqdn") or os.getenv("PGHOST")
	dbname = os.getenv("postgres_database_name") or os.getenv("PGDATABASE")
	user = os.getenv("postgres_admin_user") or os.getenv("PGUSER")
	pwd = os.getenv("postgres_password") or os.getenv("PGPASSWORD")

	if host and dbname and user and pwd:
		user_q = quote_plus(user)
		pwd_q = quote_plus(pwd)
		DATABASE_URL = f"postgresql+psycopg2://{user_q}:{pwd_q}@{host}:5432/{dbname}?sslmode=require"

if not DATABASE_URL:
	DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/elearningdb"

# Create SQLAlchemy engine and session factory
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db() -> Generator:
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()
