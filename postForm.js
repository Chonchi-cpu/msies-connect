/* ============================================================
   postForm.js - shared "new/edit announcement" form markup.
   Used by feed.js (Feed page "+ New post" / Edit) and
   calendar.js (Calendar page "+ Add event" / day click).
   The caller supplies the <form> id and wires its own submit
   handler; this file only builds the inner fields so both
   pages stay visually and structurally consistent.
   ============================================================ */

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

/* Announcement photos are stored as base64 data URLs directly in
   localStorage (there's no backend/file storage), and localStorage
   has a small total quota (usually 5-10MB shared across the whole
   site). An unscaled phone photo can easily be 3-8MB on its own, so
   every upload is downscaled and re-compressed client-side before
   it's saved. This keeps typical photos in the 50-300KB range. */
const PHOTO_MAX_DIMENSION = 1280; // longest side, in px
const PHOTO_JPEG_QUALITY = 0.8;
const PHOTO_MAX_BYTES = 1.5 * 1024 * 1024; // hard ceiling after compression

function handlePostPhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    e.target.value = '';
    return;
  }

  const dropZone = document.querySelector('.photo-drop');
  if (dropZone) dropZone.classList.add('photo-drop-loading');

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const dataUrl = downscaleImage(img);
      const approxBytes = Math.ceil((dataUrl.length * 3) / 4);

      if (approxBytes > PHOTO_MAX_BYTES) {
        alert('That image is still too large after compression. Please choose a smaller photo.');
        if (dropZone) dropZone.classList.remove('photo-drop-loading');
        e.target.value = '';
        return;
      }

      document.getElementById('pf-photo').value = dataUrl;
      const preview = document.getElementById('pf-photo-preview');
      preview.src = dataUrl;
      preview.style.display = 'block';
      const removeWrap = document.getElementById('pf-remove-photo-wrap');
      if (removeWrap) removeWrap.style.display = 'block';
      if (dropZone) dropZone.classList.remove('photo-drop-loading');
    };
    img.onerror = () => {
      alert("Couldn't read that image. Please try a different file.");
      if (dropZone) dropZone.classList.remove('photo-drop-loading');
      e.target.value = '';
    };
    img.src = reader.result;
  };
  reader.onerror = () => {
    alert("Couldn't read that file. Please try again.");
    if (dropZone) dropZone.classList.remove('photo-drop-loading');
  };
  reader.readAsDataURL(file);
}

/* Draws the loaded image onto a canvas scaled down so its longest
   side is at most PHOTO_MAX_DIMENSION, then re-encodes it as a
   compressed JPEG data URL. Images already smaller than the max
   dimension are only re-compressed, not upscaled. */
function downscaleImage(img) {
  const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
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
