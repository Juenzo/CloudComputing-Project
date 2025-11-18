import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import courses

app = FastAPI(title="Maxi'Learning API", version="1.0")

# CORS (configurable via CORS_ORIGINS env, comma-separated)
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(courses.router, tags=["Courses", "Lessons"])  # routes define their own prefixes


@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API Maxi'Learning 🎓"}
