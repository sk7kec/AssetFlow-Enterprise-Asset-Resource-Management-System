from pymongo import MongoClient
from app.config import *

client = MongoClient(MONGO_URI)

db = client[DATABASE_NAME]

users_collection = db["users"]

departments_collection = db["departments"]