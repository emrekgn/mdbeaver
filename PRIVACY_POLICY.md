# Privacy Policy

Last updated: 2024-06-05

This Privacy Policy explains how **mdbeaver** handles information when you use the Google Drive “Open with” Markdown editor. The app is a static, client-only web page; no custom servers are involved.

## Information Collected
- **OAuth tokens and Google account identity**: Obtained via Google Identity Services to authorize Drive access. Tokens are stored only in your browser’s memory and cleared when you close the page or sign out.
- **File metadata and content**: When you open a Markdown file, its title, MIME type, and text content are downloaded directly from Google Drive into your browser for editing.

## How Information Is Used
- File metadata and content are used exclusively to display, edit, preview, and save Markdown files that you select.
- OAuth tokens are used to authenticate Drive API calls (`files.get`, `files.update`, `files.create`).
- The app does not log, transmit, or persist your data to any third-party services or developer-controlled servers.

## Data Storage and Retention
All file data lives in your Google Drive account. The application keeps working copies only in browser memory while the session is active. Closing or reloading the page clears any temporary state. The developer does not retain copies of your files or access tokens.

## Third-Party Services
mdbeaver relies on Google APIs (Drive API and Google Identity Services). Your use of those services is subject to Google’s own privacy policies and terms.

## Security
- OAuth flows use PKCE and HTTPS endpoints provided by Google.
- Because the app is static, there is no server-side database or log that could leak your data.
- You are responsible for protecting your device and browser environment (e.g., avoiding malicious extensions).

## Children’s Privacy
mdbeaver is intended for users who are permitted to use Google Drive under Google’s age requirements. The app does not knowingly collect personal information from children.

## Changes to This Policy
Updates to this policy will be posted in this file with a new revision date. Continued use of the app after any changes indicates acceptance of the updated policy.

## Contact
Questions about privacy or data handling can be directed to the support channel described in `SUPPORT.md`.
