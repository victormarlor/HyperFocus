from datetime import datetime, timedelta, date, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models import Session as WorkSession, User
from app.schemas import SessionStart, SessionRead

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def start_session(
    session_in: SessionStart,
    db: DBSession = Depends(get_session),
):
    """
    Crea una nueva sesión de trabajo para un usuario.
    - Si start_time no se envía, se usa la hora actual (UTC).
    - No permite que un usuario tenga dos sesiones activas al mismo tiempo.
    """
    user = db.get(User, session_in.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Comprobar si ya hay una sesión activa (end_time == None) para este usuario
    active_session = db.exec(
        select(WorkSession).where(
            WorkSession.user_id == session_in.user_id,
            WorkSession.end_time.is_(None),
        )
    ).first()

    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active session",
        )

    start_time = session_in.start_time or datetime.now(timezone.utc)

    new_session = WorkSession(
        user_id=session_in.user_id,
        start_time=start_time,
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@router.post("/{session_id}/end", response_model=SessionRead)
def end_session(
    session_id: int,
    db: DBSession = Depends(get_session),
):
    """
    Finaliza una sesión de trabajo.
    - Establece end_time a la hora actual (UTC).
    - Si la sesión ya está finalizada, devuelve error.
    """
    work_session = db.get(WorkSession, session_id)
    if not work_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if work_session.end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already ended",
        )

    work_session.end_time = datetime.now(timezone.utc)
    db.add(work_session)
    db.commit()
    db.refresh(work_session)

    return work_session


@router.get("/{session_id}", response_model=SessionRead)
def get_session_by_id(
    session_id: int,
    db: DBSession = Depends(get_session),
):
    """
    Obtiene una sesión específica por ID.
    """
    work_session = db.get(WorkSession, session_id)
    if not work_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    return work_session


@router.get("/user/{user_id}", response_model=list[SessionRead])
def get_sessions_for_user(
    user_id: int,
    day: date | None = Query(
        default=None,
        description="Día específico en formato YYYY-MM-DD para filtrar las sesiones por fecha de inicio.",
    ),
    db: DBSession = Depends(get_session),
):
    """
    Obtiene las sesiones de un usuario.
    - Si 'day' se proporciona, filtra las sesiones cuyo start_time esté dentro de ese día.
    - Si no se proporciona, devuelve todas las sesiones del usuario.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    query = select(WorkSession).where(WorkSession.user_id == user_id)

    if day is not None:
        day_start = datetime.combine(day, time.min)
        day_end = datetime.combine(day, time.max)
        query = query.where(
            WorkSession.start_time >= day_start,
            WorkSession.start_time <= day_end,
        )

    query = query.order_by(WorkSession.start_time)

    sessions = db.exec(query).all()
    return sessions
