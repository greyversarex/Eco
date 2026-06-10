---
name: Attachment linking flow
description: How message attachments are linked, the two send paths, and a known orphan-ownership (IDOR) limitation.
---

# Attachment linking in EcoDoc messages

Files are uploaded standalone first (`POST /api/attachments/upload`, `message_id = NULL`),
then linked to a message. There are two send paths and BOTH must link server-side:

- **Single recipient** → `POST /api/messages`. Reads `attachmentIds` from `req.body`
  *separately*, because `insertMessageSchema.parse(req.body)` strips unknown keys.
- **Broadcast (>1 recipient)** → `POST /api/messages/broadcast` (already linked server-side).

**Rule:** never link attachments from the client with separate follow-up `fetch()` calls.
**Why:** if a follow-up link request is lost (network/session/navigation after the success
toast), the attachment stays orphaned (`message_id = NULL`) and the recipient never sees it.
This was the original "recipient can't see attachments" bug for single-recipient sends.

**How to apply:** link inside the same request that creates the message, using
`storage.linkUnlinkedAttachmentToMessage(id, messageId)` which updates only
`WHERE id = ? AND message_id IS NULL`.

## Known limitation — orphan attachment ownership (IDOR)
Standalone uploads carry NO uploader ownership (no `uploaded_by`). Any authenticated
department could claim another's orphan attachment by passing its id in `attachmentIds`
during the short window before it is linked. The `message_id IS NULL` guard narrows but
does not close this. Proper fix needs ownership binding (schema column or session-scoped
upload tracking) enforced at link time across all three link paths — deferred pending
user sign-off (production-critical, internal 37-dept tool, low practical risk).
