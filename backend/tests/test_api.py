from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool
import pytest
from unittest.mock import patch, MagicMock
from routes import courses

from backend.main import app
from database import get_session
from models import Course, Quiz, QuizQuestion, QuizChoice

# Config de la db de test
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

# Override de la dépendance get_session pour utiliser get_test_session et utiliser la db de test
app.dependency_overrides[get_session] = get_test_session

@pytest.fixture(name="client")
def client_fixture():
    create_test_db_and_tables()
    return TestClient(app)


# Test de la création de leçon avec pdf
def test_lesson_creation_with_mocked_upload(client: TestClient):
    client.post("/api/courses", json={"title": "Cours Azure", "slug": "azure-101"})
    # GET sur le slug pour récupérer l'ID
    course_resp = client.get("/api/courses/azure-101")
    course_id = course_resp.json()["id"]

    # Faux pdf à uploader
    file_content = b"Contenu du PDF de test"
    files = {
        "file": ("test.pdf", file_content, "application/pdf")
    }
    data = {
        "course_id": course_id,
        "title": "Intro au Blob Storage",
        "content_type": "pdf"
    }


    with patch.object(courses, "upload_file_to_blob") as mock_upload:
        # Valeur aléatoire, un UUID sera généré par l'API
        mock_upload.return_value = "peu_importe.pdf" 

        response = client.post("/api/lessons", data=data, files=files)

        assert response.status_code == 200
        json_data = response.json()
        
        # Récupération du nom du fichier généré
        generated_filename = json_data["content_url"]
        
        assert generated_filename.endswith(".pdf")
        assert len(generated_filename) > 20 

        # CRUCIAL : On vérifie que le mock a été appelé avec ce nom généré précis
        # args[0] = file_content, args[1] = filename
        args, _ = mock_upload.call_args
        assert args[1] == generated_filename

# Test du flux complet de création et soumission d'un quiz
def test_full_quiz_flow(client: TestClient):
    client.post("/api/courses", json={"title": "Cours Python", "slug": "python-101"})
    course_id = 1

    quiz_payload = {
        "title": "Quiz Python Base",
        "description": "Test tes connaissances",
        "order": 1,
        "course_id": course_id,
        "questions": [
            {
                "text": "Quelle est l'extension d'un fichier Python ?",
                "points": 2,
                "choices": [
                    {"text": ".java", "is_correct": False},
                    {"text": ".py", "is_correct": True}
                ]
            }
        ]
    }
    
    res_create = client.post(f"/api/courses/{course_id}/quiz", json=quiz_payload)
    assert res_create.status_code == 200
    quiz_id = res_create.json()["id"]

    # Récupération du quiz complet pour obtenir les IDs des questions et choix
    res_details = client.get(f"/api/quiz/{quiz_id}/full")
    question_data = res_details.json()["questions"][0]
    q_id = question_data["id"]
    good_choice_id = next(c["id"] for c in question_data["choices"] if c["is_correct"])

    # Soumission des réponses
    answers_payload = [
        {"question_id": q_id, "choice_id": good_choice_id}
    ]
    
    res_submit = client.post(f"/api/quiz/{quiz_id}/submit", json=answers_payload)
    assert res_submit.status_code == 200
    
    result = res_submit.json()
    assert result["score"] == 2
    assert result["passed"] is True
    assert result["quiz_title"] == "Quiz Python Base"

# Test de la suppression de cours avec nettoyage des ressources Azure
def test_delete_course_cleans_resources(client: TestClient):

    create_resp = client.post("/api/courses", json={"title": "Cours à supprimer", "slug": "delete-me"})
    course_id = create_resp.json()["id"]

    with patch.object(courses, "upload_file_to_blob") as mock_upload:
        mock_upload.return_value = "todelete.pdf"
        files = {"file": ("todelete.pdf", b"data", "application/pdf")}
        client.post("/api/lessons", 
                    data={"course_id": course_id, "title": "L", "content_type": "pdf"}, 
                    files=files)

    with patch.object(courses, "delete_file_from_blob") as mock_delete:
        # On simule que la suppression Azure a marché
        mock_delete.return_value = True 
        
        response = client.delete(f"/api/courses/{course_id}")
        assert response.status_code == 200

        assert client.get(f"/api/courses/{course_id}").status_code == 404
        
        mock_delete.assert_called()