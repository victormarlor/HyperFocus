from datetime import datetime, timedelta, timezone
from typing import Dict, List

from sqlmodel import Session, select

from app.models import Session as WorkSession, Interruption


def get_summary_stats(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Calcula estadísticas generales de un usuario en un rango de días.

    - total_sessions: número de sesiones en el rango
    - total_interruptions: número de interrupciones en el rango
    - total_time_worked_seconds: tiempo total de sesiones finalizadas (en segundos)
    - total_time_lost_seconds: suma de las duraciones de las interrupciones (en segundos)
    - effective_time_seconds: tiempo efectivo de trabajo (trabajado - perdido, mínimo 0)
    - average_interruption_duration_seconds: duración media de las interrupciones
    - interruptions_per_hour: interrupciones por hora efectiva de trabajo
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=range_days)

    # Sesiones del usuario en el rango
    sessions_query = select(WorkSession).where(
        WorkSession.user_id == user_id,
        WorkSession.start_time >= since,
    )
    sessions = db.exec(sessions_query).all()

    # Interrupciones del usuario en el rango
    interruptions_query = select(Interruption).where(
        Interruption.user_id == user_id,
        Interruption.start_time >= since,
    )
    interruptions = db.exec(interruptions_query).all()

    total_sessions = len(sessions)
    total_interruptions = len(interruptions)

    # Tiempo total trabajado: solo sesiones que tengan end_time (terminadas)
    total_time_worked_seconds = 0.0
    for s in sessions:
        if s.end_time is not None:
            delta = (s.end_time - s.start_time).total_seconds()
            if delta > 0:
                total_time_worked_seconds += delta

    # Tiempo total perdido = suma de duraciones de interrupciones
    total_time_lost_seconds = 0.0
    for it in interruptions:
        if it.duration is not None and it.duration > 0:
            total_time_lost_seconds += it.duration

    # Tiempo efectivo de trabajo
    effective_time_seconds = max(total_time_worked_seconds - total_time_lost_seconds, 0.0)

    # Duración media de las interrupciones
    if total_interruptions > 0:
        average_interruption_duration_seconds = total_time_lost_seconds / total_interruptions
    else:
        average_interruption_duration_seconds = 0.0

    # Interrupciones por hora de trabajo efectiva
    if effective_time_seconds > 0:
        hours_effective = effective_time_seconds / 3600.0
        interruptions_per_hour = total_interruptions / hours_effective
    else:
        interruptions_per_hour = 0.0

    return {
        "user_id": user_id,
        "range_days": range_days,
        "total_sessions": total_sessions,
        "total_interruptions": total_interruptions,
        "total_time_worked_seconds": int(total_time_worked_seconds),
        "total_time_lost_seconds": int(total_time_lost_seconds),
        "effective_time_seconds": int(effective_time_seconds),
        "average_interruption_duration_seconds": average_interruption_duration_seconds,
        "interruptions_per_hour": interruptions_per_hour,
    }


def get_interruption_type_stats(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> Dict:
    """
    Calcula estadísticas de interrupciones por tipo para un usuario.

    Devuelve:
    - counts: dict con conteo por tipo
    - proportions: dict con proporciones por tipo (0-1)
    - total_interruptions: total de interrupciones en el rango
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=range_days)

    # Obtener interrupciones del usuario en el rango
    interruptions_query = select(Interruption).where(
        Interruption.user_id == user_id,
        Interruption.start_time >= since,
    )
    interruptions = db.exec(interruptions_query).all()

    counts: Dict[str, int] = {}
    for it in interruptions:
        it_type = it.type or "unknown"
        counts[it_type] = counts.get(it_type, 0) + 1

    total_interruptions = sum(counts.values())

    if total_interruptions > 0:
        proportions = {
            t: counts[t] / total_interruptions for t in counts
        }
    else:
        proportions = {t: 0.0 for t in counts}

    return {
        "user_id": user_id,
        "range_days": range_days,
        "counts": counts,
        "proportions": proportions,
        "total_interruptions": total_interruptions,
    }


def get_productive_hours_stats(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> dict:
    """
    Calcula, por cada hora del día (0-23), el tiempo trabajado y las interrupciones.

    Devuelve:
    {
      "user_id": ...,
      "range_days": ...,
      "hours": [
        {
          "hour": 0,
          "work_seconds": 1200,
          "interruptions": 2,
          "interruptions_per_hour": 6.0
        },
        ...
      ]
    }
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=range_days)

    # Inicializamos estructura de 24 horas
    hours_data = {
        h: {"work_seconds": 0.0, "interruptions": 0} for h in range(24)
    }

    # 1) Repartir el tiempo de sesiones por horas del día
    sessions_query = select(WorkSession).where(
        WorkSession.user_id == user_id,
        WorkSession.start_time >= since,
        WorkSession.end_time.is_not(None),
    )
    sessions = db.exec(sessions_query).all()

    for s in sessions:
        start = s.start_time
        end = s.end_time

        if start is None or end is None:
            continue

        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        if end <= since or start >= now:
            continue

        start = max(start, since)
        end = min(end, now)

        if end <= start:
            continue

        current = start
        while current < end:
            hour_start = current
            next_hour = (
                hour_start.replace(minute=0, second=0, microsecond=0)
                + timedelta(hours=1)
            )
            chunk_end = min(end, next_hour)
            delta_seconds = (chunk_end - hour_start).total_seconds()

            if delta_seconds > 0:
                hour_index = hour_start.hour
                hours_data[hour_index]["work_seconds"] += delta_seconds

            current = chunk_end

    # 2) Contar interrupciones por hora de inicio
    interruptions_query = select(Interruption).where(
        Interruption.user_id == user_id,
        Interruption.start_time >= since,
    )
    interruptions = db.exec(interruptions_query).all()

    for it in interruptions:
        it_start = it.start_time
        if it_start is None:
            continue

        if it_start.tzinfo is None:
            it_start = it_start.replace(tzinfo=timezone.utc)

        hour_index = it_start.hour
        hours_data[hour_index]["interruptions"] += 1

    # 3) Construir respuesta en formato de lista
    hours_list: List[dict] = []
    for h in range(24):
        work_seconds = hours_data[h]["work_seconds"]
        interruptions_count = hours_data[h]["interruptions"]

        if work_seconds > 0:
            hours_effective = work_seconds / 3600.0
            interruptions_per_hour = interruptions_count / hours_effective
        else:
            interruptions_per_hour = 0.0

        hours_list.append(
            {
                "hour": h,
                "work_seconds": int(work_seconds),
                "interruptions": interruptions_count,
                "interruptions_per_hour": interruptions_per_hour,
            }
        )

    return {
        "user_id": user_id,
        "range_days": range_days,
        "hours": hours_list,
    }


