# LinkedIn MCP, for your laptop only

`.mcp.json` at the repo root is configured and ready. It does nothing until you
run the login step on a real machine, and no credential of yours passes through
me at any point.

Source: https://github.com/stickerdaniel/linkedin-mcp-server

## Read this first

The project's own README says:

> LinkedIn's User Agreement prohibits automated access, and accounts using
> automated tools can be restricted or banned. Use at your own risk; there is no
> guarantee of account safety.

It is not an API. It drives your real, logged-in LinkedIn session with a browser
it controls. That is why it belongs on your laptop and not in a cloud container,
and why the decision is yours rather than mine.

Weigh it against what your LinkedIn is currently carrying: live outreach to
Gaurav and Rashi, the only working route to Vineet, and every good lead in the
pipeline so far came from your feed. A restriction would cost the best channel
you have at the worst moment.

**Go slowly.** A handful of actions a day, spaced out, looks like a person. Fifty
connection requests in an hour does not.

## Setup, on your laptop

1. Install `uv`: https://docs.astral.sh/uv/getting-started/installation/
2. Open Claude Code in this repo. It will pick up `.mcp.json` and ask you to
   approve the server. Approve it.
3. Authenticate. Either works:

```bash
# Opens a browser window, you log in normally
uvx mcp-server-linkedin@latest --login

# Or reuse the session already live in your everyday browser
uvx mcp-server-linkedin@latest --import-from-browser
```

The session is saved to `~/.linkedin-mcp/profile/` on your machine. It never
comes near this repo, and it never comes near me.

**One thing to decide:** the config pins `@latest`, which means the server
auto-updates. Its README specifically asks an AI agent to confirm that with you
rather than assume it, so I am asking. Auto-update keeps it working as LinkedIn
changes its pages, at the cost of the code changing under you without notice. Pin
a fixed version instead if you would rather.

## What it would actually change

Two real gaps close.

**Sending.** `connect_with_person` sends a connection request with a note, and
`send_message` messages someone directly. That is the manual paste step for
Gaurav, Vineet and everyone after them.

**Reply detection.** `get_inbox`, `get_conversation` and `search_conversations`
mean replies on LinkedIn get noticed without you telling me. Right now the
follow-up cadence only knows what happens over email, so a reply on LinkedIn
would keep getting nudged. That is the more valuable half.

Also available: `get_person_profile`, `get_company_profile`, `search_companies`,
`search_jobs`, `get_job_details`, `get_saved_jobs`.

## What will not work, and is fine

Cloud sessions like the one this was set up in cannot run it. The container is
wiped, there is no browser to log into, and the network policy blocks it. If you
see the server fail to connect in a web session, that is expected. Everything
else in the job agent keeps working without it.

## If the login window is invisible

Symptom: every tool call returns "A LinkedIn login window is open and login is
still in progress", but there is no window anywhere on screen, and running
`--status` in a terminal says there is no session.

Cause: the server runs **headless by default**. Claude Code launches its own copy
of it, that copy opened a login browser you cannot see, and it is now waiting for
a sign-in that can never happen. Commands you run in a terminal start a *separate*
instance, so they conflict with it rather than fixing it.

Fix: `.mcp.json` now passes `--no-headless`, so the browser Claude Code launches
is visible. Close Claude Code fully, reopen it, and the window will appear on the
first LinkedIn tool call. Sign in there once and the session is saved to
`~/.linkedin-mcp/profile/`.

Once you are signed in you can drop `--no-headless` from `.mcp.json` if you would
rather not see a browser on every call. Leaving it in is also fine, and arguably
better, because you can see what the thing is doing on your account.
