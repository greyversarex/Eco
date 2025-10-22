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

**Architecture:** S3-compatible cloud storage (Google Cloud Storage) where files are stored, with file metadata (URL, filename) stored in database. Supports up to 5 attachments per message (maxFiles: 5, maxSizeMB: 100 per file).

**Upload Flow:** Client-side uploads utilize presigned URLs with progress tracking. ObjectUploader component manages multiple file uploads with useEffect-based state synchronization.

**Download Flow:** Secure downloads via POST /api/objects/download endpoint with ACL checks based on message authorization. Backend verifies file belongs to message and user has access before providing signed download URL.

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
- Neon Database (PostgreSQL hosting)
- Google Fonts (Inter and Roboto)
- Google Cloud Storage (for object storage of files)

### Environment Variables

**Required:** `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, `PRIVATE_OBJECT_DIR`.