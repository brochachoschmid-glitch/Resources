---
name: add-resource
description: Add, edit or remove entries in the Resource Library site (data/resources.json) and publish the change. Use when the user shares one or more links to add to the library, asks to change or remove a resource, add or rename a topic, list what's in the library, or clear out the placeholder examples.
argument-hint: "<url(s) or request>  e.g. https://youtu.be/abc  |  remove the thermal chart  |  list legal"
---

# Update the Resource Library

All site content lives in `data/resources.json`. Make changes with `scripts/resources.py` rather than hand-editing the JSON, so formatting stays consistent and duplicates get caught.

Request: $ARGUMENTS

## 1. Work out what's being asked

- **Links**: add each one (step 2).
- **"Change / fix / retag / move …"**: `update` (step 3).
- **"Remove / delete …"**: `remove`. Say which entry matched before removing it.
- **"What's in …" / "list …"**: run `list` and summarise. Nothing to publish.
- **"Clear the examples"**: `remove-examples` deletes every entry tagged `example`.
- **New or renamed topic or type**: edit the `topics` / `types` lists in the JSON directly. When renaming an `id`, update every entry that uses it. A new type also needs a colour, `--type-<id>`, under `:root` and both dark-mode blocks in `assets/style.css`.

If no request was given, ask what they'd like to add or change.

## 2. Adding a link

1. **Fetch the page** with WebFetch to learn what it is. For YouTube, the title and channel are enough; the thumbnail is automatic. If the page can't be fetched (login wall, PDF that won't load), use what the URL and the user tell you, and say so.
2. **Fill in the fields**:
   - `title`: the resource's real title, cleaned up (drop site-name suffixes like " - YouTube").
   - `description`: 1–2 plain sentences on what it is and why it's useful to public safety professionals. Don't hype it, and don't invent claims the page doesn't support.
   - `type`: `video`, `document` (PDF, slides, handout), `article` (web page, post, news), `audio` (podcast, recording) or `image` (infographic, chart).
   - `topic`: whichever fits best of `python3 scripts/resources.py list`'s current topics. As of writing these are `training`, `legal`, `uas-tech`, `wellness`, `tactical-science`. If nothing fits, ask instead of forcing it.
   - `tags`: 2–5 short lowercase keywords. Reuse existing tags where they fit (check `list` output) so tag filters stay useful.
   - `date`: the resource's publish date if the page shows one, otherwise leave it out and the script uses today's date.
   - `thumbnail`: only for non-YouTube items that have an obvious preview image (for example `og:image`). Otherwise leave it out.
   - If the user gave their own title, description, topic or tags, use theirs.
3. **Add it**:
   ```sh
   python3 scripts/resources.py add --title "…" --url "…" --type video --topic training \
     --description "…" --tags "tag one,tag two" [--date 2026-05-01] [--thumbnail "…"]
   ```
   If the script reports a duplicate, tell the user and offer to update the existing entry instead.

For several links, add them all and then publish once.

## 3. Editing

```sh
python3 scripts/resources.py update --match "<url or part of title>" --topic legal --tags "a,b"
```
Only the flags you pass are changed. If `--match` hits zero or several entries, the script lists them; pick the right one or ask.

## 4. Check, then publish

1. Run `python3 scripts/validate.py`. It must print `OK`. Fix anything it flags.
2. Show the user what changed, briefly: title, type, topic and tags for each added or changed entry.
3. Commit only `data/resources.json` (plus `assets/style.css` if you added a type colour), with a message like `Add resource: <title>` or `Update library: <summary>`.
4. Push to the current branch. GitHub Pages republishes in about a minute. If the current branch isn't the one Pages publishes from, say so, and offer to open a pull request into that branch instead of claiming the site is updated.
5. Finish by stating what changed and that it will be live shortly at https://brochachoschmid-glitch.github.io/Resources/.
