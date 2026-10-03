
function renderAnnouncementCard(a) {
  const metaParts = [];
  if (a.date) metaParts.push(fmtDate(a.date));
  if (a.time) metaParts.push(a.time);
  if (a.location) metaParts.push(a.location);
  const meta = metaParts.length ? `<p class="muted">${metaParts.join(' · ')}</p>` : '';

  const controls = isStaff()
    ? `
      <div>
        <button type="button" class="btn btn-small btn-outline" onclick="openEditAnnouncement(${a.id})">Edit</button>
        <button type="button" class="btn btn-small btn-danger" onclick="confirmDeleteAnnouncement(${a.id})">Delete</button>
      </div>
    `
    : '';

  const me = getCurrentUser();
  const comments = (a.comments || [])
    .map((c) => {
      const author = findCommentAuthor(c);
      const isMe = !!(author && me && author.email.toLowerCase() === me.email.toLowerCase());
      const profileHref = author
        ? (isMe ? 'profile.html' : `view-profile.html?email=${encodeURIComponent(author.email)}`)
        : '';
      const avatar = author
        ? `<a class="avatar comment-avatar" href="${profileHref}" title="View profile" aria-label="View ${escapeAttr(author.name)}'s profile">${initialsFor(c.author)}</a>`
        : `<span class="avatar">${initialsFor(c.author)}</span>`;
      const name = author
        ? `<a class="comment-author" href="${profileHref}">${c.author}</a>`
        : `<strong>${c.author}</strong>`;
      const dm = author && !isMe
        ? `<a class="comment-dm" href="chat.html?dm=${encodeURIComponent(author.email)}" title="Send ${escapeAttr(author.name)} a personal message">&#9993; Message</a>`
        : '';
      return `
        <div class="comment-item">
          ${avatar}
          <div class="comment-bubble">
            <div class="comment-head">${name}${dm}</div>
            <span>${c.text}</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="card" id="card-${a.id}">
      <div class="card-top">
        <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
        ${controls}
      </div>
      <h3>${a.title}</h3>
      ${meta}
      ${a.photo ? `<img class="post-photo" src="${a.photo}" alt="${a.title}">` : ''}
      <p>${a.details || ''}</p>
      <hr>
      <p><strong>Comments</strong> <span class="muted">(${(a.comments || []).length})</span></p>
      <div class="comment-list">${comments}</div>
      <form class="comment-form" onsubmit="return submitComment(event, ${a.id})">
        <input type="text" placeholder="Write a comment..." required>
        <button type="submit" class="btn btn-small">Send</button>
      </form>
    </div>
  `;
}

function initialsFor(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
