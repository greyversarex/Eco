---
name: Replit package-lock breaks external deploys
description: Replit-generated package-lock.json pins internal registry URLs that fail on non-Replit servers.
---

# package-lock.json from Replit fails npm install on external servers

`npm install` on Replit rewrites every `resolved` URL in package-lock.json to Replit's
internal package firewall: `http://package-firewall.replit.local/npm/...`. These hosts
do NOT resolve outside Replit, so on an external server (e.g. Timeweb prod) `npm install`
fails with `EAI_AGAIN package-firewall.replit.local`. (A separate, misleading symptom on
older npm is `Exit handler never called!` before it even reports the DNS failure.)

**Why:** the committed lock is environment-specific to Replit's network.

**How to apply (deploy fix):** on the external server, do NOT trust the committed lock's
URLs. In deploy.sh: discard any server-regenerated lock (restore it from git) so the pull
is clean, then remove package-lock.json and run
`npm install --registry=https://registry.npmjs.org/` to install from the public registry.
This is self-healing: it works even after a future Replit `npm install` re-pins the URLs.
The server can reach the public npm registry fine (git pull and global npm install both
worked); only the internal Replit URLs are unreachable.
