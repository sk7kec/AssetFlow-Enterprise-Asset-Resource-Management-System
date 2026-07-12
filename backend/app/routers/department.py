from fastapi import APIRouter
from fastapi import HTTPException

from bson import ObjectId

from app.database import departments_collection

from app.schemas.department_schema import (
    DepartmentCreate,
    DepartmentUpdate
)

from app.models.department import department_model

router = APIRouter(

    prefix="/departments",

    tags=["Departments"]

)




@router.post("/")

def create_department(department: DepartmentCreate):

    existing = departments_collection.find_one(

        {

            "name": department.name

        }

    )

    if existing:

        raise HTTPException(

            status_code=400,

            detail="Department already exists"

        )

    department_data = department_model(

        department.dict()

    )

    result = departments_collection.insert_one(

        department_data

    )

    return {

        "message": "Department Created",

        "id": str(result.inserted_id)

    }



@router.get("/")

def get_departments():

    departments = []

    for department in departments_collection.find():

        department["_id"] = str(department["_id"])

        departments.append(department)

    return departments



@router.get("/{department_id}")

def get_department(

    department_id: str

):

    department = departments_collection.find_one(

        {

            "_id": ObjectId(department_id)

        }

    )

    if not department:

        raise HTTPException(

            status_code=404,

            detail="Department not found"

        )

    department["_id"] = str(department["_id"])

    return department




@router.put("/{department_id}")

def update_department(

    department_id: str,

    department: DepartmentUpdate

):

    update_data = {

        k: v

        for k, v in department.dict().items()

        if v is not None

    }

    if not update_data:

        raise HTTPException(

            status_code=400,

            detail="No fields to update"

        )

    result = departments_collection.update_one(

        {

            "_id": ObjectId(department_id)

        },

        {

            "$set": update_data

        }

    )

    if result.matched_count == 0:

        raise HTTPException(

            status_code=404,

            detail="Department not found"

        )

    return {

        "message": "Department Updated"

    }




@router.delete("/{department_id}")

def deactivate_department(

    department_id: str

):

    result = departments_collection.update_one(

        {

            "_id": ObjectId(department_id)

        },

        {

            "$set": {

                "status": "Inactive"

            }

        }

    )

    if result.matched_count == 0:

        raise HTTPException(

            status_code=404,

            detail="Department not found"

        )

    return {

        "message": "Department Deactivated"

    }

