# ЭкоТоҷикистон Platform

## Recent Changes

### October 26, 2025 - Search Functionality and Layout Fixes
- **Search Functionality "Ҷустуҷӯ" Added:** All department card pages now include search input field before block sections
  - Added to DepartmentMain.tsx: Search filters all 50 departments by name with real-time results
  - Added to AdminDepartments.tsx: Search filters departments in admin message view
  - Added to MonitoringDashboard.tsx: Search filters departments in public monitoring view
  - Added to AdminDashboard.tsx: Search filters departments in admin management table
  - Search design: Thin line input with Search icon, centered max-width layout
  - Case-insensitive filtering across all department blocks (upper, middle, lower, district)
- **Fixed ComposeMessage Layout:** Removed white empty space below message composition form
  - Removed separate overlay div with `absolute inset-0` that was causing extra space
  - Combined background image and semi-transparent white layer using CSS `linear-gradient`
  - Added `bg-fixed` for elegant parallax effect
  - Form now ends naturally without extra whitespace below buttons

### October 26, 2025 - Calendar Localization and UI Improvements
- **Fixed Tajik Calendar Localization:** Calendar now properly displays months in Tajik (Январ, Феврал, Март, etc.)
  - Implemented full locale object for react-day-picker with Tajik month names and weekday names
  - Calendar header now shows "Октябр 2025" format with Tajik month names
  - Weekdays display as "Яш, Дш, Сш, Чш, Пш, Ҷм, Шб"
  - "Имрӯз" (Today) button available in calendar popover for quick date selection
- **UI Refinements in ComposeMessage:**
  - Removed "рӯз. моҳ. сол" helper text below date picker
  - Added standalone "Имрӯз" button next to date picker field for quick selection of current date
  - Date field now uses flex layout (flex-1) with "Імрӯз" button (shrink-0) to prevent deformation
  - "Ҳамаро қайд кардан" (Select All) button now uses primary styling matching the "Имрӯз" button design
  - Both "Имрӯз" and "Ҳамаро қайд кардан" buttons use variant="default" for consistent primary coloring
  - Fixed DatePicker component to properly sync with external value changes (added useEffect)

### October 26, 2025 - Custom Tajik Calendar Implementation
- **Custom DatePicker Component:** Created fully localized Tajik calendar using react-day-picker library
  - Replaced native browser date input with custom component (client/src/components/ui/date-picker.tsx)
  - Full Tajik localization: months (Январ, Феврал, etc.), weekdays (Яш, Дш, Сш, etc.), and custom buttons
  - Tajik button labels: "Имрӯз" (Today) and "Тоза кардан" (Clear)
  - Date format display: "d. M. yyyy" (рӯз. моҳ. сол) in button and "Октябр 2025" format in calendar header
  - Integrated into ComposeMessage form with text hint "рӯз. моҳ. сол" below input field (with ml-10 offset)
  - Added custom CSS styles for calendar appearance matching app design
  - Fixed header text alignment: added text-left class to all page headers (department and admin pages) for proper left alignment of titles and subtitles

### October 26, 2025 - Header Alignment and Date Input Placeholder
- **Header Text Alignment:** Changed header text alignment from center to left (items-start) across all pages for logo and title text
  - Applied to all department pages: DepartmentMain, Inbox, ComposeMessage, MessageView, DepartmentMessages
  - Applied to all admin pages: AdminDepartments, AdminDashboard, AdminDepartmentMessages
  - Applied to MonitoringDashboard
- **Date Input Placeholder:** Added "рӯз. моҳ. сол" placeholder to date input field in ComposeMessage form

### October 26, 2025 - UI Refinements and Date Format Update
- **Department Card Layout:** Modified text display to show first word on first line, remaining text on second line (DepartmentCard.tsx)
- **Unread Badge Positioning:** Moved unread message count badges to top-right corner of department cards using absolute positioning with shadow effect
- **Select All Recipients:** Added "Ҳамаро қайд кардан" (Select All) button in message compose form for recipient selection with toggle functionality
- **Date Format Change:** Updated date format from dd.MM.yyyy to d. M. yyyy (рӯз. моҳ. сол) across all pages (Inbox.tsx, MessageView.tsx)
  - Example: "26. 10. 2025" instead of "26.10.2025"
- **Login Page Subtitle:** Added "Портали рақамии Кумитаи ҳифзи муҳити зист" subtitle below main title on both department and admin login pages
- **Header Text Update:** Changed header text from "ЭкоТоҷикистон" to "Портали электронӣ" across all pages
- **Language Switcher Removal:** Completely removed LanguageSwitcher component from all pages for single-language operation

### October 26, 2025 - UI Improvements: Block Labels and Message Layout
- **Fixed Message View Layout:** Content/comment now displays immediately after executor field instead of after attachments (MessageView.tsx)
- **Added Block Headers:** All three department views now show block titles before each department group:
  - AdminDepartments.tsx: Added block headers and visual separators for all 4 blocks
  - MonitoringDashboard.tsx: Already had block headers (verified)
  - DepartmentMain.tsx: Already had block headers (verified)
- **District Block Integration:** Ensured "Ноҳияҳои тобеи марказ" block appears with proper heading and visual separator on all pages

