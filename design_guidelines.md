# ToolLedger Design Guidelines
**Equipment Borrowing Management System - Holy Cross of Davao College**

## Design Approach
**Selected System**: Material Design 3 with institutional refinements
**Rationale**: Utility-focused application requiring clear hierarchy, form efficiency, and data presentation. Material Design provides excellent patterns for admin dashboards, form validation, and data tables while maintaining professional credibility for an educational institution.

## Typography System
- **Primary Font**: Inter (via Google Fonts CDN)
- **Headings**: 
  - H1: 2.5rem (40px), font-semibold - Page titles
  - H2: 1.875rem (30px), font-semibold - Section headers
  - H3: 1.5rem (24px), font-medium - Card titles, modal headers
- **Body**: 
  - Base: 1rem (16px), font-normal - Form labels, body text
  - Small: 0.875rem (14px) - Helper text, metadata
- **Buttons/CTAs**: 0.9375rem (15px), font-medium, uppercase tracking

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-6 (cards, modals)
- Section spacing: py-8 or py-12
- Form field gaps: gap-4 or gap-6
- Button padding: px-6 py-2 or px-8 py-3

**Grid Structure**:
- Desktop: 12-column grid with max-w-7xl container
- Forms: Single column max-w-2xl for optimal readability
- Admin tables: Full width with horizontal scroll on mobile
- Dashboard cards: 3-column grid (lg:grid-cols-3 md:grid-cols-2)

## Component Library

### Authentication Pages (Login)
- Centered card layout (max-w-md) on clean background
- Institution logo at top (80-100px height)
- Clear form structure with outlined inputs
- Primary action button (full width)
- Subtle footer with institution name

### Student Dashboard
- Top navigation bar with logo, student name, logout
- Hero section with welcome message and quick stats
- **Hero Image**: Use institutional imagery (library, equipment room, or campus) with overlay gradient for text readability
- Borrowing form card prominently displayed
- Recent requests section (simple list, 3-5 items max)

### Admin Dashboard
- Sidebar navigation (240px width) with:
  - Overview, Requests, Inventory, Reports, Settings
  - Active state with left border accent
- Main content area with:
  - Stats cards row (3-4 metrics: pending requests, active borrows, total items, overdue)
  - Data table for pending requests (striped rows, action buttons)
  - Quick actions panel

### Forms
- Outlined input fields with floating labels
- Clear field validation (red border + helper text for errors, green checkmark for success)
- Dropdown selects with search capability for equipment
- Date/time pickers with calendar UI
- Submit buttons with loading states (spinner + disabled state)

### Data Tables (Admin)
- Sticky header row
- Alternating row colors (white/gray-50)
- Action column with icon buttons (approve, decline, view details)
- Status badges (pending: yellow, approved: green, declined: red, returned: blue)
- Pagination at bottom (10, 25, 50 items per page)

### Cards
- White background with subtle shadow (shadow-sm)
- Rounded corners (rounded-lg)
- Header with title and optional action button
- Content with consistent padding (p-6)

### Modals/Dialogs
- Centered overlay with backdrop (bg-black/50)
- White card with header, content, footer sections
- Close button (X) in top-right
- Action buttons aligned right in footer

### Notifications/Toasts
- Fixed position top-right
- Color-coded by type (success: green, error: red, info: blue)
- Auto-dismiss after 5 seconds
- Icon + message + close button

### Status Indicators
- Pill-shaped badges with background colors:
  - Pending: bg-yellow-100 text-yellow-800
  - Approved: bg-green-100 text-green-800
  - Declined: bg-red-100 text-red-800
  - Returned: bg-blue-100 text-blue-800
  - Overdue: bg-red-100 text-red-800 with pulse animation

## Images
**Hero Image** (Student Dashboard):
- Location: Full-width banner below navigation, 400px height
- Content: Bright, professional photo of Holy Cross of Davao College equipment room, library, or campus building
- Treatment: Subtle gradient overlay (dark at bottom) for text legibility
- Text overlay: Welcome message, student name, current borrowing stats on blurred background buttons

**Institution Logo**:
- Location: Navigation bar (left), login page (centered top)
- Format: SVG or high-res PNG with transparent background
- Size: 48px height in nav, 100px on login

**Empty States**:
- Illustrations for "No requests yet", "No items available" 
- Simple line illustrations or icons (Heroicons)

## Navigation Patterns
**Student**: Horizontal top bar with logo, "Dashboard", user menu (dropdown)
**Admin**: Persistent left sidebar + top bar with search, notifications bell, admin profile

## Accessibility Requirements
- WCAG AA contrast ratios throughout
- Focus states on all interactive elements (ring-2 ring-blue-500)
- Keyboard navigation support for forms and tables
- Screen reader labels for icon buttons
- Form validation with clear error messaging

This design balances institutional professionalism with modern web application patterns, prioritizing usability and clarity for both student and administrative workflows.