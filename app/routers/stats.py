from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session as DBSession

from app.db import get_session
from app.models import User
from app.core.stats_logic import (
    get_summary_stats,
    get_interruption_type_stats,
    get_productive_hours_stats,
    get_peak_distraction_hour,
    get_weekly_pattern,
)

router = APIRouter(prefix="/users/{user_id}/stats", tags=["stats"])


def _parse_range_days(range_str: str) -> int:
    """
    Convierte una cadena tipo '7d', '30d' a un int de días.
    Por ejemplo:
      '7d'  -> 7
      '14d' -> 14

    Si el formato es inválido, lanza HTTP 400.
    """
    range_str = range_str.strip().lower()
    if not range_str.endswith("d"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid range format. Use like '7d', '30d'.",
        )
    num_part = range_str[:-1]
    if not num_part.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid range value. Must be a number of days, e.g. '7d'.",
        )
    days = int(num_part)
    if days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Range must be a positive number of days.",
        )
    return days


def _ensure_user_exists(user_id: int, db: DBSession) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )


@router.get("/summary")
def stats_summary(
    user_id: int,
    range: str = Query("7d", description="Rango de días, ej: '7d', '30d'"),
    db: DBSession = Depends(get_session),
):
    """
    Resumen general de estadísticas de un usuario en el rango indicado.
    """
    _ensure_user_exists(user_id, db)
    range_days = _parse_range_days(range)
    return get_summary_stats(user_id=user_id, db=db, range_days=range_days)


@router.get("/interruption-types")
def stats_interruption_types(
    user_id: int,
    range: str = Query("7d", description="Rango de días, ej: '7d', '30d'"),
    db: DBSession = Depends(get_session),
):
    """
    Estadísticas de interrupciones por tipo (conteo y proporciones).
    """
    _ensure_user_exists(user_id, db)
    range_days = _parse_range_days(range)
    return get_interruption_type_stats(user_id=user_id, db=db, range_days=range_days)


@router.get("/productive-hours")
def stats_productive_hours(
    user_id: int,
    range: str = Query("7d", description="Rango de días, ej: '7d', '30d'"),
    db: DBSession = Depends(get_session),
):
    """
    Estadísticas por hora del día:
    - trabajo total
    - interrupciones
    - interrupciones por hora efectiva
    """
    _ensure_user_exists(user_id, db)
    range_days = _parse_range_days(range)
    return get_productive_hours_stats(user_id=user_id, db=db, range_days=range_days)


@router.get("/peak-distraction-time")
def stats_peak_distraction_time(
    user_id: int,
    range: str = Query("7d", description="Rango de días, ej: '7d', '30d'"),
    db: DBSession = Depends(get_session),
):
    """
    Hora del día con mayor número de interrupciones en el rango.
    """
    _ensure_user_exists(user_id, db)
    range_days = _parse_range_days(range)
    return get_peak_distraction_hour(user_id=user_id, db=db, range_days=range_days)


@router.get("/weekly-pattern")
def stats_weekly_pattern(
    user_id: int,
    range: str = Query("7d", description="Rango de días, ej: '7d', '30d'"),
    db: DBSession = Depends(get_session),
):
    """
    Patrón semanal de trabajo:
    - tiempo trabajado
    - tiempo perdido
    - tiempo efectivo
    - interrupciones por día de la semana
    """
    _ensure_user_exists(user_id, db)
    range_days = _parse_range_days(range)
    return get_weekly_pattern(user_id=user_id, db=db, range_days=range_days)
