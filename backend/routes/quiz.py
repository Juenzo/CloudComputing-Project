from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from ..database import get_session
from ..models import (
    Quiz, QuizCreate, QuizRead, 
    QuizQuestion, QuizQuestionBase, QuizQuestionRead,
    QuizChoice, QuizChoiceBase,
    Course
)

router = APIRouter()

# --- MODÈLES DE CRÉATION IMBRIQUÉS (Pour simplifier la vie du Frontend) ---
class ChoicePayload(BaseModel):
    text: str
    is_correct: bool

class QuestionPayload(BaseModel):
    text: str
    points: int = 1
    choices: List[ChoicePayload]

class FullQuizCreate(QuizCreate):
    questions: List[QuestionPayload] = []

# --- ROUTES QUIZ ---

@router.post("/courses/{course_id}/quiz", response_model=QuizRead)
def create_full_quiz(course_id: int, quiz_data: FullQuizCreate, session: Session = Depends(get_session)):
    """
    Création optimisée d'un quiz et de ses questions en une seule transaction.
    """
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Cours introuvable")

    # Création du Quiz
    db_quiz = Quiz(title=quiz_data.title, description=quiz_data.description, order=quiz_data.order, course_id=course_id)
    session.add(db_quiz)
    session.commit()
    session.refresh(db_quiz)

    # Création des Questions et Choix
    for q_data in quiz_data.questions:
        db_question = QuizQuestion(text=q_data.text, points=q_data.points, quiz_id=db_quiz.id)
        session.add(db_question)
        session.commit()
        session.refresh(db_question)
        
        for c_data in q_data.choices:
            db_choice = QuizChoice(text=c_data.text, is_correct=c_data.is_correct, question_id=db_question.id)
            session.add(db_choice)
    
    session.commit()
    return db_quiz

@router.put("/courses/{course_id}/quiz", response_model=QuizRead)
def replace_quiz_for_course(course_id: int, quiz_data: FullQuizCreate, session: Session = Depends(get_session)):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Cours introuvable")

    # Supprimer tous les quiz du cours (questions/choix supprimés en cascade)
    existing_quizzes = session.exec(select(Quiz).where(Quiz.course_id == course_id)).all()
    for q in existing_quizzes:
        session.delete(q)
    session.commit()

    # Recréer avec les nouvelles données
    new_quiz = Quiz(title=quiz_data.title, description=quiz_data.description, order=quiz_data.order, course_id=course_id)
    session.add(new_quiz)
    session.commit()
    session.refresh(new_quiz)

    for q_data in quiz_data.questions:
        db_question = QuizQuestion(text=q_data.text, points=q_data.points, quiz_id=new_quiz.id)
        session.add(db_question)
        session.commit()
        session.refresh(db_question)

        for c_data in q_data.choices:
            db_choice = QuizChoice(text=c_data.text, is_correct=c_data.is_correct, question_id=db_question.id)
            session.add(db_choice)

    session.commit()
    return new_quiz

@router.get("/courses/{course_id}/quiz", response_model=List[QuizRead])
def list_quiz_for_course(course_id: int, session: Session = Depends(get_session)):
    quiz = session.exec(select(Quiz).where(Quiz.course_id == course_id).order_by(Quiz.order)).all()
    return quiz

@router.get("/quiz/{quiz_id}")
def get_quiz_details_for_student(quiz_id: int, session: Session = Depends(get_session)):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz introuvable")
    
    # On construit la réponse manuellement pour contrôler ce qu'on envoie
    result = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "questions": []
    }
    
    # On charge les questions triées
    questions = session.exec(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)).all()
    
    for q in questions:
        q_data = {
            "id": q.id,
            "text": q.text,
            "points": q.points,
            "choices": []
        }
        # On charge les choix
        choices = session.exec(select(QuizChoice).where(QuizChoice.question_id == q.id)).all()
        for c in choices:
            q_data["choices"].append({
                "id": c.id,
                "text": c.text
                # PAS de is_correct ici !
            })
        result["questions"].append(q_data)
        
    return result

@router.get("/quiz/{quiz_id}/full")
def get_quiz_details_for_editor(quiz_id: int, session: Session = Depends(get_session)):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz introuvable")

    result = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "questions": []
    }

    questions = session.exec(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)).all()
    for q in questions:
        q_data = {
            "id": q.id,
            "text": q.text,
            "points": q.points,
            "choices": []
        }
        choices = session.exec(select(QuizChoice).where(QuizChoice.question_id == q.id)).all()
        for c in choices:
            q_data["choices"].append({
                "id": c.id,
                "text": c.text,
                "is_correct": c.is_correct
            })
        result["questions"].append(q_data)

    return result

# --- ROUTE CORRECTION ---

class UserAnswer(BaseModel):
    question_id: int
    choice_id: int

@router.post("/quiz/{quiz_id}/submit")
def submit_quiz(quiz_id: int, answers: List[UserAnswer], session: Session = Depends(get_session)):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz introuvable")

    score = 0
    max_score = 0
    results_detail = []

    # On récupère toutes les questions du quiz
    questions = session.exec(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)).all()
    question_map = {q.id: q for q in questions} # Dictionnaire pour accès rapide

    # Calcul du score maximum possible
    for q in questions:
        max_score += q.points

    # Vérification des réponses utilisateur
    for ans in answers:
        question = question_map.get(ans.question_id)
        if not question:
            continue # Question n'appartient pas au quiz ou n'existe pas
            
        choice = session.get(QuizChoice, ans.choice_id)
        
        # Vérif : Le choix existe, appartient à la bonne question, et est correct
        is_correct = False
        if choice and choice.question_id == ans.question_id and choice.is_correct:
            score += question.points
            is_correct = True
            
        results_detail.append({
            "question_id": ans.question_id,
            "is_correct": is_correct
        })

    passed = (score / max_score) >= 0.5 if max_score > 0 else False

    return {
        "quiz_title": quiz.title,
        "score": score,
        "total_points": max_score,
        "passed": passed,
        "details": results_detail
    }


@router.delete("/quiz/{quiz_id}")
def delete_quiz(quiz_id: int, session: Session = Depends(get_session)):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz introuvable")
        
    session.delete(quiz)
    session.commit()
    
    return {"message": "Quiz supprimé avec succès"}