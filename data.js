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
  directThreads: 'msies_direct_threads',
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
  if (!localStorage.getItem(STORAGE_KEYS.directThreads)) {
    localStorage.setItem(STORAGE_KEYS.directThreads, JSON.stringify([]));
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
function updateCurrentUser(data) {
  const current = getCurrentUser();
  if (!current) return;
  const updated = { ...current, ...data };
  const users = getUsers().map((u) => (u.email === current.email ? { ...u, ...data } : u));
  saveUsers(users);
  setCurrentUser(updated);
  return updated;
}
function getUserByEmail(email) {
  if (!email) return null;
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}
/* Best-effort name -> user lookup. Chat messages and comments only
   ever stored the display name someone typed/was seeded with, never
   an email, so this is how the profile-modal name links (see
   components/profileModal.js) find the matching account. Returns
   null on no exact match (e.g. seed placeholders like "Me" or
   "School Admin", or a name with an added suffix) so callers can
   fall back to plain, non-clickable text instead of guessing. */
function getUserByName(name) {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  return getUsers().find((u) => u.name.trim().toLowerCase() === clean) || null;
}
/* Directory search used by the navbar search bar. Excludes the
   current user (you already have your own Profile page) and caps
   results so the dropdown stays short. */
function searchUsers(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const current = getCurrentUser();
  return getUsers()
    .filter((u) => !current || u.email.toLowerCase() !== current.email.toLowerCase())
    .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .slice(0, 8);
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
  const user = getCurrentUser();
  const author = user ? user.name : 'Me';
  const rooms = getChatRooms().map((r) =>
    r.id === roomId ? { ...r, messages: [...r.messages, { author, text }] } : r
  );
  saveChatRooms(rooms);
}

/* ---- Direct (1:1) messages ----
   Stored separately from chat rooms. A thread's id is derived
   deterministically from the two participants' emails so the same
   pair of users always lands on the same thread, however either
   side navigates there. */
function dmThreadId(emailA, emailB) {
  return 'dm_' + [emailA.toLowerCase(), emailB.toLowerCase()].sort().join('|');
}
function getDirectThreads() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.directThreads) || '[]');
}
function saveDirectThreads(threads) {
  localStorage.setItem(STORAGE_KEYS.directThreads, JSON.stringify(threads));
}
/* Ensures a thread with otherEmail exists for the current user and
   returns it (without sending a message). Used when opening a DM
   from someone's profile before they've typed anything yet. */
function getOrCreateDirectThread(otherEmail) {
  const user = getCurrentUser();
  if (!user || !otherEmail) return null;
  const id = dmThreadId(user.email, otherEmail);
  const threads = getDirectThreads();
  let thread = threads.find((t) => t.id === id);
  if (!thread) {
    thread = { id, participants: [user.email.toLowerCase(), otherEmail.toLowerCase()], messages: [] };
    threads.push(thread);
    saveDirectThreads(threads);
  }
  return thread;
}
function sendDirectMessage(otherEmail, text) {
  const user = getCurrentUser();
  if (!user || !otherEmail) return;
  const id = dmThreadId(user.email, otherEmail);
  const threads = getDirectThreads();
  let thread = threads.find((t) => t.id === id);
  if (!thread) {
    thread = { id, participants: [user.email.toLowerCase(), otherEmail.toLowerCase()], messages: [] };
    threads.push(thread);
  }
  thread.messages.push({ author: user.name, authorEmail: user.email, text });
  saveDirectThreads(threads);
}
/* Returns the current user's DM threads, each annotated with the
   other participant's display name/email so chat.js doesn't need to
   know about the raw participants array. */
function getDirectThreadsForCurrentUser() {
  const user = getCurrentUser();
  if (!user) return [];
  const myEmail = user.email.toLowerCase();
  return getDirectThreads()
    .filter((t) => t.participants.includes(myEmail))
    .map((t) => {
      const otherEmail = t.participants.find((e) => e !== myEmail);
      const otherUser = getUserByEmail(otherEmail);
      return {
        id: t.id,
        name: otherUser ? otherUser.name : otherEmail,
        otherEmail,
        messages: t.messages
      };
    });
}

/* ---- Cross-tab live updates ----
   The browser fires a native 'storage' event in every OTHER open tab
   (never the tab that made the change) whenever a localStorage key is
   written. That's exactly the signal we need for near-real-time sync
   across tabs with no backend: a page subscribes to the storage
   key(s) it cares about, and when that key changes elsewhere, its
   callback re-renders from the fresh localStorage state.

   Usage:  onDataChange(STORAGE_KEYS.announcements, () => renderAll());
   Multiple keys: onDataChange([STORAGE_KEYS.chatRooms, STORAGE_KEYS.directThreads], fn);
*/
const dataChangeListeners = {};

function onDataChange(keys, callback) {
  (Array.isArray(keys) ? keys : [keys]).forEach((key) => {
    if (!dataChangeListeners[key]) dataChangeListeners[key] = [];
    dataChangeListeners[key].push(callback);
  });
}

window.addEventListener('storage', (e) => {
  // e.key is null when the whole storage area is cleared (e.g. via
  // localStorage.clear()) rather than a single key changing.
  if (!e.key) return;
  const callbacks = dataChangeListeners[e.key];
  if (callbacks) callbacks.forEach((cb) => cb(e));
});

/* ---- Helpers ---- */
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
/* Shared initials helper for the navbar search dropdown and the
   view-profile page. (chat.js and profile.js each keep their own
   page-local copy of this same logic.) */
function personInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/* Redirect helper for pages that require login. Also keeps this tab
   in sync if the session ends in another tab (e.g. the user logs out
   from their phone/another window) by watching the currentUser key. */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login-choice.html';
    return;
  }
  onDataChange(STORAGE_KEYS.currentUser, (e) => {
    if (!e.newValue) window.location.href = 'login-choice.html';
  });
}