### October 26, 2025 - Added District Block with 13 New Departments
- **New Department Block:** Added "Ноҳияҳои тобеи марказ" (Districts Under Central Administration) as the fourth hierarchical block
- **13 New Departments Added:** 
  - Шуъбаи КҲМЗ дар ноҳияи Варзоб (DISTRICT038)
  - Шуъбаи КҲМЗ дар ноҳияи Рудакӣ (DISTRICT039)
  - Шуъбаи КҲМЗ дар шаҳри Ҳисор (DISTRICT040)
  - Шуъбаи КҲМЗ дар ноҳияи Шаҳринав (DISTRICT041)
  - Шуъбаи КҲМЗ дар шаҳри Турсунзода (DISTRICT042)
  - Шуъбаи КҲМЗ дар шаҳри Ваҳдат (DISTRICT043)
  - Шуъбаи КҲМЗ дар ноҳияи Файзобод (DISTRICT044)
  - Шуъбаи КҲМЗ дар ноҳияи Рашт (DISTRICT045)
  - Бахши КҲМЗ дар шаҳри Роғун (DISTRICT046)
  - Бахши КҲМЗ дар ноҳичи Лахш (DISTRICT047)
  - Бахши КҲМЗ дар ноҳияи Сангвор (DISTRICT048)
  - Бахши КҲМЗ дар ноҳияи Нуробод (DISTRICT049)
  - Бахши КҲМЗ дар ноҳияи Тоҷикобод (DISTRICT050)
- **Updated Components:** Modified AdminDashboard.tsx to support district block selection and display, updated translations in i18n.ts
- **Database Seed:** Updated server/seed.ts to automatically create all 50 departments (37 original + 13 new) on deployment
- **Total Departments:** System now manages 50 departments across 4 blocks

## Overview

ЭкоТоҷикистон is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental/organizational departments in Tajikistan. It centralizes the exchange of official messages and documents, prioritizing security, data persistence, and future mobile compatibility via an API-first architecture. The system grants department-level access using unique codes, while administrators manage the platform through a separate panel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, TanStack Query for server state management, Tailwind CSS with shadcn/ui and Radix UI for components.

**Design System:** Material Design adapted for government use, minimalistic with green accents (HSL: 142 76% 36%), light mode primary with dark mode support, Inter/Roboto fonts for Cyrillic, high contrast ratios, and a bilingual interface (Tajik default, Russian secondary). Authentication pages feature adaptive backgrounds: eco-themed imagery with green leaves and globe on mobile devices (`eco-mobile-bg.png`), and circular eco icons layout on desktop (`eco-bg-wide.png`). All department pages include consistent green gradient headers with ЭкоТоҷикистон logo.

**Key Design Decisions:** API-first approach (frontend solely displays backend responses), component-based architecture using shadcn/ui, separation of concerns, and session-based authentication with protected routes. Public monitoring dashboard (`/monitoring`) accessible from login page provides real-time view of all 50 departments with unread message counts, grouped by facility blocks (Upper/Болой, Middle/Миёнаги, Lower/Поинтар, District/Ноҳияҳои тобеи марказ). Admin panel includes full department management with edit dialog allowing manual changes to department name, block assignment, and access codes.

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, RESTful API design, session-based authentication with express-session and PostgreSQL session store, and Bcrypt for password hashing.

**API Structure:** Endpoints for authentication, department management, message CRUD (with inbox/outbox filtering), and file attachment handling.

**Authentication Model:** Supports two user types (Department via access code, Admin via username/password), uses session-based authentication with httpOnly cookies, role-based access control (`requireAuth`, `requireAdmin`), and 30-day session expiration.

**Data Layer:** Features a storage abstraction interface (IStorage) with a Drizzle ORM implementation (DbStorage) for type-safe PostgreSQL operations and Zod for schema validation.

### Data Storage

**Database:** PostgreSQL with connection pooling via standard `pg` driver.

**Schema Design:** Includes `Departments` (name, block ['upper', 'middle', 'lower', 'district'], access code), `Admins` (hashed passwords), `Messages` (subject, content, sender, recipient, read status, timestamps, executor, document date), `Attachments` (binary file data stored in bytea, filename, file size, MIME type), and `Sessions` tables.

**Department Blocks:** The system organizes departments into four hierarchical blocks:
- **Upper Block** (Кумитаи ҳифзи муҳити зист): 10 departments - Central office and regional administrations
- **Middle Block** (Раёсатҳо): 11 departments - Management divisions and operational departments
- **Lower Block** (Муссисаҳои тиҷоратӣ, ғайритиҷоратӣ ва Марказҳо): 16 departments - Commercial/non-commercial institutions and centers
- **District Block** (Ноҳияҳои тобеи марказ): 13 departments - District branches in centrally-subordinated regions (Varzob, Rudaki, Hisor, Shahrinav, Tursunzoda, Vahdat, Fayzobod, Rasht, Roghun, Lakhsh, Sangvor, Nurobod, Tojikobod)

**Migration Management:** Drizzle Kit for schema migrations, with schema defined in `/shared/schema.ts`.

### File Storage

**Architecture:** Files stored directly in PostgreSQL database using bytea (binary data) column type. Supports up to 5 attachments per message (maxFiles: 5, maxSizeMB: 100 per file).

**Upload Flow:** Client-side uploads via multipart/form-data to POST /api/messages/:id/attachments endpoint. ObjectUploader component manages multiple file uploads with progress tracking and automatic list refresh after upload completion. Filenames with Cyrillic/UTF-8 characters are properly decoded using percent-decoding with fallback to latin1→UTF-8 conversion.

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