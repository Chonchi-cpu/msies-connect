# MSIES Connect (HTML / CSS / JS)

A frontend prototype for a school announcements, events, and chat platform —
built with plain HTML, CSS, and JavaScript only (no frameworks, no build step).

## Group members
MINOY, JERWIN DE GUIA
OLIVER, EVAN CALALO
PALADIN, JOHN CHRISTIAN
PASCUAL, JHEREMY DAVID
PERALTA, DAVE NORIEL

## Project description
MSIES Connect gives parents, teachers, students, and school admins one place to see
announcements, check the events calendar, and chat in group rooms, instead of relying
on the physical bulletin board. Admins and teachers can publish announcements/events;
parents and students can view them, comment, and chat.

## Technology used
- HTML5 (multi-page site, one .html file per screen)
- CSS3 (single shared stylesheet, `css/style.css`) — custom design system built on
  CSS variables (navy/sage/gold/lavender palette), Playfair Display for headings and
  Inter for body text (Google Fonts), and responsive breakpoints for mobile
- Vanilla JavaScript (ES6+), no frameworks or libraries
- `localStorage` used as the data layer so state (login session, posts, calendar
  events, chat messages, profile edits) persists across page loads/navigation

## Folder structure
```
msies-connect/
├── index.html              # Homepage (recent posts + upcoming events)
├── login-choice.html       # Login role picker
├── login-staff.html        # Staff (admin/teacher) login
├── login-parent.html       # Parent & student login
├── register.html           # Account creation
├── reset-password.html     # Forgot-password request + confirmation
├── feed.html                # Announcements feed
├── calendar.html            # Events calendar
├── chat.html                 # Group chat rooms
├── profile.html               # Account settings
├── css/
│   └── style.css            # Shared stylesheet + design system
└── js/
    ├── data.js               # Seed data + localStorage helpers (shared data layer)
    ├── components/           # Reusable UI components (plain JS, return/inject HTML)
    │   ├── navbar.js           # Top navigation bar
    │   ├── modal.js            # Generic modal overlay (open/close)
    │   ├── postForm.js         # Shared announcement/event form fields (incl. photo upload)
    │   └── announcementCard.js # Announcement card: badge, meta, photo, comments, staff controls
    └── pages/
        ├── feed.js             # Feed page logic
        ├── calendar.js         # Calendar page logic
        ├── chat.js             # Chat page logic
        └── profile.js          # Profile page logic
```

## Setup instructions
No build tools or installation needed.
1. Download/clone the project folder.
2. Serve the folder with any static server (recommended, since some browsers
   restrict `localStorage` on the `file://` protocol):
   ```
   npx serve .
   ```
   or, with Python:
   ```
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

## Demo accounts
| Role    | Email                       | Password    |
|---------|------------------------------|-------------|
| Admin   | admin1@email.com            | admin123    |
| Teacher | j.torres@msies.edu.ph       | teacher123  |
| Parent  | maria.reyes@email.com       | parent123   |

New accounts created via `register.html` (student or parent) are saved to
`localStorage` and can log in through the parent & student login form.

## What's implemented this milestone
- **Visual redesign**: full design system pass matching the approved Figma —
  deep navy for headers/primary actions, sage-mint for Events, warm gold for
  Holidays, soft lavender for Reminders, Playfair Display headings over an
  Inter body font, card shadows, pill-style badges/buttons, and a responsive
  layout down to mobile widths.
- **Auth**: staff login, parent/student login, registration, forgot-password
  request flow (client-side only — no real email is sent), and session
  persistence via `localStorage`. Register and reset-password now show a
  styled confirmation state (icon + message) instead of a plain alert.
- **Feed**: category filters (All/Events/Holidays/Reminders), a two-column
  layout with an upcoming-events sidebar, and:
  - Staff-only **New post**, **Edit**, and **Delete** (with a styled
    confirmation modal) for announcements, via modal forms.
  - **Photo upload**: staff can attach an optional image to a post (read as
    a base64 data URL client-side, no server/storage needed), with a preview
    and a remove-photo option in the form, shown on the card and in the
    calendar's day view.
  - **Comments**: anyone logged in can read and add comments on a post,
    now shown as avatar-initial bubbles rather than plain text lines.
- **Calendar**: month grid with prev/next navigation, a color-legend, a
  highlighted "today" cell, and a badge per dated announcement. Clicking a
  day shows that day's events; staff can add, edit, or delete events
  (with the same confirmation modal as the feed) from the same modal,
  reusing the shared post form so the two stay in sync — an event saved
  from either page shows up on both, photo included.
- **Chat**: multiple rooms seeded with sample threads (grade-level rooms,
  a PTA officers room, and an admin-only broadcast room). Sending is
  disabled for non-staff in the admin broadcast room; all other rooms are
  open to everyone.
- **Profile**: account settings form (name, email, phone, password) for
  every role, plus a notification-preference field for parents, and a
  working log-out button.

## Known limitations / next steps
- There's no real email service — password reset is a simulated client-side
  flow (no email is actually sent), and chat and all data changes are stored
  in `localStorage`, so everything resets if it's cleared.
- Photos are stored as base64 data URLs directly inside `localStorage`.
  Browsers typically cap localStorage around 5–10MB per origin, so a few
  photo-heavy posts could approach that limit.
- No per-child roster is enforced: any parent can currently comment on or
  view any announcement rather than only their child's grade/section.
- No real-time updates between browser tabs/users; chat and feed changes
  only appear after the acting user's own next render.
- User-submitted text (post details, comments, chat messages) is rendered
  without HTML-escaping in a few places, which is acceptable for a
  prototype with trusted demo data but would need sanitizing before any
  real deployment.
