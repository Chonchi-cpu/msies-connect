/* chat.js - page logic for chat.html
   Shows the chat rooms/groups the current user belongs to plus
   their 1:1 direct-message threads, the active thread's messages,
   and a send form.*/

requireAuth();
renderNavbar('chat');

let activeRoomId = null;

const ROLE_LABELS_CHAT = { admin: 'Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function initials(name) {
  return personInitials(name);
}

/* ---- Threads ----*/
function loadThreads() {
  const raw = [
    ...getChatRoomsForCurrentUser().map((r) => ({ ...r, type: 'room' })),
    ...getDirectThreadsForCurrentUser().map((d) => ({ ...d, type: 'direct' }))
  ];
  const visible = [];
  const hidden = [];
  raw.forEach((t) => {
    const st = getThreadState(t.id);
    const trimmed = { ...t, messages: t.messages.slice(st.cleared) };
    if (!st.hidden || t.messages.length > st.cleared) visible.push(trimmed);
    else hidden.push(trimmed);
  });
  return { visible, hidden };
}

function getActiveThread() {
  return loadThreads().visible.find((t) => t.id === activeRoomId) || null;
}

function previewText(t) {
  const last = t.messages[t.messages.length - 1];
  if (!last) return 'No messages yet';
  return last.system ? last.text : `${last.author}: ${last.text}`;
}

function roomListItemHtml(t) {
  return `
    <div class="chat-room-item ${t.id === activeRoomId ? 'active' : ''}" onclick="selectRoom('${t.id}')">
      <strong>${t.type === 'direct' ? '@ ' : ''}${esc(t.name)}</strong>
      <small>${esc(previewText(t))}</small>
    </div>
  `;
}

function renderRoomList() {
  const { visible, hidden } = loadThreads();
  const rooms = visible.filter((t) => t.type === 'room');
  const directs = visible.filter((t) => t.type === 'direct');
  if (!visible.some((t) => t.id === activeRoomId)) {
    activeRoomId = (visible[0] && visible[0].id) || null;
  }

  const directsHtml = directs.length
    ? `<p class="chat-dm-label muted">Direct messages</p>${directs.map(roomListItemHtml).join('')}`
    : '';
  const restoreHtml = hidden.length
    ? `<a href="#" class="chat-restore" onclick="restoreDeleted(); return false;">Show ${hidden.length} deleted conversation${hidden.length > 1 ? 's' : ''}</a>`
    : '';

  document.getElementById('chat-rooms').innerHTML = `
    <div class="chat-rooms-head">
      <strong class="chat-rooms-title">Chat rooms</strong>
      <button type="button" class="btn btn-small btn-outline" onclick="openNewGroupModal()">+ New group</button>
    </div>
    ${rooms.map(roomListItemHtml).join('')}
    ${directsHtml}
    ${restoreHtml}
  `;
}

function selectRoom(id) {
  activeRoomId = id;
  renderRoomList();
  renderRoomMain();
}

function refreshChat() {
  renderRoomList();
  renderRoomMain();
}

/* ---- Messages ---- */
function isMyMessage(m) {
  const me = getCurrentUser();
  if (!me) return false;
  if (m.authorEmail) return m.authorEmail.toLowerCase() === me.email.toLowerCase();
  return m.author === 'Me' || m.author === me.name;
}

function messageHtml(m) {
  if (m.system) return `<div class="chat-system">${esc(m.text)}</div>`;
  const mine = isMyMessage(m);
  return `
    <div class="chat-msg ${mine ? 'mine' : 'theirs'}">
      <span class="chat-msg-author">${mine ? 'You' : esc(m.author)}</span>
      <span class="chat-msg-text">${esc(m.text)}</span>
    </div>
  `;
}

/* Admin-only broadcast: only staff manage it. Everything else: any member. */
function canManageRoom(t) {
  return t.type === 'room' && (!t.adminOnly || isStaff());
}

function conversationMenuHtml(t) {
  if (t.type === 'direct') {
    return `
      <a class="chat-menu-item" href="view-profile.html?email=${encodeURIComponent(t.otherEmail)}">View profile</a>
      <button type="button" class="chat-menu-item danger" onclick="openDeleteModal()">Delete conversation</button>
    `;
  }
  const manage = canManageRoom(t);
  return `
    <button type="button" class="chat-menu-item" onclick="openMembersModal()">Members</button>
    ${manage ? '<button type="button" class="chat-menu-item" onclick="openAddMemberModal()">Add member</button>' : ''}
    ${manage ? '<button type="button" class="chat-menu-item" onclick="openRenameModal()">Edit group name</button>' : ''}
    <button type="button" class="chat-menu-item danger" onclick="openDeleteModal()">Delete conversation</button>
  `;
}

