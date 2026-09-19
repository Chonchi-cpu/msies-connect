const POST_CATEGORIES = ['Events', 'Holidays', 'Reminders'];

function postFormFields(a) {
  a = a || {};
  const catButtons = POST_CATEGORIES.map(
    (c) => `<label><input type="radio" name="category" value="${c}" ${a.category === c || (!a.category && c === 'Events') ? 'checked' : ''}> ${c}</label>`
  ).join(' ');

  return `
    <p><strong>Category</strong><br>${catButtons}</p>
    <p>Title:<br>
      <input type="text" id="pf-title" placeholder="e.g. PTA General Assembly" value="${a.title ? escapeAttr(a.title) : ''}" required>
    </p>
    <p>Details:<br>
      <textarea id="pf-details" placeholder="Write what parents and teachers need to know...">${a.details ? escapeHtml(a.details) : ''}</textarea>
    </p>
    <div class="field-row">
      <div>
        <p>Date (optional):<br>
          <input type="date" id="pf-date" value="${a.date || ''}">
        </p>
      </div>
      <div>
        <p>Time (optional):<br>
          <input type="time" id="pf-time" value="${a.time || ''}">
        </p>
      </div>
    </div>
    <p>Location (optional):<br>
      <input type="text" id="pf-location" placeholder="e.g. School covered court" value="${a.location ? escapeAttr(a.location) : ''}">
    </p>
    <div>
      <strong style="display:block; margin-bottom:8px; font-size:0.85rem;">Photo (optional)</strong>
      <div class="photo-drop" onclick="document.getElementById('pf-photo-input').click()">
        Click to upload an image
        <img id="pf-photo-preview" class="photo-preview" src="${a.photo || ''}" style="${a.photo ? '' : 'display:none;'}">
      </div>
      <input type="file" id="pf-photo-input" accept="image/*" style="display:none" onchange="handlePostPhotoChange(event)">
      <input type="hidden" id="pf-photo" value="${a.photo ? escapeAttr(a.photo) : ''}">
      <p id="pf-remove-photo-wrap" style="${a.photo ? '' : 'display:none;'} margin-top:6px;">
        <a href="#" onclick="clearPostPhoto(); return false;" style="font-size:0.85rem;">Remove photo</a>
      </p>
    </div>
  `;
}

function handlePostPhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('pf-photo').value = reader.result;
    const preview = document.getElementById('pf-photo-preview');
    preview.src = reader.result;
    preview.style.display = 'block';
    const removeWrap = document.getElementById('pf-remove-photo-wrap');
    if (removeWrap) removeWrap.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearPostPhoto() {
  document.getElementById('pf-photo').value = '';
  const preview = document.getElementById('pf-photo-preview');
  preview.src = '';
  preview.style.display = 'none';
  const removeWrap = document.getElementById('pf-remove-photo-wrap');
  if (removeWrap) removeWrap.style.display = 'none';
}

function readPostForm() {
  const category = document.querySelector('input[name="category"]:checked').value;
  return {
    category,
    title: document.getElementById('pf-title').value.trim(),
    details: document.getElementById('pf-details').value.trim(),
    date: document.getElementById('pf-date').value,
    time: document.getElementById('pf-time').value,
    location: document.getElementById('pf-location').value.trim(),
    photo: document.getElementById('pf-photo').value || ''
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
