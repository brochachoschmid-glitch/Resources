# Resource Library

A static GitHub Pages site (no build step): `index.html` + `assets/` render the cards from `data/resources.json`.

- Content changes (adding, editing or removing resources, topics or types) follow the `add-resource` skill in `.claude/skills/add-resource/SKILL.md`. Use it whenever the user shares a link or asks to change what's on the site.
- Use `scripts/resources.py` for entry edits and run `python3 scripts/validate.py` before every commit.
- Live site: https://brochachoschmid-glitch.github.io/Resources/