function renderRoomMain() {
  const thread = getActiveThread();
  const main = document.getElementById('chat-main');
  if (!thread) {
    main.innerHTML = `
      <p class="muted">No conversation selected.</p>
      <p><button type="button" class="btn btn-small" onclick="openNewGroupModal()">+ New group</button></p>
    `;
    return;
  }

  const isDirect = thread.type === 'direct';
  const canPost = isDirect || !thread.adminOnly || isStaff();
  const count = (thread.memberEmails || []).length;
  const subtitle = isDirect
    ? 'Direct message'
    : `${count} member${count === 1 ? '' : 's'}${thread.adminOnly ? ' · Admin only can post' : ''}`;

  main.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <h3>${isDirect ? '@ ' : ''}${esc(thread.name)}</h3>
        <p class="muted">${subtitle}</p>
      </div>
      <div class="chat-menu-wrap">
        <button type="button" class="chat-menu-btn" id="chat-menu-btn" onclick="toggleChatMenu()" aria-label="Conversation options" aria-haspopup="true" aria-expanded="false">&#8942;</button>
        <div class="chat-menu" id="chat-menu" role="menu">${conversationMenuHtml(thread)}</div>
      </div>
    </div>
    <hr>
    <div class="chat-messages">
      ${thread.messages.length
        ? thread.messages.map(messageHtml).join('')
        : '<p class="chat-empty muted">No messages yet. Say hello!</p>'
      }
    </div>
    ${canPost
      ? `<form class="chat-send-form" onsubmit="return sendMessage(event, '${thread.id}')">
          <input type="text" placeholder="Type a message..." required>
          <button type="submit" class="btn">Send</button>
        </form>`
      : '<p class="muted">Only school admins can post in this room.</p>'
    }
  `;

  const list = main.querySelector('.chat-messages');
  if (list) list.scrollTop = list.scrollHeight;
}

function sendMessage(e, id) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!text) return false;

  const isRoom = getChatRooms().some((r) => r.id === id);
  if (isRoom) {
    sendChatMessage(id, text);
  } else {
    const thread = getDirectThreadsForCurrentUser().find((d) => d.id === id);
    if (thread) sendDirectMessage(thread.otherEmail, text);
  }
  refreshChat();
  return false;
}

/* ---- "⋮" options menu ---- */
function toggleChatMenu(force) {
  const menu = document.getElementById('chat-menu');
  const btn = document.getElementById('chat-menu-btn');
  if (!menu) return;
  const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  if (btn) btn.setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.chat-menu-wrap')) toggleChatMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleChatMenu(false);
});

/* ---- Modal helpers ---- */
function modalHeader(title) {
  return `
    <div class="modal-header">
      <h2>${esc(title)}</h2>
      <button type="button" class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
    </div>
  `;
}

/* A searchable checklist of people. `exclude` = emails to leave out. */
function pickListHtml(exclude) {
  const skip = exclude.map((e) => e.toLowerCase());
  const people = getUsers()
    .filter((u) => !skip.includes(u.email.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!people.length) return '<p class="muted">Everyone is already in this group.</p>';
  return `
    <input type="text" class="pick-search" placeholder="Search people..." oninput="filterPickList(this.value)" autocomplete="off">
    <div class="pick-list" id="pick-list" onchange="hideFormError()">
      ${people.map((u) => `
        <label class="pick-row" data-search="${esc((u.name + ' ' + u.email).toLowerCase())}">
          <input type="checkbox" value="${esc(u.email)}">
          <span class="avatar">${esc(initials(u.name))}</span>
          <span class="pick-text"><strong>${esc(u.name)}</strong><small>${esc(ROLE_LABELS_CHAT[u.role] || u.role)}${u.section ? ' · ' + esc(u.section) : ''}</small></span>
        </label>
      `).join('')}
    </div>
  `;
}

function filterPickList(q) {
  const term = q.trim().toLowerCase();
  document.querySelectorAll('#pick-list .pick-row').forEach((row) => {
    row.style.display = !term || row.dataset.search.includes(term) ? '' : 'none';
  });
}

function checkedEmails() {
  return Array.from(document.querySelectorAll('#pick-list input[type="checkbox"]:checked')).map((c) => c.value);
}

function hideFormError() {
  const el = document.getElementById('form-error');
  if (el) el.style.display = 'none';
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

/* ---- Members ---- */
function openMembersModal() {
  toggleChatMenu(false);
  const room = getActiveThread();
  if (!room || room.type !== 'room') return;
  const me = getCurrentUser();
  const people = (room.memberEmails || []).map(getUserByEmail).filter(Boolean);

  const rows = people.map((u) => {
    const isMe = u.email.toLowerCase() === me.email.toLowerCase();
    const href = isMe ? 'profile.html' : `view-profile.html?email=${encodeURIComponent(u.email)}`;
    return `
      <a class="member-row" href="${href}">
        <span class="avatar">${esc(initials(u.name))}</span>
        <span class="pick-text"><strong>${esc(u.name)}${isMe ? ' (You)' : ''}</strong><small>${esc(ROLE_LABELS_CHAT[u.role] || u.role)}${u.section ? ' · ' + esc(u.section) : ''}</small></span>
      </a>
    `;
  }).join('');

  openModal(`
    ${modalHeader(`Members (${people.length})`)}
    <div class="member-list">${rows || '<p class="muted">No members yet.</p>'}</div>
    <p style="text-align:right">
      ${canManageRoom(room) ? '<button type="button" class="btn btn-outline" onclick="openAddMemberModal()">+ Add member</button>' : ''}
      <button type="button" class="btn" onclick="closeModal()">Close</button>
    </p>
  `);
}

/* ---- Add member ---- */
function openAddMemberModal() {
  toggleChatMenu(false);
  const room = getActiveThread();
  if (!room || !canManageRoom(room)) return;
  const hasPeople = getUsers().some((u) => !(room.memberEmails || []).includes(u.email.toLowerCase()));
  openModal(`
    ${modalHeader('Add member')}
    <form onsubmit="return submitAddMembers(event)">
      ${pickListHtml(room.memberEmails || [])}
      <p id="form-error" class="form-error" style="display:none"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        ${hasPeople ? '<button type="submit" class="btn">Add</button>' : ''}
      </p>
    </form>
  `);
}

function submitAddMembers(e) {
  e.preventDefault();
  const room = getActiveThread();
  const emails = checkedEmails();
  if (!room || !canManageRoom(room)) return false;
  if (!emails.length) { showFormError('Pick at least one person to add.'); return false; }
  addChatRoomMembers(room.id, emails);
  closeModal();
  refreshChat();
  return false;
}

/* ---- Edit group name ---- */
function openRenameModal() {
  toggleChatMenu(false);
  const room = getActiveThread();
  if (!room || !canManageRoom(room)) return;
  openModal(`
    ${modalHeader('Edit group name')}
    <form onsubmit="return submitRename(event)">
      <p>Group name:<br>
        <input type="text" id="rename-input" value="${esc(room.name)}" maxlength="50" required>
      </p>
      <p id="form-error" class="form-error" style="display:none"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save</button>
      </p>
    </form>
  `);
  const input = document.getElementById('rename-input');
  if (input) { input.focus(); input.select(); }
}

function submitRename(e) {
  e.preventDefault();
  const room = getActiveThread();
  const name = document.getElementById('rename-input').value.trim();
  if (!room || !canManageRoom(room)) return false;
  if (!name) { showFormError('Please enter a group name.'); return false; }
  if (name !== room.name) renameChatRoom(room.id, name);
  closeModal();
  refreshChat();
  return false;
}

/* ---- Delete conversation (for me) ---- */
function openDeleteModal() {
  toggleChatMenu(false);
  const t = getActiveThread();
  if (!t) return;
  const what = t.type === 'direct' ? `your conversation with ${esc(t.name)}` : `\u201c${esc(t.name)}\u201d`;
  openModal(`
    ${modalHeader('Delete conversation?')}
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">This clears ${what} from your chat list. Other people keep their copy, and it comes back if someone sends a new message.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="doDeleteConversation()">Delete</button>
    </p>
  `);
}

function doDeleteConversation() {
  const id = activeRoomId;
  const all = [...getChatRooms(), ...getDirectThreadsForCurrentUser()];
  const t = all.find((x) => x.id === id);
  if (t) setThreadState(id, { cleared: t.messages.length, hidden: true });
  activeRoomId = null;
  closeModal();
  refreshChat();
}

function restoreDeleted() {
  restoreDeletedThreads();
  refreshChat();
}

/* ---- New group ---- */
function openNewGroupModal() {
  const me = getCurrentUser();
  openModal(`
    ${modalHeader('New group')}
    <form onsubmit="return submitNewGroup(event)">
      <p>Group name:<br>
        <input type="text" id="group-name" placeholder="e.g. Grade 5 Science Fair" maxlength="50" required>
      </p>
      <p><strong>Add people</strong></p>
      ${pickListHtml([me.email])}
      <p id="form-error" class="form-error" style="display:none"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Create group</button>
      </p>
    </form>
  `);
}

function submitNewGroup(e) {
  e.preventDefault();
  const name = document.getElementById('group-name').value.trim();
  const emails = checkedEmails();
  if (!name) { showFormError('Please enter a group name.'); return false; }
  if (!emails.length) { showFormError('Pick at least one person to add.'); return false; }
  const room = createChatGroup(name, emails);
  if (room) activeRoomId = room.id;
  closeModal();
  refreshChat();
  return false;
}

/* If we arrived here via "Message" on someone's profile
   (chat.html?dm=<email>), make sure that thread exists, bring it back
   if I'd deleted it, and open it directly, then clean the URL so
   refreshing doesn't re-trigger it. */
(function openDmFromQueryParam() {
  const email = new URLSearchParams(window.location.search).get('dm');
  if (!email) return;
  const thread = getOrCreateDirectThread(email);
  if (thread) {
    setThreadState(thread.id, { hidden: false });
    activeRoomId = thread.id;
  }
  history.replaceState(null, '', 'chat.html');
})();

refreshChat();
