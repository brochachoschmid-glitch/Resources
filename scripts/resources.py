#!/usr/bin/env python3
"""Manage entries in data/resources.json.

  resources.py list [--topic T] [--type T] [--search TEXT]
  resources.py add --title .. --url .. --type .. --topic .. [--description ..] [--tags a,b] [--date YYYY-MM-DD] [--thumbnail URL]
  resources.py update --match TEXT [--title ..] [--url ..] [--type ..] [--topic ..] [--description ..] [--tags a,b] [--date ..] [--thumbnail ..]
  resources.py remove --match TEXT
  resources.py remove-examples

--match finds one entry by exact URL or by a case-insensitive title substring;
it refuses to act if that matches zero or several entries.
"""
import argparse
import datetime
import json
import sys
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / "data" / "resources.json"
FIELDS = ["title", "description", "url", "type", "topic", "tags", "date", "thumbnail"]


def load():
    return json.loads(PATH.read_text(encoding="utf-8"))


def save(data):
    # Keep a stable key order so diffs stay readable.
    data["resources"] = [{k: r[k] for k in FIELDS if r.get(k) not in (None, "", [])}
                         for r in data["resources"]]
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def find(data, match):
    m = match.strip().lower()
    hits = [r for r in data["resources"] if r.get("url", "").lower() == m]
    if not hits:
        hits = [r for r in data["resources"] if m in r.get("title", "").lower()]
    if len(hits) != 1:
        titles = "\n  ".join(r["title"] for r in hits) or "(none)"
        sys.exit(f"--match {match!r} matched {len(hits)} entries; need exactly 1:\n  {titles}")
    return hits[0]


def check_ids(data, entry):
    topics = {t["id"] for t in data["topics"]}
    types = {t["id"] for t in data["types"]}
    if entry.get("topic") and entry["topic"] not in topics:
        sys.exit(f"Unknown topic {entry['topic']!r}. Options: {', '.join(sorted(topics))}")
    if entry.get("type") and entry["type"] not in types:
        sys.exit(f"Unknown type {entry['type']!r}. Options: {', '.join(sorted(types))}")


def fields_from(args):
    out = {}
    for k in FIELDS:
        v = getattr(args, k, None)
        if v is not None:
            out[k] = [t.strip() for t in v.split(",") if t.strip()] if k == "tags" else v.strip()
    return out


def main():
    p = argparse.ArgumentParser(description="Manage data/resources.json")
    sub = p.add_subparsers(dest="cmd", required=True)

    ls = sub.add_parser("list")
    ls.add_argument("--topic")
    ls.add_argument("--type")
    ls.add_argument("--search")

    for name in ("add", "update"):
        s = sub.add_parser(name)
        if name == "update":
            s.add_argument("--match", required=True)
        for k in FIELDS:
            s.add_argument("--" + k, required=(name == "add" and k in ("title", "url", "type", "topic")))

    rm = sub.add_parser("remove")
    rm.add_argument("--match", required=True)
    sub.add_parser("remove-examples")

    args = p.parse_args()
    data = load()
    res = data["resources"]

    if args.cmd == "list":
        q = (args.search or "").lower()
        rows = [r for r in res
                if (not args.topic or r["topic"] == args.topic)
                and (not args.type or r["type"] == args.type)
                and (not q or q in json.dumps(r).lower())]
        for r in rows:
            print(f"[{r['topic']}/{r['type']}] {r['title']}\n    {r['url']}")
        print(f"{len(rows)} of {len(res)} resources")
        return

    if args.cmd == "add":
        entry = fields_from(args)
        entry.setdefault("date", datetime.date.today().isoformat())
        check_ids(data, entry)
        dup = [r for r in res if r["url"].rstrip("/").lower() == entry["url"].rstrip("/").lower()]
        if dup:
            sys.exit(f"Already in the library: {dup[0]['title']!r}. Use 'update' instead.")
        res.append(entry)
        msg = f"Added: {entry['title']}"
    elif args.cmd == "update":
        entry = find(data, args.match)
        changes = fields_from(args)
        check_ids(data, changes)
        entry.update(changes)
        msg = f"Updated: {entry['title']} ({', '.join(changes) or 'no changes'})"
    elif args.cmd == "remove":
        entry = find(data, args.match)
        res.remove(entry)
        msg = f"Removed: {entry['title']}"
    else:  # remove-examples
        before = len(res)
        data["resources"] = res = [r for r in res if "example" not in [t.lower() for t in r.get("tags", [])]]
        msg = f"Removed {before - len(res)} placeholder example entries"

    save(data)
    print(msg)


if __name__ == "__main__":
    main()
