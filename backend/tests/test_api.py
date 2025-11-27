# cloud/backend/tests/test_api.py
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
import pytest

# On importe l'app et la fonction qui donne la session
from ..main import app
from ..database import get_session

# --- CONFIGURATION DE LA BDD DE TEST (EN MÉMOIRE) ---
# On utilise SQLite en mémoire pour ne pas casser ta vraie BDD Azure/Locale
engine = create_engine(
    "sqlite://", 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

def create_test_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_test_session():
    with Session(engine) as session:
        yield session

# On remplace la dépendance de production par celle de test
app.dependency_overrides[get_session] = get_test_session

@pytest.fixture(name="client")
def client_fixture():
    create_test_db_and_tables()
    return TestClient(app)

# --- LES TESTS ---

def test_read_root(client: TestClient):
    """Vérifie que l'API est en ligne"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API E-Learning avec SQLModel & Azure Storage est en ligne !"}

def test_create_course(client: TestClient):
    """Vérifie la création d'un cours"""
    course_data = {
        "title": "Cours Terraform",
        "description": "Apprendre l'IaC",
        "slug": "cours-terraform"
    }
    response = client.post("/api/courses", json=course_data)
    data = response.json()
    
    assert response.status_code == 200
    assert data["title"] == "Cours Terraform"
    assert data["id"] is not None

def test_create_duplicate_course_slug(client: TestClient):
    """Vérifie qu'on ne peut pas créer deux cours avec le même slug"""
    course_data = {"title": "Test", "slug": "unique-slug"}
    
    # 1er appel
    client.post("/api/courses", json=course_data)
    
    # 2ème appel identique
    response = client.post("/api/courses", json=course_data)
    assert response.status_code == 400
    assert "existe déjà" in response.json()["detail"]
