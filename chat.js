
requireAuth();
renderNavbar('chat');

let activeRoomId = null;

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* Rooms and DM threads */
function getAllThreads() {
  const rooms = getChatRooms().map((r) => ({ ...r, type: 'room' }));
  const directs = getDirectThreadsForCurrentUser().map((d) => ({ ...d, type: 'direct' }));
  return [...rooms, ...directs];
}

function roomListItemHtml(t) {
  const last = t.messages[t.messages.length - 1];
  const preview = last ? `${last.author}: ${last.text}` : 'No messages yet';
  return `
    <div class="chat-room-item ${t.id === activeRoomId ? 'active' : ''}" onclick="selectRoom('${t.id}')">
      <strong>${t.type === 'direct' ? '@ ' : ''}${t.name}</strong>
      <small>${preview}</small>
    </div>
  `;
}

function renderRoomList() {
  const rooms = getChatRooms();
  const directs = getDirectThreadsForCurrentUser();
  if (!activeRoomId) activeRoomId = (rooms[0] && rooms[0].id) || (directs[0] && directs[0].id);

  const roomsHtml = rooms.map((r) => roomListItemHtml({ ...r, type: 'room' })).join('');
  const directsHtml = directs.length
    ? `<p class="muted" style="margin:16px 0 8px; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.04em;">Direct messages</p>
       ${directs.map((d) => roomListItemHtml({ ...d, type: 'direct' })).join('')}`
    : '';

  document.getElementById('chat-rooms').innerHTML = `
    <p><strong>Chat rooms</strong></p>
    ${roomsHtml}
    ${directsHtml}
  `;
}

function selectRoom(id) {
  activeRoomId = id;
  renderRoomList();
  renderRoomMain();
}

function renderRoomMain() {
  const thread = getAllThreads().find((t) => t.id === activeRoomId);
  const main = document.getElementById('chat-main');
  if (!thread) {
    main.innerHTML = '<p class="muted">Select a chat room.</p>';
    return;
  }

  const isDirect = thread.type === 'direct';
  const canPost = isDirect || !thread.adminOnly || isStaff();
  const subtitle = isDirect
    ? 'Direct message'
    : `${thread.members} members${thread.adminOnly ? ' · Admin only can post' : ''}`;

  main.innerHTML = `
    <h3>${isDirect ? '@ ' : ''}${thread.name}</h3>
    <p class="muted">${subtitle}</p>
    <hr>
    <div class="chat-messages">
      ${thread.messages.length
        ? thread.messages.map((m) => `<p><strong>${personNameHtml(m.author)}:</strong> ${m.text}</p>`).join('')
        : '<p class="muted" style="font-size:0.85rem;">No messages yet. Say hello!</p>'
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
  renderRoomList();
  renderRoomMain();
  return false;
}

/* If we arrived here via "Message" on someone's profile. */
(function openDmFromQueryParam() {
  const email = new URLSearchParams(window.location.search).get('dm');
  if (!email) return;
  const thread = getOrCreateDirectThread(email);
  if (thread) activeRoomId = thread.id;
  history.replaceState(null, '', 'chat.html');
})();

renderRoomList();
renderRoomMain();

/* Keep chat in sync when a message is sent from another tab (or by
   the other person in a DM, in their own tab). */
onDataChange([STORAGE_KEYS.chatRooms, STORAGE_KEYS.directThreads], () => {
  renderRoomList();
  renderRoomMain();
});

