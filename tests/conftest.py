from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session

from app.main import app
from app.db import get_session
from app.models import User
from sqlalchemy.pool import StaticPool


# Base de datos de test en memoria
TEST_DATABASE_URL = "sqlite://"

engine_test = create_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # 👈 clave: usar siempre la misma conexión en memoria
)



@pytest.fixture(name="db_session")
def db_session_fixture():
    """
    Crea una base de datos en memoria para cada test de lógica.
    """
    SQLModel.metadata.create_all(engine_test)
    with Session(engine_test) as session:
        yield session
    SQLModel.metadata.drop_all(engine_test)


@pytest.fixture(name="sample_user")
def sample_user_fixture(db_session: Session) -> User:
    """
    Crea un usuario de ejemplo para los tests de lógica.
    """
    user = User(
        name="Test User",
        email="test@example.com",
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(name="client")
def client_fixture():
    """
    Crea un TestClient que usa la base de datos en memoria.
    """
    # Crear tablas en la BD de test
    SQLModel.metadata.create_all(engine_test)

    def override_get_session():
        with Session(engine_test) as session:
            yield session

    # Sobrescribir la dependencia en la app
    app.dependency_overrides[get_session] = override_get_session

    with TestClient(app) as c:
        yield c

    # Limpiar overrides y BD después del test
    app.dependency_overrides.clear()
    SQLModel.metadata.drop_all(engine_test)
