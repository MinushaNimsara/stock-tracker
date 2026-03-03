"""
Firestore repository: same API shape as before (id as int) so frontend is unchanged.
Collections: descriptions, a4_colors, stock_entries. Each doc has "id" (int).
"""
from datetime import date
from app.db.firestore_client import get_firestore

COLL_DESCRIPTIONS = "descriptions"
COLL_COLORS = "a4_colors"
COLL_STOCK = "stock_entries"


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
