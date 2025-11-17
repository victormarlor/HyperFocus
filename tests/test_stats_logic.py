from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.core.stats_logic import (
    get_summary_stats,
    get_interruption_type_stats,
    get_productive_hours_stats,
    get_peak_distraction_hour,
    get_weekly_pattern,
)
from app.models import Session as WorkSession, Interruption, User


def _make_dt(hour: int, minute: int = 0) -> datetime:
    """
    Helper para crear datetimes en un día cercano a 'ahora' (UTC),
    de forma que siempre caigan dentro del rango de análisis (range_days).
    """
    # Un día antes de ahora para estar seguro de que está dentro de los últimos 7 días
    base_day = (datetime.now(timezone.utc) - timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return base_day.replace(hour=hour, minute=minute, second=0, microsecond=0)



def test_summary_stats_basic(db_session: Session, sample_user: User):
    """
    Comprueba que get_summary_stats calcula bien tiempos básicos.
    - 1 sesión de 1 hora
    - 1 interrupción de 15 minutos
    """
    user_id = sample_user.id

    # Sesión: 10:00 - 11:00
    session = WorkSession(
        user_id=user_id,
        start_time=_make_dt(10),
        end_time=_make_dt(11),
        created_at=_make_dt(9),
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    # Interrupción: 10:15 - 10:30 (900 segundos)
    interruption = Interruption(
        session_id=session.id,
        user_id=user_id,
        type="phone",
        description="Test interruption",
        start_time=_make_dt(10, 15),
        end_time=_make_dt(10, 30),
        duration=900,
        created_at=_make_dt(10),
    )
    db_session.add(interruption)
    db_session.commit()

    stats = get_summary_stats(user_id=user_id, db=db_session, range_days=7)

    assert stats["total_sessions"] == 1
    assert stats["total_interruptions"] == 1
    # 1 hora = 3600 segundos
    assert stats["total_time_worked_seconds"] == 3600
    assert stats["total_time_lost_seconds"] == 900
    assert stats["effective_time_seconds"] == 3600 - 900
    assert stats["average_interruption_duration_seconds"] == 900
    # comprobamos que al menos hay un valor razonable para interruptions_per_hour
    assert stats["interruptions_per_hour"] > 0


def test_interruption_type_stats_counts(db_session: Session, sample_user: User):
    """
    Comprueba que se cuentan bien las interrupciones por tipo.
    """
    user_id = sample_user.id

    session = WorkSession(
        user_id=user_id,
        start_time=_make_dt(10),
        end_time=_make_dt(11),
        created_at=_make_dt(9),
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    interruptions = [
        Interruption(
            session_id=session.id,
            user_id=user_id,
            type="phone",
            description="Phone 1",
            start_time=_make_dt(10, 5),
            end_time=_make_dt(10, 10),
            duration=300,
            created_at=_make_dt(10, 0),
        ),
        Interruption(
            session_id=session.id,
            user_id=user_id,
            type="phone",
            description="Phone 2",
            start_time=_make_dt(10, 20),
            end_time=_make_dt(10, 25),
            duration=300,
            created_at=_make_dt(10, 15),
        ),
        Interruption(
            session_id=session.id,
            user_id=user_id,
            type="noise",
            description="Noise 1",
            start_time=_make_dt(10, 30),
            end_time=_make_dt(10, 35),
            duration=300,
            created_at=_make_dt(10, 25),
        ),
    ]

    for it in interruptions:
        db_session.add(it)
    db_session.commit()

    stats = get_interruption_type_stats(user_id=user_id, db=db_session, range_days=7)

    assert stats["total_interruptions"] == 3
    assert stats["counts"]["phone"] == 2
    assert stats["counts"]["noise"] == 1
    # Proporciones: phone = 2/3, noise = 1/3
    assert abs(stats["proportions"]["phone"] - (2 / 3)) < 1e-6
    assert abs(stats["proportions"]["noise"] - (1 / 3)) < 1e-6


def test_peak_distraction_hour(db_session: Session, sample_user: User):
    """
    Comprueba que se detecta correctamente la hora con más interrupciones.
    """
    user_id = sample_user.id

    session = WorkSession(
        user_id=user_id,
        start_time=_make_dt(9),
        end_time=_make_dt(12),
        created_at=_make_dt(8),
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    # 2 interrupciones a las 10.x
    inters = [
        Interruption(
            session_id=session.id,
            user_id=user_id,
            type="phone",
            description="At 10:05",
            start_time=_make_dt(10, 5),
            end_time=_make_dt(10, 10),
            duration=300,
            created_at=_make_dt(10, 0),
        ),
        Interruption(
            session_id=session.id,
            user_id=user_id,
            type="noise",
            description="At 10:20",
            start_time=_make_dt(10, 20),
            end_time=_make_dt(10, 25),
            duration=300,
            created_at=_make_dt(10, 15),
        ),
        # 1 interrupción a las 11.x
        Interruption(
            session_id=session.id,
            user_id=user_id,
            type="family",
            description="At 11:00",
            start_time=_make_dt(11, 0),
            end_time=_make_dt(11, 5),
            duration=300,
            created_at=_make_dt(11, 0),
        ),
    ]

    for it in inters:
        db_session.add(it)
    db_session.commit()

    stats = get_peak_distraction_hour(user_id=user_id, db=db_session, range_days=7)

    assert stats["total_interruptions"] == 3
    assert stats["peak_hour"] == 10
    assert stats["peak_interruptions"] == 2
