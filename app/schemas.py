from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional, Annotated, ClassVar

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ValidationInfo,
    FieldValidationInfo,
    field_validator,
    ConfigDict
)

# ============================================================
# Enums
# ============================================================

class InterruptionType(str, Enum):
    family = "family"
    phone = "phone"
    noise = "noise"
    self = "self"
    urgent_task = "urgent_task"
    unknown = "unknown"


# ============================================================
# User Schemas
# ============================================================

class UserBase(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    email: EmailStr



class UserCreate(UserBase):
    """
    Datos necesarios para crear un usuario.
    """
    pass


class UserRead(UserBase):
    id: int
    created_at: datetime

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)


# ============================================================
# Session Schemas
# ============================================================

class SessionStart(BaseModel):
    """
    Esquema para iniciar una sesión de trabajo.
    El user_id es obligatorio.
    start_time se puede enviar o, si es None, se establecerá en "ahora" en la lógica.
    """
    user_id: int
    start_time: Optional[datetime] = None


class SessionRead(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    created_at: datetime

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)



# ============================================================
# Interruption Schemas
# ============================================================

class InterruptionBase(BaseModel):
    session_id: int
    user_id: int
    type: InterruptionType = Field(description="Tipo de interrupción")
    description: Annotated[str, Field(min_length=1, max_length=500)]
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(
        cls,
        v: datetime,
        info: ValidationInfo,
    ) -> datetime:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time debe ser posterior a start_time")
        return v


class InterruptionCreate(InterruptionBase):
    """
    El cliente NO envía duration: el backend lo calculará como (end_time - start_time).
    """
    pass


class InterruptionRead(BaseModel):
    id: int
    session_id: int
    user_id: int
    type: InterruptionType
    description: str
    start_time: datetime
    end_time: datetime
    duration: int
    created_at: datetime

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

