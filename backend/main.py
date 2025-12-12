from fastapi import FastAPI
from contextlib import asynccontextmanager

from database import create_db_and_tables

from routes import courses, storage, quiz

# --- STARTUP EVENT ---
# Cette méthode moderne remplace le @app.on_event("startup")
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- DÉMARRAGE : Initialisation de la BDD ---")
    create_db_and_tables() 
    yield
    print("--- ARRÊT ---")

# --- INITIALISATION APP ---
app = FastAPI(
    title="E-Learning API",
    version="1.1",
    lifespan=lifespan
)

# --- ENREGISTREMENT DES ROUTEURS ---
app.include_router(courses.router, prefix="/api", tags=["Courses"])
app.include_router(storage.router, prefix="/api", tags=["Storage"])
app.include_router(quiz.router, prefix="/api", tags=["Quiz"])

@app.get("/")
def read_root():
    return {"message": "API E-Learning avec SQLModel & Azure Storage est en ligne !"}