def get_peak_distraction_hour(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> dict:
    """
    Devuelve la hora del día (0-23) con más interrupciones para un usuario
    en los últimos `range_days` días.

    Si no hay interrupciones en el rango, peak_hour será None y peak_interruptions = 0.
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=range_days)

    interruptions_per_hour = {h: 0 for h in range(24)}

    interruptions_query = select(Interruption).where(
        Interruption.user_id == user_id,
        Interruption.start_time >= since,
    )
    interruptions = db.exec(interruptions_query).all()

    total_interruptions = 0

    for it in interruptions:
        it_start = it.start_time
        if it_start is None:
            continue

        if it_start.tzinfo is None:
            it_start = it_start.replace(tzinfo=timezone.utc)

        hour_index = it_start.hour
        interruptions_per_hour[hour_index] += 1
        total_interruptions += 1

    if total_interruptions == 0:
        peak_hour = None
        peak_interruptions = 0
    else:
        peak_hour = max(interruptions_per_hour, key=lambda h: interruptions_per_hour[h])
        peak_interruptions = interruptions_per_hour[peak_hour]

    return {
        "user_id": user_id,
        "range_days": range_days,
        "peak_hour": peak_hour,
        "peak_interruptions": peak_interruptions,
        "total_interruptions": total_interruptions,
    }


def get_weekly_pattern(
    user_id: int,
    db: Session,
    range_days: int = 7,
) -> dict:
    """
    Calcula el patrón semanal de trabajo e interrupciones para un usuario.

    Agrupa por día de la semana (0=lunes, 6=domingo) y devuelve:

    - work_seconds: tiempo trabajado (sesiones) ese día
    - time_lost_seconds: tiempo perdido por interrupciones ese día
    - effective_time_seconds: max(work - lost, 0)
    - interruptions: número de interrupciones
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=range_days)

    weekly_data = {
        i: {
            "work_seconds": 0.0,
            "time_lost_seconds": 0.0,
            "interruptions": 0,
        }
        for i in range(7)
    }

    # 1) Repartir tiempo de sesiones por día
    sessions_query = select(WorkSession).where(
        WorkSession.user_id == user_id,
        WorkSession.start_time >= since,
        WorkSession.end_time.is_not(None),
    )
    sessions = db.exec(sessions_query).all()

    for s in sessions:
        start = s.start_time
        end = s.end_time

        if start is None or end is None:
            continue

        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        if end <= since or start >= now:
            continue

        start = max(start, since)
        end = min(end, now)

        if end <= start:
            continue

        current = start
        while current < end:
            day_start = current
            next_day = (
                day_start.replace(hour=0, minute=0, second=0, microsecond=0)
                + timedelta(days=1)
            )
            chunk_end = min(end, next_day)
            delta_seconds = (chunk_end - day_start).total_seconds()

            if delta_seconds > 0:
                weekday_index = day_start.weekday()
                weekly_data[weekday_index]["work_seconds"] += delta_seconds

            current = chunk_end

    # 2) Repartir tiempo perdido por interrupciones por día
    interruptions_query = select(Interruption).where(
        Interruption.user_id == user_id,
        Interruption.start_time >= since,
    )
    interruptions = db.exec(interruptions_query).all()

    for it in interruptions:
        it_start = it.start_time
        if it_start is None:
            continue

        if it_start.tzinfo is None:
            it_start = it_start.replace(tzinfo=timezone.utc)

        weekday_index = it_start.weekday()
        weekly_data[weekday_index]["interruptions"] += 1

        if it.duration is not None and it.duration > 0:
            weekly_data[weekday_index]["time_lost_seconds"] += it.duration

    weekday_names = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]

    days_list: List[dict] = []
    for i in range(7):
        work = weekly_data[i]["work_seconds"]
        lost = weekly_data[i]["time_lost_seconds"]
        interruptions_count = weekly_data[i]["interruptions"]

        effective = max(work - lost, 0.0)

        days_list.append(
            {
                "weekday_index": i,
                "weekday_name": weekday_names[i],
                "work_seconds": int(work),
                "time_lost_seconds": int(lost),
                "effective_time_seconds": int(effective),
                "interruptions": interruptions_count,
            }
        )

    return {
        "user_id": user_id,
        "range_days": range_days,
        "days": days_list,
    }
