## mdbeaver

Simple client-only Google Drive “Open with” application that downloads, edits, previews, and saves Markdown files via the Drive REST API.

### Features

- OAuth handled completely in-browser using Google Identity Services for Web.
- Loads Drive metadata/content for `.md` files via `files.get`.
- Markdown editing with live preview (powered by `marked`).
- Manual save + optional auto-save (debounced).

### Getting Started

1. **Create OAuth credentials**
   - In the Google Cloud console enable the Drive API.
   - Create OAuth client credentials of type **Web application**.
   - Add your hosted origin and `https://<your-domain>/` to authorized origins/redirects.
   - Replace `CLIENT_ID` in `app.js` with your client ID.

2. **Configure the Drive app**
   - In the Google API Console, go to Drive SDK configuration.
   - Enable the **Drive UI integration** and select `Open with`.
   - Set the launch URL to the hosted location of `index.html`.
   - Declare support for the MIME type `text/markdown` (and optionally `application/octet-stream` with `.md` extension).

3. **Host the static bundle**
   - Upload `index.html`, `style.css`, and `app.js` to any HTTPS static host (Firebase Hosting, GitHub Pages, Cloud Storage + HTTPS Load Balancer, etc.).
   - Include the images from `img/` (`favicon.png`, `appicon.png`) so the favicon and header badge render.

4. **Use it**
   - In Drive, right-click any Markdown file and pick **Open with → Your App**.
   - When prompted, grant access; the file content loads into the editor and can be saved back to Drive.

### Notes

- As a pure browser app there is **no client secret**; the Google Identity Services token client handles PKCE securely.
- Drive sends a `state` query parameter when launching the app. `app.js` parses this to obtain the file ID, so opening `index.html` directly without Drive won’t load a file.
- The save flow uses `uploadType=media` with `PATCH /upload/drive/v3/files/{id}` which replaces the file contents and creates a new revision.
