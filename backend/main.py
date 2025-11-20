import os
from urllib.parse import quote_plus # Déplacé en haut pour la propreté
from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
from dotenv import load_dotenv

# --- CHARGEMENT DU FICHIER .ENV ---
# On cherche le fichier .env dans le dossier parent (racine du projet)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- CONFIGURATION BDD ---
# Récupération des variables (Les noms correspondent à votre .env)
server = os.getenv("sql_server_fqdn")     # Vient de l'output Terraform
database = os.getenv("sql_database_name") # Vient de l'output Terraform
username = os.getenv("DB_USER")           # Défini manuellement
password = os.getenv("DB_PASSWORD")       # Défini manuellement

# Debug : Si le chargement échoue, on arrête tout de suite avec un message clair
if not password or not server:
    print(f"ERREUR : Impossible de lire le fichier .env à : {env_path}")
    print(f"Server: {server}, User: {username}, Pass: {password}")
    raise ValueError("Les variables d'environnement sont vides.")

# Encodage du mot de passe
encoded_password = quote_plus(password)

# Construction de l'URL (pymssql)
SQLALCHEMY_DATABASE_URL = f"mssql+pymssql://{username}:{encoded_password}@{server}/{database}"

# Création du moteur
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DÉFINITION DU MODÈLE ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100))

class UserCreate(BaseModel):
    name: str
    email: str

# --- INITIALISATION APP ---
app = FastAPI()

# Init BDD au démarrage
try:
    Base.metadata.create_all(bind=engine)
    print("Base de données initialisée avec succès.")
except Exception as e:
    print(f"Erreur lors de l'init BDD : {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROUTES API ---
@app.get("/")
def read_root():
    return {"message": "Backend Python Azure est en ligne !"}

@app.get("/users")
def read_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return users
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.post("/users")
def create_user(user: UserCreate):
    db = SessionLocal()
    try:
        db_user = User(name=user.name, email=user.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()