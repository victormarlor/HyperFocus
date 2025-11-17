from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models import Interruption, Session as WorkSession, User
from app.schemas import InterruptionCreate, InterruptionRead

router = APIRouter(prefix="/interruptions", tags=["interruptions"])


@router.post("/", response_model=InterruptionRead, status_code=status.HTTP_201_CREATED)
def create_interruption(
    interruption_in: InterruptionCreate,
    db: DBSession = Depends(get_session),
):
    """
    Registra una interrupción en una sesión activa.
    """
    # Comprobar que la sesión existe
    work_session = db.get(WorkSession, interruption_in.session_id)
    if not work_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Comprobar que pertenece al usuario indicado
    if work_session.user_id != interruption_in.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interruption user_id does not match session user_id",
        )

    # Comprobar que la sesión está activa
    if work_session.end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add interruptions to a finished session",
        )

    # Calcular duración
    duration = int(
        (interruption_in.end_time - interruption_in.start_time).total_seconds()
    )

    if duration < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be after start_time",
        )

    interruption = Interruption(
        session_id=interruption_in.session_id,
        user_id=interruption_in.user_id,
        type=interruption_in.type.value,
        description=interruption_in.description,
        start_time=interruption_in.start_time,
        end_time=interruption_in.end_time,
        duration=duration,
    )

    db.add(interruption)
    db.commit()
    db.refresh(interruption)

    return interruption


@router.get("/session/{session_id}", response_model=list[InterruptionRead])
def get_interruptions_for_session(
    session_id: int,
    db: DBSession = Depends(get_session),
):
    """
    Lista todas las interrupciones de una sesión dada.
    """
    session = db.get(WorkSession, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    interruptions = db.exec(
        select(Interruption).where(Interruption.session_id == session_id)
    ).all()

    return interruptions
