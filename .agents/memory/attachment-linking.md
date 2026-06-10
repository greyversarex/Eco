---
name: Attachment linking flow
description: Durable rules for how message attachments are linked and the orphan-ownership guard.
---

# Attachment linking in EcoDoc messages

Files are uploaded standalone first (orphans with `message_id = NULL`), then linked to a
message. Two send paths (single-recipient and broadcast) BOTH must link server-side.

**Rule:** never link attachments from the client with separate follow-up requests.
**Why:** a lost follow-up link request (network/session/navigation after the success toast)
leaves the attachment orphaned and invisible to the recipient — this was the original
"recipient can't see attachments" bug on single-recipient sends.
**How to apply:** link inside the same request that creates the message, guarded by
`message_id IS NULL` so a file is never re-linked/stolen from another message. Note:
`insertMessageSchema.parse(req.body)` strips unknown keys, so read `attachmentIds` from
`req.body` separately.

## Orphan ownership guard (IDOR closed)
Standalone uploads record the uploader's department; linking requires the orphan to belong
to the linking department (legacy NULL-owner rows and admin uploads are allowed through for
non-breaking rollout). This stops one department from claiming another's in-flight upload.
**Why the NULL allowance:** keeps pre-existing orphans and admin uploads working; residual
gap is far smaller than the original IDOR and is deliberate. Tightening it later (admin-only
for NULL-owner) + an orphan TTL cleanup are reasonable future steps.
