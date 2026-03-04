"""
Firestore repository: same API shape as before (id as int) so frontend is unchanged.
Collections: descriptions, a4_colors, stock_entries. Each doc has "id" (int).
"""
from datetime import date
from app.db.firestore_client import get_firestore

COLL_DESCRIPTIONS = "descriptions"
COLL_COLORS = "a4_colors"
COLL_STOCK = "stock_entries"
COLL_USERS = "users"


def _next_id(db, collection_name: str) -> int:
    col = db.collection(collection_name)
    docs = list(col.stream())
    if not docs:
        return 1
    ids = [d.to_dict().get("id", 0) for d in docs]
    return max(ids) + 1


# --- Descriptions ---
def list_descriptions():
    db = get_firestore()
    docs = db.collection(COLL_DESCRIPTIONS).order_by("id").stream()
    return [{"id": d.to_dict()["id"], "name": d.to_dict()["name"], "opening_stock": d.to_dict().get("opening_stock", 0), "active": d.to_dict().get("active", True)} for d in docs]


def get_description_by_id(db, description_id: int):
    docs = list(db.collection(COLL_DESCRIPTIONS).where("id", "==", description_id).limit(1).stream())
    if not docs:
        return None
    d = docs[0].to_dict()
    d["id"] = d["id"]
    return d


def get_description_by_name(db, name: str):
    docs = list(db.collection(COLL_DESCRIPTIONS).where("name", "==", name).limit(1).stream())
    if not docs:
        return None
    return docs[0].to_dict()


def create_description(name: str, opening_stock: int = 0, active: bool = True):
    db = get_firestore()
    existing = list(db.collection(COLL_DESCRIPTIONS).where("name", "==", name).limit(1).stream())
    if existing:
        return None
    new_id = _next_id(db, COLL_DESCRIPTIONS)
    doc = {"id": new_id, "name": name.strip(), "opening_stock": opening_stock, "active": active}
    db.collection(COLL_DESCRIPTIONS).add(doc)
    return doc


def delete_description(description_id: int):
    db = get_firestore()
    docs = list(db.collection(COLL_DESCRIPTIONS).where("id", "==", description_id).limit(1).stream())
    if not docs:
        return False
    docs[0].reference.delete()
    return True


def update_description_opening_stock(description_id: int, opening_stock: int):
    db = get_firestore()
    docs = list(db.collection(COLL_DESCRIPTIONS).where("id", "==", description_id).limit(1).stream())
    if not docs:
        return False
    docs[0].reference.update({"opening_stock": opening_stock})
    return True


def update_description(db, description_id: int, name: str | None = None, opening_stock: int | None = None):
    """Update description by id. None values are not updated."""
    docs = list(db.collection(COLL_DESCRIPTIONS).where("id", "==", description_id).limit(1).stream())
    if not docs:
        return False
    updates = {}
    if name is not None:
        updates["name"] = name.strip()
    if opening_stock is not None:
        updates["opening_stock"] = int(opening_stock)
    if updates:
        docs[0].reference.update(updates)
    return True


# --- Colors ---
def list_colors():
    db = get_firestore()
    docs = db.collection(COLL_COLORS).order_by("id").stream()
    return [{"id": d.to_dict()["id"], "name": d.to_dict()["name"], "hex_code": d.to_dict()["hex_code"]} for d in docs]


def get_color_by_id(db, color_id: int):
    docs = list(db.collection(COLL_COLORS).where("id", "==", color_id).limit(1).stream())
    if not docs:
        return None
    return docs[0].to_dict()


def create_color(name: str, hex_code: str):
    db = get_firestore()
    existing = list(db.collection(COLL_COLORS).where("name", "==", name).limit(1).stream())
    if existing:
        return None
    new_id = _next_id(db, COLL_COLORS)
    doc = {"id": new_id, "name": name.strip(), "hex_code": hex_code.upper()}
    db.collection(COLL_COLORS).add(doc)
    return doc


# --- Stock entries ---
def create_stock_entry(entry_date: date, description_id: int, color_id: int, purchase_qty: int, usage_qty: int, reason: str | None):
    db = get_firestore()
    new_id = _next_id(db, COLL_STOCK)
    doc = {
        "id": new_id,
        "entry_date": entry_date.isoformat(),
        "description_id": description_id,
        "color_id": color_id,
        "purchase_qty": purchase_qty,
        "usage_qty": usage_qty,
        "reason": reason,
    }
    db.collection(COLL_STOCK).add(doc)
    return doc


def get_stock_entries_for_month(db, description_id: int, year: int, month: int):
    # entry_date stored as "YYYY-MM-DD"
    start = f"{year}-{month:02d}-01"
    end = f"{year}-{month:02d}-31"
    docs = (
        db.collection(COLL_STOCK)
        .where("description_id", "==", description_id)
        .where("entry_date", ">=", start)
        .where("entry_date", "<=", end)
        .stream()
    )
    return [d.to_dict() for d in docs]


def get_all_descriptions_ordered(db):
    docs = db.collection(COLL_DESCRIPTIONS).order_by("id").stream()
    return [d.to_dict() for d in docs]


def get_all_colors_ordered(db):
    docs = db.collection(COLL_COLORS).order_by("id").stream()
    return [d.to_dict() for d in docs]


# --- Users ---
def get_user_by_username(username: str):
    db = get_firestore()
    docs = list(db.collection(COLL_USERS).where("username", "==", username).limit(1).stream())
    if not docs:
        return None
    return docs[0].to_dict()


def list_users():
    db = get_firestore()
    docs = list(db.collection(COLL_USERS).order_by("id").stream())
    return [
        {
            "id": d.to_dict()["id"],
            "username": d.to_dict()["username"],
            "role": d.to_dict().get("role", "user"),
            "active": d.to_dict().get("active", True),
            "is_master_admin": d.to_dict().get("username") == "admin",
        }
        for d in docs
    ]


def create_user(username: str, password_hash: str, role: str = "user", active: bool = True):
    db = get_firestore()
    existing = list(db.collection(COLL_USERS).where("username", "==", username).limit(1).stream())
    if existing:
        return None
    new_id = _next_id(db, COLL_USERS)
    doc = {
        "id": new_id,
        "username": username.strip(),
        "password_hash": password_hash,
        "role": role,
        "active": active,
    }
    db.collection(COLL_USERS).add(doc)
    return {"id": new_id, "username": username, "role": role}


def _get_user_doc_by_id(db, user_id: int):
    docs = list(db.collection(COLL_USERS).where("id", "==", user_id).limit(1).stream())
    return docs[0] if docs else None


def update_user(user_id: int, role: str | None = None, active: bool | None = None):
    db = get_firestore()
    doc_ref = _get_user_doc_by_id(db, user_id)
    if not doc_ref:
        return False
    data = doc_ref.to_dict()
    if data.get("username") == "admin":
        return False  # Master admin protected
    updates = {}
    if role is not None:
        updates["role"] = role
    if active is not None:
        updates["active"] = active
    if updates:
        doc_ref.reference.update(updates)
    return True


def update_user_password(user_id: int, password_hash: str):
    db = get_firestore()
    doc_ref = _get_user_doc_by_id(db, user_id)
    if not doc_ref:
        return False
    doc_ref.reference.update({"password_hash": password_hash})
    return True


def delete_user(user_id: int):
    db = get_firestore()
    doc_ref = _get_user_doc_by_id(db, user_id)
    if not doc_ref:
        return False
    if doc_ref.to_dict().get("username") == "admin":
        return False  # Master admin protected
    doc_ref.reference.delete()
    return True
