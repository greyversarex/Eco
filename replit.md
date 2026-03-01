# EcoDoc Project Information

## Project Overview
EcoDoc is a critical document management and assignment tracking system for environmental protection departments. It is currently being improved in this Replit environment before being deployed to production on Timeweb. Every task must be performed with maximum quality and responsibility as this is a high-stakes production project.

## Core Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, TanStack Query, Wouter.
- **Backend**: Node.js, Express, Drizzle ORM, PostgreSQL.
- **Mobile**: Capacitor (Android/iOS).
- **Other**: Push Notifications (web-push), Document Editing (OnlyOffice/Tiptap), i18n (Tajik/Russian).

## Key Instructions & Standards
- **Responsibility**: Absolute accuracy and full implementation for every task. No placeholders or half-measures.
- **Database Management**: 
  - Use `npm run db:push --force` for schema synchronization.
  - **CRITICAL**: Never change primary key ID column types (e.g., serial ↔ varchar).
- **Initialization**: 
  - Admin: `admin` / `admin123`
  - Seed data: `npm run db:seed` (Initializes 120+ departments and core staff).
  - Migration: `npm run db:migrate` (Runs `safe-migrate.ts` for structural integrity).
- **Deployment Flow**: Improvements in Replit -> Sync with Repository -> Deploy to Timeweb production.

## Project Structure
- `client/`: Frontend React application.
- `server/`: Express backend and storage logic.
- `shared/`: Shared Zod schemas and Drizzle table definitions.
- `migrations/`: Database migration files.

## Functional Roles
- **Admin**: Complete oversight of departments, document types, and system users.
- **Departments**: Interaction-based roles handling messaging, assignments, and announcements based on granular permissions.
