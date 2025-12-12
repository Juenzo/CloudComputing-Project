import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import quote_plus
from sqlmodel import create_engine, SQLModel, Session

# --- CHARGEMENT DU FICHIER .ENV ---
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- RÉCUPÉRATION DES VARIABLES ---
server = os.getenv("sql_server_fqdn")
database = os.getenv("sql_database_name")
username = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

if not password or not server:
    raise ValueError(f"Variables d'environnement manquantes. Vérifiez : {env_path}")

# --- CRÉATION DU MOTEUR (SQLModel) ---
encoded_password = quote_plus(password)
# On utilise pymssql comme pilote
SQLALCHEMY_DATABASE_URL = f"mssql+pymssql://{username}:{encoded_password}@{server}/{database}"

# echo=True permet de voir les requêtes SQL dans la console
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

# --- DÉPENDANCE POUR L'API ---
def get_session():
    """Cette fonction sera utilisée par les routes pour obtenir une session BDD"""
    with Session(engine) as session:
        yield session

# --- INITIALISATION DES TABLES ---
def create_db_and_tables():
    # C'est ici que SQLModel crée les tables si elles n'existent pas
    SQLModel.metadata.create_all(engine)