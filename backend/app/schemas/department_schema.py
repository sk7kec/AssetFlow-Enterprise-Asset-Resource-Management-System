from pydantic import BaseModel
from typing import Optional

class DepartmentCreate(BaseModel):

    name: str

    department_head: Optional[str] = None

    parent_department: Optional[str] = None

    status: Optional[str] = "Active"


class DepartmentUpdate(BaseModel):

    name: Optional[str] = None

    department_head: Optional[str] = None

    parent_department: Optional[str] = None

    status: Optional[str] = None