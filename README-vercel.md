# Deploying Helix to Vercel

## 1. What works on Vercel vs. not

Vercel is serverless — there's no persistent process, so `server.js`
(the Fastify + WebSocket `wisp` proxy) **cannot run there**, same as it
already can't on GitHub Pages. You don't need to do anything about
this: `viewer.html` already falls back to its safe iframe-preview mode
when the local server isn't present, per your own README. It'll behave
on Vercel exactly like it does on GitHub Pages today.

Everything else — the static pages, the arcade, and the chat — works
fine on Vercel, plus a couple of small serverless functions under `/api`.

## 2. The chat bug

While wiring up premium, I found the actual reason chat was likely
failing: `lab.html` calls a function `enableOfflineChat(...)` in five
places as its error-fallback path, but that function was never
defined anywhere in the file. Any Supabase error (wrong keys, missing
tables, RLS blocking a query, project paused, etc.) would throw
`enableOfflineChat is not defined` instead of falling back — so a
single misconfigured table could take the whole chat down with no
usable error state. I added the missing function; now any Supabase
failure degrades to a local, per-browser offline chat instead of
breaking, exactly like the `chatForm` submit handler already expected.

Also double-check your **existing** Supabase project has these exact
columns, since the code reads/writes them by name:
- `chat_channels.icon` (used for the icon shown in the channel list)
- `chat_messages.message` (the message body column — not `body`/`text`)
- `chat_messages.avatar_seed`

If your project is missing any of the above, or you're starting fresh,
run `supabase-schema.sql` (in this folder) in the Supabase SQL editor —
it's written with `if not exists` / `add column if not exists`, so
it's safe to run against your existing project without dropping data.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Where to get it | Used by |
|---|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL | `/api/admin/set-premium` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key (**secret**, never put this in client code) | `/api/admin/set-premium` |
| `ADMIN_SECRET` | Any long random string you generate yourself | `/api/admin/set-premium`, `admin.html` |

The chat's client-side key in `lab.html` (`sb_publishable_...`) is
Supabase's public/anon key — that one is meant to be visible in the
browser and doesn't need to be an env var.

## 4. Granting premium

Open `/admin.html` on your deployed site, enter your `ADMIN_SECRET`,
look a user up by their chat username (e.g. `Helix-4821`) or by the
email they signed up with, and toggle premium on/off. That flips
`chat_profiles.is_premium`, which:
- shows a ✦ PREMIUM badge next to their name in chat and the online list
- unlocks the `vip-lounge` channel (enforced by Postgres RLS, not just
  the UI — a non-premium user genuinely cannot read/write it)

You can call the same endpoint from anywhere else you like later (a
Discord bot on role-assign, a cron job, etc.) — it's just:

```bash
curl -X POST https://your-site.vercel.app/api/admin/set-premium \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"username": "Helix-4821", "premium": true}'
```

## 5. Accounts

`lab.html` now supports real email/password accounts (Supabase Auth)
in addition to the existing anonymous guest chat — the "Sign in" /
"Create account" panel is in the chat sidebar. Guests still work
exactly as before with no sign-up required.

## 6. Deploying

1. Push this repo to GitHub.
2. In Vercel: **Add New Project** → import the repo → framework preset
   "Other" (no build step needed).
3. Add the three environment variables above.
4. Deploy. `index.html`, `games.html`, `about.html`, `lab.html`, and
   `admin.html` are served as static files; `/api/admin/set-premium`
   deploys as a serverless function automatically.

**If `npm install` fails on Vercel:** the repo's `dependencies` still
include the local-only proxy stack (`fastify`, `@mercuryworkshop/*`)
for `npm start` / `start.bat` local development. Vercel doesn't need
those for anything it actually serves, but it will still try to
install them. If one fails to build in Vercel's environment, the
simplest fix is moving those five packages out of `dependencies` in
`package.json` into a separate `local-dependencies` note (or a
`local/package.json`) and running `npm install` there for local dev
only — say the word if you want me to split it that way.
