# Helix Network

## Local development

Install Node.js 24, then run `npm ci` followed by `npm start`, or double-click `start.bat`. The local Scramjet proxy viewer is available at `http://localhost:8080/viewer.html`; all viewer files now live in the project root.

## GitHub Pages

Push the project to a repository whose default branch is `main`, then enable **Settings → Pages → GitHub Actions**. The included workflow validates the site and deploys the static portal, games, and chat UI automatically.

GitHub Pages cannot run the Node.js/WebSocket proxy service. The deployed `viewer.html` automatically falls back to a normal embedded-preview page; the Scramjet proxy viewer only works through the local Node server or another server you deploy yourself. The chat uses Supabase when available and automatically switches to browser-local chat if that service cannot be reached.
