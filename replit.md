# ЭкоТочикистон Platform

## Overview

ЭкоТочикистон is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental/organizational departments in Tajikistan. It centralizes the exchange of official messages and documents, prioritizing security, data persistence, and future mobile compatibility via an API-first architecture. The system grants department-level access using unique codes, while administrators manage the platform through a separate panel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, TanStack Query for server state management, Tailwind CSS with shadcn/ui and Radix UI for components.

**Design System:** Material Design adapted for government use, minimalistic with green accents (HSL: 142 76% 36%), light mode primary with dark mode support, Inter/Roboto fonts for Cyrillic, high contrast ratios, and a bilingual interface (Tajik default, Russian secondary).

**Key Design Decisions:** API-first approach (frontend solely displays backend responses), component-based architecture using shadcn/ui, separation of concerns, and session-based authentication with protected routes.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, RESTful API design, session-based authentication with express-session and PostgreSQL session store, and Bcrypt for password hashing.

**API Structure:** Endpoints for authentication, department management, message CRUD (with inbox/outbox filtering), and file attachment handling.

**Authentication Model:** Supports two user types (Department via access code, Admin via username/password), uses session-based authentication with httpOnly cookies, role-based access control (`requireAuth`, `requireAdmin`), and 30-day session expiration.

**Data Layer:** Features a storage abstraction interface (IStorage) with a Drizzle ORM implementation (DbStorage) for type-safe PostgreSQL operations and Zod for schema validation.

### Data Storage

**Database:** PostgreSQL (Neon Database for serverless deployment) with connection pooling.

**Schema Design:** Includes `Departments` (name, block, access code), `Admins` (hashed passwords), `Messages` (subject, content, sender, recipient, read status, timestamps, multiple attachment support via jsonb array, legacy single attachment fields, executor, document date), and `Sessions` tables.

**Migration Management:** Drizzle Kit for schema migrations, with schema defined in `/shared/schema.ts`.

### File Storage

**Architecture:** Supabase Storage (S3-compatible) for production deployment. Files stored in cloud bucket, with metadata (URL, filename) in database. Supports up to 5 attachments per message (maxFiles: 5, maxSizeMB: 100 per file).

**Upload Flow:** 
1. Client requests presigned upload URL from backend (POST /api/objects/upload)
2. Backend generates signed URL via Supabase Storage API
3. Client uploads file directly to Supabase using XMLHttpRequest with progress tracking
4. ObjectUploader component manages multiple file uploads with useEffect-based state synchronization

**Download Flow:** 
1. Client requests download (POST /api/objects/download with messageId and fileUrl)
2. Backend verifies user has access to message and file belongs to message
3. Backend generates signed download URL via Supabase Storage API (valid 1 hour)
4. Client fetches file and triggers browser download using Blob API (for CORS compatibility)

**Storage Implementation:**
- **Development (Replit):** Can use Replit Object Storage or Supabase Storage
- **Production (VDS):** Supabase Storage (required for external servers)
- Backend abstraction layer (ObjectStorageService) supports both providers seamlessly

**Security:**
- Files stored in private bucket (not publicly accessible)
- ACL metadata stored with each file (owner, visibility)
- Message-level access control enforced in API routes
- Service role key used server-side (bypasses RLS)

**Backward Compatibility:** Legacy single attachment fields (attachmentUrl, attachmentName) maintained for existing messages. MessageView supports both old and new formats seamlessly.

## External Dependencies

### Core Dependencies

**Database:** `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
**Authentication & Security:** `bcrypt`, `express-session`.
**Backend Framework:** `express`, `tsx`.
**Frontend Framework:** `react`, `@tanstack/react-query`, `wouter`.
**UI Components:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
**Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.
**Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

### Third-Party Services

**Current:**
- Neon Database (PostgreSQL hosting) - serverless PostgreSQL database
- Supabase Storage (File storage) - S3-compatible object storage for production
- Google Fonts (Inter and Roboto) - Cyrillic font support

**Development (Replit):**
- Optionally use Replit Object Storage (Google Cloud Storage wrapper)

### Environment Variables

**Development (Replit):**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption
- `NODE_ENV` - Environment mode (development/production)
- `PRIVATE_OBJECT_DIR` - Replit Object Storage bucket ID (optional if using Supabase)

**Production (VDS Server):**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption  
- `NODE_ENV=production` - Must be set to production
- `PORT` - Server port (default 5000)
- `SUPABASE_URL` - Supabase project URL (https://xxx.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server-side operations
- `SUPABASE_STORAGE_BUCKET` - Storage bucket name (default: ecotajikistan-files)

See `.env.example` for complete configuration template.