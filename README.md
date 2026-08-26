# RRB Learning Hub

Static learning website prepared for GitHub Pages.

## Structure

- `index.html` - main page
- `assets/styles.css` - site styles
- `assets/course-data.js` - course/module/topic/exercise data
- `assets/app.js` - application behavior
- `assets/logo.png` - header logo
- `assets/favicon.png` - browser icon
- `.nojekyll` - prevents Jekyll processing on GitHub Pages

## Local preview

From the repository root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Commit and push to the `main` branch.
4. In GitHub, open **Settings > Pages**.
5. Choose **Deploy from a branch**.
6. Select branch `main` and folder `/ (root)`, then save.

The site uses relative asset paths, so it works for both a user site and a project site.

## Release checks performed

- HTML parsed without structural parser errors.
- JavaScript syntax checked with Node.js.
- Duplicate static HTML IDs checked.
- DOM IDs referenced by the static shell checked.
- Course/module/topic/exercise identifiers audited for duplicates.
- Section numbering format audited.
- No external runtime dependency is required.
- No third-party tutorial branding is embedded in the publish files.
- No em dash or en dash characters are present.

For content changes, edit `assets/course-data.js`. For UI changes, edit `assets/styles.css` and `assets/app.js`.
