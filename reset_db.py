from sqlmodel import SQLModel
from backend.database import engine
# Il est CRUCIAL d'importer les modèles pour que SQLModel les connaisse
from backend.models import Course, Lesson, Quiz, QuizQuestion, QuizChoice

def reset():
    print("--- SUPPRESSION DES TABLES EXISTANTES ---")
    # drop_all supprime tout (attention aux données !)
    SQLModel.metadata.drop_all(engine)
    
    print("--- CRÉATION DE LA NOUVELLE STRUCTURE ---")
    SQLModel.metadata.create_all(engine)
    print("--- TERMINÉ : Votre BDD est à jour ! ---")

if __name__ == "__main__":
    reset()