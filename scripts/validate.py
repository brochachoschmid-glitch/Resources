#!/usr/bin/env python3
"""Validate data/resources.json: valid JSON, required fields, known topics/types."""
import json
import re
import sys
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "data" / "resources.json"

try:
    data = json.loads(path.read_text(encoding="utf-8"))
except json.JSONDecodeError as e:
    sys.exit(f"{path.name}: invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}")

errors = []
topics = {t["id"] for t in data.get("topics", [])}
types = {t["id"] for t in data.get("types", [])}

for i, r in enumerate(data.get("resources", []), 1):
    where = f"resource #{i} ({r.get('title', 'untitled')!r})"
    for field in ("title", "url", "type", "topic"):
        if not r.get(field):
            errors.append(f"{where}: missing '{field}'")
    if r.get("url") and not re.match(r"^https?://|^[\w./-]+$", r["url"]):
        errors.append(f"{where}: url must be http(s) or a relative path")
    if r.get("type") and r["type"] not in types:
        errors.append(f"{where}: unknown type '{r['type']}' (expected one of {sorted(types)})")
    if r.get("topic") and r["topic"] not in topics:
        errors.append(f"{where}: unknown topic '{r['topic']}' (expected one of {sorted(topics)})")
    if "tags" in r and not isinstance(r["tags"], list):
        errors.append(f"{where}: 'tags' must be a list")
    if r.get("date") and not re.match(r"^\d{4}-\d{2}-\d{2}$", r["date"]):
        errors.append(f"{where}: date must be YYYY-MM-DD")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"OK: {len(data.get('resources', []))} resources, {len(topics)} topics, {len(types)} types")
