# ЭкоТоҷикистон Platform

## Overview

ЭкоТоҷикистон is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental/organizational departments in Tajikistan. It centralizes the exchange of official messages and documents, prioritizing security, data persistence, and future mobile compatibility via an API-first architecture. The system grants department-level access using unique codes, while administrators manage the platform through a separate panel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, TanStack Query for server state management, Tailwind CSS with shadcn/ui and Radix UI for components.

**Design System:** Material Design adapted for government use, minimalistic with green accents (HSL: 142 76% 36%), light mode primary with dark mode support, Inter/Roboto fonts for Cyrillic, high contrast ratios, and a bilingual interface (Tajik default, Russian secondary). Authentication pages feature adaptive backgrounds: eco-themed imagery with green leaves and globe on mobile devices (`eco-mobile-bg.png`), and circular eco icons layout on desktop (`eco-bg-wide.png`). All department pages include consistent green gradient headers with ЭкоТоҷикистон logo.

**Key Design Decisions:** API-first approach (frontend solely displays backend responses), component-based architecture using shadcn/ui, separation of concerns, and session-based authentication with protected routes. Public monitoring dashboard (`/monitoring`) accessible from login page provides real-time view of all 37 departments with unread message counts, grouped by facility blocks (Upper/Болой, Middle/Миёнаги, Lower/Поинтар).

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, RESTful API design, session-based authentication with express-session and PostgreSQL session store, and Bcrypt for password hashing.

**API Structure:** Endpoints for authentication, department management, message CRUD (with inbox/outbox filtering), and file attachment handling.

**Authentication Model:** Supports two user types (Department via access code, Admin via username/password), uses session-based authentication with httpOnly cookies, role-based access control (`requireAuth`, `requireAdmin`), and 30-day session expiration.

**Data Layer:** Features a storage abstraction interface (IStorage) with a Drizzle ORM implementation (DbStorage) for type-safe PostgreSQL operations and Zod for schema validation.

### Data Storage

**Database:** PostgreSQL with connection pooling via standard `pg` driver.

**Schema Design:** Includes `Departments` (name, block, access code), `Admins` (hashed passwords), `Messages` (subject, content, sender, recipient, read status, timestamps, executor, document date), `Attachments` (binary file data stored in bytea, filename, file size, MIME type), and `Sessions` tables.

**Migration Management:** Drizzle Kit for schema migrations, with schema defined in `/shared/schema.ts`.

### File Storage

**Architecture:** Files stored directly in PostgreSQL database using bytea (binary data) column type. Supports up to 5 attachments per message (maxFiles: 5, maxSizeMB: 100 per file).

**Upload Flow:** Client-side uploads via multipart/form-data to POST /api/messages/:id/attachments endpoint. ObjectUploader component manages multiple file uploads with progress tracking and automatic list refresh after upload completion.

**Download Flow:** Secure downloads via GET /api/attachments/:id endpoint. Backend verifies user has access to message before serving file binary data with appropriate Content-Type and Content-Disposition headers.

**Benefits:** Fully autonomous deployment (no external services required), transaction integrity (files and messages in same database), simplified backup/restore, and mobile app compatibility (single database connection).

## External Dependencies

### Core Dependencies

**Database:** `pg`, `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
**Authentication & Security:** `bcrypt`, `express-session`.
**Backend Framework:** `express`, `tsx`.
**Frontend Framework:** `react`, `@tanstack/react-query`, `wouter`.
**UI Components:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
**Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.
**Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

### Third-Party Services

**Current:**
- Any standard PostgreSQL server (version 13+)
- Google Fonts (Inter and Roboto)

### Environment Variables

**Required:** `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`.

**Note:** No external service credentials required. System is fully autonomous with only database connection needed.