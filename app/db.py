from typing import Generator

from sqlmodel import SQLModel, Session, create_engine
from typing import Generator

from sqlmodel import SQLModel, Session, create_engine
from .models import User, Session as WorkSession, Interruption  # 👈 añade esta línea


# URL de la base de datos SQLite.
# El archivo se guardará en la raíz del proyecto como "hyperfocus.db"
DATABASE_URL = "sqlite:///./hyperfocus.db"

# El parámetro check_same_thread=False es necesario para usar SQLite con FastAPI/Uvicorn
engine = create_engine(
    DATABASE_URL,
    echo=False,  # pon True si quieres ver las queries en consola mientras desarrollas
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    """
    Crea todas las tablas definidas en los modelos SQLModel.
    Esta función se llamará al iniciar la aplicación.
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Dependencia que proporciona una sesión de base de datos.
    La usaremos con Depends en los endpoints.
    """
    with Session(engine) as session:
        yield session
