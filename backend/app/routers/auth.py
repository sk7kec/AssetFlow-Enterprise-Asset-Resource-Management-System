from fastapi import APIRouter
from fastapi import HTTPException

from app.schemas.user_schema import (
    UserSignup,
    UserLogin
)

from app.database import users_collection

from app.security import (
    hash_password,
    verify_password
)

from app.utils.auth_utils import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# ---------------- SIGNUP ---------------- #

@router.post("/signup")

def signup(user: UserSignup):

    existing = users_collection.find_one(
        {"email": user.email}
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user_data = {

        "name": user.name,

        "email": user.email,

        "password": hash_password(user.password),

        "department": user.department,

        "role": "Employee",

        "status": "Active"
    }

    users_collection.insert_one(user_data)

    return {

        "message": "Account Created Successfully"
    }

# ---------------- LOGIN ---------------- #

@router.post("/login")

def login(user: UserLogin):

    db_user = users_collection.find_one(
        {"email": user.email}
    )

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    if not verify_password(
            user.password,
            db_user["password"]):

        raise HTTPException(
            status_code=401,
            detail="Wrong Password"
        )

    token = create_access_token({

        "email": db_user["email"],

        "role": db_user["role"]

    })

    return {

        "access_token": token,

        "token_type": "bearer",

        "role": db_user["role"]

    }