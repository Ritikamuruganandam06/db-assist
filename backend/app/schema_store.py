import json
import os

DB_JSON_PATH = "./db.json"


def _load_db():
    if not os.path.exists(DB_JSON_PATH):
        _save_db({"schema": None})
    with open(DB_JSON_PATH, "r") as f:
        return json.load(f)


def _save_db(data):
    with open(DB_JSON_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_markdown_schema():
    return _load_db().get("schema")


def write_markdown_schema(markdown_schema):
    data = _load_db()
    data["schema"] = markdown_schema
    _save_db(data)
