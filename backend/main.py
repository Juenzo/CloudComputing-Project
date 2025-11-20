import os
import urllib.parse
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base

# --- CONFIGURATION BDD ---
# Récupération des variables injectées par Terraform
server = os.getenv("DB_SERVER")
database = os.getenv("DB_NAME")
username = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")

# Encodage du mot de passe pour éviter les erreurs avec les caractères spéciaux
params = urllib.parse.quote_plus(
    f"Driver={{ODBC Driver 17 for SQL Server}};"
    f"Server={server},1433;"
    f"Database={database};"
    f"Uid={username};"
    f"Pwd={password};"
    f"Encrypt=yes;"
    f"TrustServerCertificate=no;"
    f"Connection Timeout=30;"
)

# Chaîne de connexion SQLAlchemy
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

# Création du moteur SQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DÉFINITION DU MODÈLE (La Table) ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100))

# Modèle Pydantic pour l'API (Validation des données reçues)
class UserCreate(BaseModel):
    name: str
    email: str

# --- INITIALISATION APP ---
app = FastAPI()

# C'est ICI que la magie opère :
# Au démarrage, SQLAlchemy vérifie si les tables existent. 
# Sinon, il les crée. (C'est l'init BDD)
try:
    Base.metadata.create_all(bind=engine)
    print("Base de données initialisée avec succès.")
except Exception as e:
    print(f"Erreur lors de l'init BDD : {e}")

# Dépendance pour récupérer une session DB par requête
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
    users = db.query(User).all()
    return users

@app.post("/users")
def create_user(user: UserCreate):
    db = SessionLocal()
    db_user = User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user