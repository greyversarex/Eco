# Design Guidelines for ЭкоТочикистон Platform

## Design Approach

**Selected Approach:** Design System (Material Design adapted for enterprise government use)

**Justification:** This is a utility-focused internal messaging and document management system requiring clarity, efficiency, and learnability. The user has explicitly requested minimalistic design with specific color constraints, making a systematic approach essential for consistency.

**Key Design Principles:**
- Clarity and simplicity above all visual complexity
- Functional efficiency for daily administrative tasks
- Clear information hierarchy for message management
- Accessibility for government/enterprise users
- Cultural appropriateness for Tajik/Russian bilingual audience

---

## Core Design Elements

### A. Color Palette

**Light Mode (Primary):**
- Background: White (#FFFFFF) and light gray (210 10% 97%)
- Primary Green: 142 76% 36% (for buttons, active states, important indicators)
- Secondary Green: 142 50% 45% (for hover states)
- Text Primary: 220 13% 18% (near black for main content)
- Text Secondary: 220 9% 46% (for metadata, timestamps)
- Border/Divider: 220 13% 91% (subtle separation)
- Success/Read: 142 50% 90% (light green backgrounds)
- Unread Highlight: 142 76% 95% (very light green for unread messages)
- Error/Alert: 0 65% 51% (minimal use, only for critical alerts)

**Dark Mode:**
- Background: 220 13% 11%
- Surface: 220 13% 15%
- Primary Green: 142 76% 45% (adjusted for contrast)
- Text Primary: 210 10% 95%
- Text Secondary: 220 9% 65%
- Border/Divider: 220 13% 20%

**Color Usage Rules:**
- Green is the ONLY accent color - use exclusively for interactive elements, active states, and unread indicators
- No gradients, no multi-colored tags, no additional accent colors
- Maintain high contrast ratios (minimum 4.5:1) for accessibility
- Use subtle gray tones for backgrounds and borders only

### B. Typography

**Font Family:**
- Primary: 'Inter' or 'Roboto' from Google Fonts (excellent Cyrillic support for Russian/Tajik)
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale:**
- Headings: 
  - H1: text-2xl font-semibold (24px, admin panel titles)
  - H2: text-xl font-semibold (20px, section headers)
  - H3: text-lg font-medium (18px, department names)
- Body:
  - Large: text-base (16px, message content)
  - Regular: text-sm (14px, metadata, labels)
  - Small: text-xs (12px, timestamps, secondary info)
- Weight: Regular (400) for body, Medium (500) for labels, Semibold (600) for headings
- Line Height: leading-normal (1.5) for body text, leading-tight (1.25) for headings

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4, p-6
- Section spacing: py-8, py-12, py-16
- Element gaps: gap-2, gap-4, gap-6
- Container margins: mx-4, mx-6, mx-auto

**Grid System:**
- Department list: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 (responsive grouping by blocks)
- Message lists: Single column with full-width rows
- Admin panel: Sidebar + main content (sidebar w-64, main flex-1)
- Max content width: max-w-7xl for main containers

**Container Strategy:**
- Admin panel: Fixed sidebar navigation, scrollable main content area
- Department main screen: Centered container (max-w-6xl) with grouped department cards
- Message views: Full-width container with max-w-4xl for readability
- Forms: max-w-2xl for comfortable input field widths

### D. Component Library

**Navigation:**
- Admin sidebar: Fixed left panel, white background, green text for active items, subtle hover states
- Department header: Top bar with logo, department name, language switcher, logout
- Breadcrumbs: Simple text links with "/" separator, green active state

**Buttons:**
- Primary: Green background (142 76% 36%), white text, rounded-md, px-6 py-2.5, medium font weight
- Secondary: White background, green border (border-2), green text, same padding
- Ghost: Transparent background, green text, hover:bg-gray-50
- Icon buttons: Square (h-10 w-10), subtle gray hover background
- No shadows, no gradients - flat design only

**Cards (Department Cards):**
- White background, subtle border (border border-gray-200)
- Rounded corners (rounded-lg)
- Padding: p-6
- Unread counter: Absolute positioned badge, green background, white text, rounded-full
- Hover state: Very subtle shadow (shadow-sm), no color change
- Grouped by visual blocks with labeled sections

**Message Lists:**
- Row-based layout (not cards for list view)
- Unread: Light green background (142 76% 95%), bold subject text
- Read: White background, regular weight
- Dividers: 1px solid gray-200 between messages
- Compact information display: Subject, sender, date, attachment icon if present

**Forms:**
- Labels: text-sm font-medium, gray-700 color, mb-2
- Inputs: border border-gray-300, rounded-md, px-4 py-2.5, focus:ring-2 focus:ring-green-500
- Textareas: Same styling, min-h-32 for message content
- Dropdowns: Native select styling with custom green focus ring
- File upload: Dashed border area, drag-and-drop zone, green when active
- Required field indicator: Red asterisk (*) next to label

**Tables (Admin):**
- Simple bordered table design
- Header: Light gray background (gray-50), medium font weight
- Rows: Alternating white/gray-50 backgrounds for readability
- Actions column: Icon buttons for edit/delete with confirm dialogs

**Modals/Dialogs:**
- Centered overlay with semi-transparent backdrop (bg-black/50)
- White card with rounded-lg, shadow-xl
- Header with close button (X icon)
- Action buttons at bottom right
- Max width: max-w-2xl

**Indicators:**
- Unread counter: Green circular badge with white number
- Read receipts: Small green checkmark icon
- Status indicators: Simple colored dots (green for active, gray for inactive)
- Loading states: Simple green spinner, no elaborate animations

**Language Switcher:**
- Toggle-style component in header
- "ТҶ" | "RU" labels
- Green background for active language
- Simple transition on switch

**Message Threading:**
- Indented replies (ml-8 or ml-12)
- Vertical line connector on left (border-l-2 border-green-500)
- Each reply in thread shows mini-header (sender, date)
- Collapse/expand for long threads

### E. Animations

**Minimal Animation Strategy:**
- Hover transitions: transition-colors duration-150 (only for interactive elements)
- Modal/dialog appearance: Simple fade-in (opacity transition)
- Dropdown menus: Slide-down with duration-200
- No page transitions, no scroll animations, no decorative motion
- Focus: Simple ring appearance (no animation)

**Explicitly Avoided:**
- Complex hover effects
- Parallax scrolling
- Loading skeletons (use simple spinner)
- Decorative animations
- Auto-playing anything

---

## Images

**No hero images or decorative imagery.** This is a pure utility application.

**Functional Images Only:**
- Department logos/icons: Optional small icons (32x32px) for each department if available
- User avatars: None (department-level access only)
- File type icons: Standard document/PDF/image icons for attachment previews
- Placeholder for missing department icon: Simple green circle with first letter

**Icon Library:** Use Heroicons (outline style) via CDN for consistency
- Common icons needed: envelope, paper-clip, arrow-right, chevron-down, x-mark, check, pencil, trash, language, logout

---

## Accessibility & Responsiveness

- Maintain WCAG 2.1 AA compliance (4.5:1 contrast minimum)
- Keyboard navigation for all interactive elements
- Focus indicators: Green ring (ring-2 ring-green-500)
- Screen reader labels for icon-only buttons
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)
- Mobile: Stack layouts, full-width buttons, touch-friendly targets (min 44px)
- RTL support consideration for potential future languages

---

## Page-Specific Layouts

**Admin Panel (/admin):**
- Fixed left sidebar (w-64) with navigation menu
- Main content area with top bar (breadcrumbs, user info)
- Department management: Table view with inline editing
- Message monitoring: Filterable list with search

**Department Main Screen:**
- Clean header with logo, department name, navigation links, language switcher
- Three clearly labeled sections: "Upper Block", "Middle Block", "Lower Block"
- Grid of department cards within each section
- No dashboard widgets, charts, or statistics

**Inbox/Outbox:**
- List view with filter options (All, Unread, By Department)
- Message row: Bold subject, sender/recipient, date, attachment indicator, unread badge
- Click row to open full message view

**Message View:**
- Full message content with metadata header
- Attached file download button
- Reply button (green, prominent) at bottom
- Thread history below if replies exist

**Compose Message:**
- Vertical form layout
- All fields clearly labeled
- Recipient dropdown with department list
- Large textarea for content
- File attachment zone at bottom
- Green "Send" button, gray "Cancel" button