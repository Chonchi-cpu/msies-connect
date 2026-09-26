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
- CSS3 (single shared stylesheet, `css/style.css`)
- Vanilla JavaScript (ES6+), no frameworks or libraries
- `localStorage` used as the data layer so state (login session, posts, calendar
  events, chat messages, profile edits) persists across page loads/navigation,
  since there is no backend

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
├── view-profile.html          # Read-only view of another user's profile
├── css/
│   └── style.css            # Shared stylesheet
└── js/
    ├── data.js               # Seed data + localStorage helpers (shared "backend")
    ├── components/           # Reusable UI components (plain JS, return/inject HTML)
    │   ├── navbar.js           # Top navigation bar
    │   ├── modal.js            # Generic modal overlay (open/close)
    │   ├── postForm.js         # Shared announcement/event form fields
    │   └── announcementCard.js # Announcement card: badge, meta, comments, staff controls
    └── pages/
        ├── feed.js             # Feed page logic
        ├── calendar.js         # Calendar page logic
        ├── chat.js             # Chat page logic (rooms + direct messages)
        ├── profile.js          # Profile page logic
        └── view-profile.js     # Read-only profile view + "Message" action
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
- **Auth**: staff login, parent/student login, registration, forgot-password
  request flow (client-side only — no real email is sent), and session
  persistence via `localStorage`.
- **Feed**: category filters (All/Events/Holidays/Reminders), an upcoming
  events sidebar, and:
  - Staff-only **New post**, **Edit**, and **Delete** (with confirmation)
    for announcements, via modal forms.
  - **Comments**: anyone logged in can read and add comments on a post.
  - **Photo upload**: staff can attach an optional photo to a post via
    click-to-upload. Images are automatically downscaled and
    compressed client-side (max 1280px, JPEG) before being stored, to
    stay well within `localStorage`'s quota.
- **Calendar**: month grid with prev/next navigation and a badge per dated
  announcement, color-coded by category. Clicking a day shows that day's
  events; staff can add, edit, or delete events from the same modal, reusing
  the same form as the feed's post modal so the two stay in sync (an event
  saved from either page shows up on both).
- **Chat**: multiple rooms seeded with sample threads (grade-level rooms,
  a PTA officers room, and an admin-only broadcast room). Sending is
  disabled for non-staff in the admin broadcast room; all other rooms are
  open to everyone.
- **Profile**: account settings form (name, email, phone, password) for
  every role, plus a notification-preference field for parents, and a
  working log-out button.
- **People search & direct messages**: a search bar in the navbar (visible
  on every page once logged in) looks up other users by name or email as
  you type. Selecting someone opens a read-only view of their public
  profile (name, role, section, email — never their password or other
  private settings), with a **Message** button that opens a 1:1 direct
  message thread with them in Chat. DMs live alongside the existing group
  chat rooms in the Chat sidebar, under a separate "Direct messages"
  heading.

## Known limitations / next steps
- There's no real backend or email service — password reset, chat, and all
  data changes are simulated with `localStorage` and reset if it's cleared.
- No per-child roster is enforced: any parent can currently comment on or
  view any announcement rather than only their child's grade/section.
- No real-time updates between browser tabs/users; chat and feed changes
  only appear after the acting user's own next render.
- Photos are stored as base64 data URLs inside `localStorage` rather than
  uploaded to real file storage, so there's still a practical ceiling on
  how many/how large the images across all posts can get (compression
  keeps each one small, but the browser's total `localStorage` quota,
  typically 5–10MB, still applies site-wide).
