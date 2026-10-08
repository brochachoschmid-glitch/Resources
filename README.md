# Resource Library

A public, curated library of public safety media: videos, documents, articles, audio and images, in one searchable grid.

- **Search** across titles, descriptions, topics and tags
- **Filter** by topic and media type, or click any `#tag` on a card
- **Shareable views**: the current filters are saved in the URL (e.g. `…/#topic=legal&type=document`)
- **Thumbnails**: YouTube links get them automatically; other items show a placeholder for their type unless you set `thumbnail`
- Light/dark mode, works on mobile, and needs no build step

## Adding or editing resources

All content lives in **`data/resources.json`**. To add a resource, copy an existing entry inside `"resources"` and change its fields:

```json
{
  "title": "Drone as First Responder Program Overview",
  "description": "One or two sentences on what this is and why it's useful.",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "type": "video",
  "topic": "uas-tech",
  "tags": ["uas", "dfr", "faa"],
  "date": "2026-04-02",
  "thumbnail": "https://example.com/optional-image.jpg"
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Shown on the card |
| `url` | yes | Where the card links (opens in a new tab). Must be `http(s)` |
| `type` | yes | One of the `id`s under `"types"`: `video`, `document`, `article`, `audio`, `image` |
| `topic` | yes | One of the `id`s under `"topics"`: `training`, `legal`, `uas-tech`, `wellness`, `tactical-science` |
| `description` | no | Shortened to 3 lines on the card |
| `tags` | no | Free-form keywords, all searchable and clickable |
| `date` | no | `YYYY-MM-DD`; newest items appear first |
| `thumbnail` | no | Image URL. Not needed for YouTube links |

To **add or rename a topic or type**, edit the `"topics"` or `"types"` lists at the top of the file. The `id` is what entries refer to, and the `label` is what visitors see. A new type gets a default colour; to give it its own colour, add `--type-<id>` to `assets/style.css`.

You can edit the file directly on GitHub with the pencil icon. Each push runs a check (`.github/workflows/validate.yml`) that flags invalid JSON or entries with unknown topics or types.

**Hosting large files:** link to YouTube, Vimeo, Google Drive, agency sites and so on rather than adding big files to this repo. Small PDFs or images can go in an `assets/files/` folder and be linked as `assets/files/name.pdf`.

## Publishing on GitHub Pages

1. Merge this branch into `main`.
2. In the repo, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`. Save.
4. After a minute or two the site will be live at `https://<username>.github.io/<repo>/`. You can add a custom domain on the same page.

Note that GitHub Pages sites are public even when the repo is private (unless you are on an Enterprise plan).

## Running locally

Because the page loads `data/resources.json` with `fetch`, serve it over HTTP rather than opening the file directly:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

```
index.html             page structure
assets/style.css       styling (colours are set at the top, including per-type colours)
assets/app.js          search, filters, cards
data/resources.json    all content: topics, types, resources
scripts/validate.py    data checker (used by CI)
```
