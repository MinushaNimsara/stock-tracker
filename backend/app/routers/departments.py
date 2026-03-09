"""Departments for Excel-style IN/OUT tracking. Matches RICH LIGHT APPARELS format."""
from fastapi import APIRouter, Depends

from app.auth_deps import get_current_user_payload

router = APIRouter(prefix="/departments", tags=["departments"])

# Excel structure: IN columns | OUT columns
IN_DEPARTMENTS = ["PACKING", "HR & PROCESS", "QUALITY", "OFFICE"]
OUT_DEPARTMENTS = ["PRODUCTION", "STORES", "CUTTING", "PACKING", "HR & PROCESS", "QUALITY", "OFFICE"]


@router.get("")
def list_departments(_: dict = Depends(get_current_user_payload)):
    return {"in": IN_DEPARTMENTS, "out": OUT_DEPARTMENTS}
