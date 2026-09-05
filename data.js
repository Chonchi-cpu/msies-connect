/* ============================================================
   data.js - seed data + localStorage persistence helpers.
   Loaded on every page before any page-specific script.
   ============================================================ */

const DEFAULT_USERS = [
  { email: 'admin1@email.com', password: 'admin123', name: 'Admin SC', role: 'admin' },
  { email: 'j.torres@msies.edu.ph', password: 'teacher123', name: 'Mrs. Torres', role: 'teacher' },
  { email: 'maria.reyes@email.com', password: 'parent123', name: 'Maria Reyes', role: 'parent' }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    category: 'Events',
    title: 'PTA General Assembly',
    date: '2026-08-30',
    time: '08:00',
    location: 'School covered court',
    details:
      "All parents and guardians are invited to the first PTA General Assembly of the school year. We'll cover the school calendar, canteen guidelines, and open the floor for questions.",
    comments: [
      { author: 'Maria Reyes', text: 'Is this the same venue as last year, the covered court?' },
      { author: 'Mrs. Torres (Grade 3 Adviser)', text: 'Yes, same venue. Doors open 7:30 AM.' }
    ]
  },
  {
    id: 2,
    category: 'Holidays',
    title: 'National Heroes Day — No classes',
    date: '2026-08-31',
    time: '',
    location: '',
    details:
      'Classes are suspended on Monday, August 31 in observance of National Heroes Day. Regular classes resume Tuesday, September 1.',
    comments: []
  },
  {
    id: 3,
    category: 'Reminders',
    title: 'Submit Form 137 copies',
    date: '2026-09-04',
    time: '',
    location: "Registrar's office",
    details:
      "Parents of graduating Grade 6 students are reminded to submit Form 137 copies at the registrar's office on or before the deadline.",
    comments: []
  }
];

const DEFAULT_CHATROOMS = [
  {
    id: 'g3',
    name: 'Grade 3 — Parents & Teachers',
    members: 24,
    messages: [
      { author: 'Mrs. Torres', text: 'Good morning! Just a reminder that the PTA assembly is this Saturday.' },
      { author: 'Me', text: 'Thank you po! What time should we arrive?' },
      { author: 'Mrs. Torres', text: 'Doors open 7:30 AM, program starts 8:00 sharp.' }
    ]
  },
  {
    id: 'g4',
    name: 'Grade 4 — Parents & Teachers',
    members: 26,
    messages: [
      { author: 'Mrs. Torres', text: 'Good morning! Please remind your kids to bring their permission slips on Monday.' },
      { author: 'Me', text: 'Noted, thank you po!' },
      { author: 'Mrs. Torres', text: 'See you all Saturday!' }
    ]
  },
  {
    id: 'pta',
    name: 'PTA Officers',
    members: 8,
    messages: [
      { author: 'Mrs. Torres', text: 'The budget review meeting has been moved to next Tuesday.' },
      { author: 'Me', text: "Got it, I'll update the officers' group." },
      { author: 'Mrs. Torres', text: 'Budget review moved to Sept 8, 4:00 PM.' }
    ]
  },
  {
    id: 'admin',
    name: 'School Admin Broadcast',
    members: 412,
    adminOnly: true,
    messages: [
      { author: 'School Admin', text: "Reminder: Submit Form 137 copies to the registrar's office on or before Sept 4." },
      { author: 'School Admin', text: 'This message was sent to all parents and guardians.' }
    ]
  }
];

const STORAGE_KEYS = {
  users: 'msies_users',
  announcements: 'msies_announcements',
  chatRooms: 'msies_chatrooms',
  nextId: 'msies_next_announcement_id',
  currentUser: 'msies_current_user'
};

function initData() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.announcements)) {
    localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.nextId, '4');
  }
  if (!localStorage.getItem(STORAGE_KEYS.chatRooms)) {
    localStorage.setItem(STORAGE_KEYS.chatRooms, JSON.stringify(DEFAULT_CHATROOMS));
  }
}
initData();

/* ---- Users ---- */
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

/* ---- Current session ---- */
function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
  return raw ? JSON.parse(raw) : null;
}
function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}
function isStaff() {
  const u = getCurrentUser();
  return !!u && (u.role === 'admin' || u.role === 'teacher');
}

/* ---- Announcements ---- */
function getAnnouncements() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements));
}
function saveAnnouncements(list) {
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(list));
}
function addAnnouncement(data) {
  const list = getAnnouncements();
  let nextId = parseInt(localStorage.getItem(STORAGE_KEYS.nextId), 10) || (list.length + 1);
  const newItem = { id: nextId, comments: [], ...data };
  list.push(newItem);
  saveAnnouncements(list);
  localStorage.setItem(STORAGE_KEYS.nextId, String(nextId + 1));
  return newItem;
}
function updateAnnouncement(id, data) {
  const list = getAnnouncements().map((a) => (a.id === id ? { ...a, ...data } : a));
  saveAnnouncements(list);
}
function deleteAnnouncement(id) {
  const list = getAnnouncements().filter((a) => a.id !== id);
  saveAnnouncements(list);
}
function addComment(id, text) {
  const user = getCurrentUser();
  const list = getAnnouncements().map((a) => {
    if (a.id !== id) return a;
    return { ...a, comments: [...a.comments, { author: user ? user.name : 'Guest', text }] };
  });
  saveAnnouncements(list);
}

/* ---- Chat rooms ---- */
function getChatRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.chatRooms));
}
function saveChatRooms(rooms) {
  localStorage.setItem(STORAGE_KEYS.chatRooms, JSON.stringify(rooms));
}
function sendChatMessage(roomId, text) {
  const rooms = getChatRooms().map((r) =>
    r.id === roomId ? { ...r, messages: [...r.messages, { author: 'Me', text }] } : r
  );
  saveChatRooms(rooms);
}

/* ---- Helpers ---- */
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/* Redirect helper for pages that require login */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login-choice.html';
  }
}
