from datetime import datetime

def department_model(data):

    return {

        "name": data["name"],

        "department_head": data.get("department_head"),

        "parent_department": data.get("parent_department"),

        "status": data.get("status", "Active"),

        "created_at": datetime.utcnow(),

        "updated_at": datetime.utcnow()
    }