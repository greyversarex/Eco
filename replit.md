# ЭкоТочикистон Platform

## Overview

ЭкоТочикистон is a secure internal messaging and document management platform designed for governmental/organizational departments in Tajikistan. The system enables departments to exchange official messages and documents in a centralized, controlled environment with bilingual support (Tajik and Russian).

The platform emphasizes security, data persistence, and future mobile compatibility through an API-first architecture. It provides department-level (not individual user) access through unique codes, while administrators manage the system through a separate admin panel.

## Recent Changes

**October 21, 2025 - Messaging System Integration Complete**
- Fixed ComposeMessage.tsx: Replaced mock data with real API integration (/api/departments/list for department list, POST /api/messages for sending)
- Fixed Inbox.tsx: Connected to real API for message display with proper inbox/outbox filtering based on URL
- Fixed shared/schema.ts: Added z.coerce.date() to insertMessageSchema for automatic ISO date string conversion
- Fixed server/routes.ts: Modified GET /api/messages to return unified message array instead of { inbox, outbox } object
- All messaging features now fully functional with real data persistence
- E2E tests passed: Message composition, sending, inbox/outbox display, and department name resolution all working correctly

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite as build tool and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS with shadcn/ui component library
- Radix UI primitives for accessible UI components

**Design System:**
- Material Design adapted for enterprise government use
- Minimalistic design with green as the only accent color (HSL: 142 76% 36%)
- Light mode primary with dark mode support
- Inter/Roboto fonts for excellent Cyrillic support
- High contrast ratios (minimum 4.5:1) for accessibility
- Bilingual interface (Tajik default, Russian secondary)

**Key Design Decisions:**
- API-first: Frontend contains no business logic, only sends requests to backend API and displays responses
- Component-based architecture using shadcn/ui for consistency
- Separation of concerns: pages consume reusable components (DepartmentCard, MessageListItem, LanguageSwitcher)
- Session-based authentication with protected routes

**Rationale:** This architecture ensures the same backend can serve future mobile applications (iOS/Android) without modification. The minimalistic design prioritizes clarity and efficiency for daily administrative tasks.

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js
- TypeScript for type safety
- RESTful API design
- Session-based authentication using express-session with PostgreSQL session store
- Bcrypt for password hashing

**API Structure:**
- Authentication endpoints (`/api/auth/department/login`, `/api/auth/admin/login`, `/api/auth/logout`, `/api/auth/me`)
- Department management endpoints
- Message CRUD endpoints with inbox/outbox filtering
- File attachment handling

**Authentication Model:**
- Two user types: Department (access code only) and Admin (username/password)
- Session-based authentication with httpOnly cookies
- Role-based access control with middleware (`requireAuth`, `requireAdmin`)
- 30-day session expiration

**Data Layer:**
- Storage abstraction interface (IStorage) with database implementation (DbStorage)
- Drizzle ORM for type-safe database operations
- Schema validation using Zod

**Rationale:** RESTful API design ensures complete separation between frontend and backend, enabling future mobile app development. Session-based authentication provides security while maintaining simplicity. The storage abstraction allows for future database migration if needed.

### Data Storage

**Database: PostgreSQL (External Cloud)**
- Provider: Neon Database (@neondatabase/serverless)
- Connection pooling for performance
- WebSocket support for serverless environments

**Schema Design:**

1. **Departments Table:**
   - Stores department information (name, block grouping, access code)
   - Access codes are unique identifiers for department login
   - Block field supports visual grouping (upper/middle/lower)

2. **Admins Table:**
   - Stores admin credentials with bcrypt-hashed passwords
   - Separate from departments for security isolation

3. **Messages Table:**
   - Stores all message metadata (subject, content, sender, recipient)
   - References departments via foreign keys
   - Tracks read status and timestamps
   - Stores file attachment URLs and names (files stored separately)
   - Includes optional executor field for document tracking
   - Document date field for official correspondence

4. **Sessions Table:**
   - Managed by connect-pg-simple for session persistence
   - Auto-created if missing

**Migration Management:**
- Drizzle Kit for schema migrations
- Migrations stored in `/migrations` directory
- Schema defined in `/shared/schema.ts` for sharing between client and server

**Rationale:** External PostgreSQL database ensures 100% data persistence during code updates and server migrations. Neon provides serverless PostgreSQL ideal for Replit deployment. The schema supports both messaging workflow and administrative oversight.

### File Storage

**Planned Architecture:**
- S3-compatible cloud storage (AWS S3, Backblaze B2, or Supabase Storage)
- Database stores only file metadata (URL, filename)
- Actual files stored in cloud storage

**Current Implementation Status:**
- File upload UI implemented in ComposeMessage component
- Backend integration pending
- Storage service configuration needed

**Rationale:** Separating file storage from database ensures scalability, security, and eliminates file size constraints. Cloud storage provides redundancy and global accessibility. This design prevents database bloat and enables efficient file serving.

## External Dependencies

### Core Dependencies

**Database:**
- @neondatabase/serverless: PostgreSQL database provider
- drizzle-orm: Type-safe ORM for database operations
- drizzle-kit: Schema migration management
- connect-pg-simple: PostgreSQL session store for express-session

**Authentication & Security:**
- bcrypt: Password hashing for admin accounts
- express-session: Session management middleware

**Backend Framework:**
- express: Web application framework
- tsx: TypeScript execution for development

**Frontend Framework:**
- react: UI library
- @tanstack/react-query: Server state management
- wouter: Lightweight routing

**UI Components:**
- @radix-ui/*: Accessible component primitives (accordion, dialog, dropdown, select, etc.)
- tailwindcss: Utility-first CSS framework
- class-variance-authority: Component variant styling
- lucide-react: Icon library

**Form Handling:**
- react-hook-form: Form state management
- @hookform/resolvers: Form validation
- zod: Schema validation

**Utilities:**
- date-fns: Date manipulation and formatting
- clsx / tailwind-merge: Conditional CSS class handling

### Third-Party Services

**Required (Not Yet Configured):**
- S3-compatible storage service for file attachments

**Current:**
- Neon Database (PostgreSQL hosting)
- Google Fonts (Inter and Roboto for Cyrillic support)

### Environment Variables

**Required:**
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Secret key for session encryption (production)
- `NODE_ENV`: Environment indicator (development/production)

**Pending Configuration:**
- S3 storage credentials when file upload is implemented