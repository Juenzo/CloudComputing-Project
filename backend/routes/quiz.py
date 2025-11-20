from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel

from ..database import get_session
from ..models import QuizQuestion, QuizQuestionRead, QuizChoice, Lesson

router = APIRouter()

# Modèle simple pour recevoir les réponses du user
class UserAnswer(BaseModel):
    question_id: int
    choice_id: int

class QuizResult(BaseModel):
    score: int
    total: int
    passed: bool

@router.get("/lessons/{lesson_id}/quiz", response_model=List[QuizQuestionRead])
def get_quiz_for_lesson(lesson_id: int, session: Session = Depends(get_session)):
    # Récupère les questions liées à la leçon
    statement = select(QuizQuestion).where(QuizQuestion.lesson_id == lesson_id)
    questions = session.exec(statement).all()
    return questions

@router.post("/lessons/{lesson_id}/quiz/check", response_model=QuizResult)
def check_quiz(lesson_id: int, answers: List[UserAnswer], session: Session = Depends(get_session)):
    """Vérifie les réponses et calcule le score"""
    score = 0
    total = len(answers)
    
    if total == 0:
         return {"score": 0, "total": 0, "passed": False}

    for answer in answers:
        # On va chercher le choix en BDD pour vérifier s'il est correct
        choice = session.get(QuizChoice, answer.choice_id)
        if choice and choice.question_id == answer.question_id and choice.is_correct:
            score += 1
            
    # Seuil de réussite (ex: 50%)
    passed = (score / total) >= 0.5
    
    return {"score": score, "total": total, "passed": passed}