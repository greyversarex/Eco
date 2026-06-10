---
name: Dev server does not hot-reload
description: The Express server must be restarted manually after backend edits; Vite only reloads the frontend.
---

# Server changes require a workflow restart

The `dev` script runs `tsx server/index.ts` WITHOUT `--watch`. Editing any server-side
file (server/*.ts, shared/schema.ts) does NOT reload the running Express process — only
Vite hot-reloads the React frontend.

**Why it bit us:** an end-to-end test of a new backend column "failed" (column written as
NULL) purely because the server was still running pre-edit code. The fix was correct; the
server just hadn't been restarted.

**How to apply:** after ANY backend/schema edit, restart the `Start application` workflow
before testing the server behavior. Do not trust API test results until you've restarted.
