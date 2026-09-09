// Load the original full-resolution generated artwork. These files are intentionally
// not committed by ChatGPT because the GitHub connector truncates large binary uploads.
(() => {
  const VERSION = 'original-fullres-v4';
  const MESSENGER_URL = 'https://m.me/tlng17';
  const FULL_MAP_URL = "https://www.google.com/maps/place/21%C2%B000'17.8%22N+105%C2%B050'46.2%22E/@21.004937,105.8455279,19z/data=!3m1!4b1!4m13!1m8!3m7!1s0x3135ab9bd9861ca1:0xe7887f7b72ca17a9!2sHanoi,+Ha+Noi,+Vietnam!3b1!8m2!3d21.0277644!4d105.8341598!16zL20vMGZuZmY!3m3!8m2!3d21.004937!4d105.846173?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D";
  const sources = {
    tablet: `/assets/frame-tablet-original.png?v=${VERSION}`,
    mobile: `/assets/frame-mobile-original.png?v=${VERSION}`,
    divider: `/assets/divider-original.png?v=${VERSION}`
  };

  const tablet = document.querySelector('.frame-tablet');
  const mobile = document.querySelector('.frame-mobile');
  const ornaments = document.querySelectorAll('.ornament');

  if (tablet) tablet.src = sources.tablet;
  if (mobile) mobile.src = sources.mobile;
  ornaments.forEach(img => { img.src = sources.divider; });

  // Add a direct Messenger CTA next to the RSVP CTA. m.me opens Messenger when
  // available and otherwise falls back to Messenger/Facebook on the web.
  const heroActions = document.querySelector('.hero-actions');
  if (heroActions && !document.querySelector('#messengerBtn')) {
    const messengerBtn = document.createElement('a');
    messengerBtn.id = 'messengerBtn';
    messengerBtn.className = 'btn btn-secondary messenger-btn';
    messengerBtn.href = MESSENGER_URL;
    messengerBtn.target = '_blank';
    messengerBtn.rel = 'noopener noreferrer';
    messengerBtn.textContent = 'Nhắn tin cho em Long';

    const rsvpBtn = heroActions.querySelector('a[href="#rsvp"]');
    if (rsvpBtn) rsvpBtn.after(messengerBtn);
    else heroActions.prepend(messengerBtn);
  }

  // Older HTML builds contained a tentative schedule card. Keep this as a harmless
  // compatibility cleanup in case a cached document is still open in a browser.
  const detailsGrid = document.querySelector('#details .info-grid');
  const scheduleCard = detailsGrid?.querySelector('.paper:nth-child(2)');
  if (scheduleCard) scheduleCard.remove();

  // Guestbook may be anonymous. These guards keep older cached HTML compatible.
  const guestbookForm = document.querySelector('#guestbookForm');
  const guestbookName = document.querySelector('#messageName');
  const guestbookNameLabel = document.querySelector('label[for="messageName"]');
  if (guestbookName) {
    guestbookName.required = false;
    guestbookName.placeholder = 'Để trống nếu muốn ẩn danh';
  }
  if (guestbookNameLabel) guestbookNameLabel.textContent = 'Tên của bạn (không bắt buộc)';

  if (guestbookForm && !document.querySelector('#messageImage')) {
    const actions = guestbookForm.querySelector('.form-actions');
    const imageField = document.createElement('div');
    imageField.className = 'field guestbook-image-field';
    imageField.innerHTML = `
      <label for="messageImage">Ảnh kèm theo (không bắt buộc)</label>
      <input id="messageImage" name="image" type="file" accept="image/jpeg,image/png,image/webp">
      <div class="helper">Có thể gửi 1 ảnh. Trang sẽ tự tối ưu ảnh trước khi tải lên.</div>
    `;
    actions?.before(imageField);
  }

  const style = document.createElement('style');
  style.textContent = `
    .frame {
      opacity: 1 !important;
      filter: none !important;
      transform: none !important;
      object-fit: contain !important;
      object-position: center !important;
      image-rendering: auto !important;
    }
    .ornament {
      opacity: 1 !important;
      filter: none !important;
      image-rendering: auto !important;
    }

    #details .info-grid {
      grid-template-columns: minmax(0, 860px) !important;
      justify-content: center;
    }

    .map-embed-wrap {
      margin-top: 20px;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(116,64,54,.16);
      background: #eadfcf;
      aspect-ratio: 16 / 9;
      min-height: 240px;
    }
    .map-embed {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 240px;
      border: 0;
    }

    /* Native select is now only a fallback; custom-ui.js provides the consistent
       interactive listbox. Keep the fallback legible if JavaScript is unavailable. */
    .field select {
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      color-scheme: dark;
      background-color: rgba(255,250,240,.085) !important;
      color: #fff8ef !important;
      padding-right: 44px !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23e9cf93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 14px center !important;
      background-size: 16px 16px !important;
      cursor: pointer;
    }
    .field select:hover {
      background-color: rgba(255,250,240,.11) !important;
      border-color: rgba(233,207,147,.30) !important;
    }
    .field select:focus {
      background-color: rgba(255,250,240,.12) !important;
      border-color: rgba(233,207,147,.58) !important;
    }
    .field select option,
    .field select optgroup {
      background: #35050b !important;
      color: #fff8ef !important;
    }
    .field select option:checked {
      background: #6a101b !important;
      color: #fffdf7 !important;
    }
    .field select option:disabled {
      color: #bca99d !important;
    }
    .field select::-ms-expand {
      display: none;
    }
    @media (forced-colors: active) {
      .field select {
        appearance: auto !important;
        background-image: none !important;
      }
    }

    /* RSVP only needs the form. The inline status below the submit button is
       enough feedback, so hide the redundant summary panel in older cached HTML. */
    #rsvp .forms-grid {
      grid-template-columns: minmax(0, 860px) !important;
      justify-content: center;
    }
    #rsvp .forms-grid > .panel + .panel {
      display: none !important;
    }

    /* Keep each field label visually attached to its own control while giving
       consecutive form rows enough breathing room. */
    form > .field-grid + .field-grid,
    form > .field-grid + .field,
    form > .field + .field-grid,
    form > .field + .field {
      margin-top: 18px !important;
    }
    .field label {
      line-height: 1.4;
    }
    .guestbook-image-field input[type="file"] {
      padding: 10px 12px !important;
      cursor: pointer;
    }
    .guestbook-image-field input[type="file"]::file-selector-button {
      border: 0;
      border-radius: 999px;
      margin-right: 10px;
      padding: 9px 12px;
      background: rgba(233,207,147,.16);
      color: #fff4dc;
      font-weight: 700;
      cursor: pointer;
    }
    .message-photo {
      display: block;
      width: 100%;
      max-height: 520px;
      object-fit: cover;
      margin-top: 14px;
      border-radius: 14px;
      border: 1px solid rgba(233,207,147,.14);
      background: rgba(0,0,0,.12);
    }

    /* Mobile: keep the portrait composition, but give the ornament more room
       by reducing the type scale and vertical rhythm a little. */
    @media (max-width: 639px) {
      .invitation-copy {
        width: min(72%, 330px) !important;
        padding: 90px 0 88px !important;
      }
      .kicker {
        font-size: 9px !important;
        margin-bottom: 6px !important;
      }
      .hero-title {
        font-size: clamp(40px, 11.5vw, 48px) !important;
        line-height: .92 !important;
      }
      .hero-name {
        font-size: clamp(31px, 8.5vw, 39px) !important;
        margin-top: 4px !important;
      }
      .rule {
        margin: 14px auto !important;
      }
      .hero-desc {
        font-size: clamp(17px, 4.6vw, 19px) !important;
        line-height: 1.42 !important;
      }
      .hero-date {
        font-size: clamp(27px, 7vw, 31px) !important;
        margin-top: 14px !important;
      }
      .hero-meta {
        font-size: 11px !important;
        line-height: 1.55 !important;
        margin-top: 5px !important;
      }
      .hero-actions {
        margin-top: 17px !important;
        gap: 8px !important;
      }
      .hero-actions .btn {
        padding: 12px 15px !important;
      }
      .map-embed-wrap,
      .map-embed {
        min-height: 220px;
      }
    }

    /* Small tablets (notably iPad Mini portrait): the old >=640px rules used
       desktop-sized type and ~220px of copy padding, which made the copy collide
       with the frame. Keep the same artwork but make the invitation compact. */
    @media (min-width: 640px) and (max-width: 899px) {
      .invitation-stage {
        min-height: 700px !important;
        max-height: 740px !important;
      }
      .invitation-copy {
        width: min(58%, 430px) !important;
        padding: 44px 0 40px !important;
      }
      .kicker {
        font-size: 9px !important;
        margin-bottom: 6px !important;
      }
      .hero-title {
        font-size: clamp(50px, 7.6vw, 58px) !important;
        line-height: .9 !important;
      }
      .hero-name {
        font-size: clamp(38px, 6vw, 44px) !important;
        margin-top: 2px !important;
      }
      .rule {
        margin: 12px auto !important;
      }
      .hero-desc {
        font-size: clamp(18px, 2.6vw, 20px) !important;
        line-height: 1.4 !important;
      }
      .hero-date {
        font-size: clamp(30px, 4.3vw, 34px) !important;
        margin-top: 12px !important;
      }
      .hero-meta {
        font-size: 11px !important;
        line-height: 1.5 !important;
        margin-top: 4px !important;
      }
      .hero-actions {
        margin-top: 14px !important;
        gap: 8px !important;
        flex-wrap: nowrap !important;
      }
      .hero-actions .btn {
        padding: 11px 12px !important;
        font-size: 11px !important;
      }
    }

    @media (min-width: 640px) {
      form > .field-grid + .field-grid,
      form > .field-grid + .field,
      form > .field + .field-grid,
      form > .field + .field {
        margin-top: 20px !important;
      }
    }

    @media (min-width: 1200px) {
      .frame-tablet {
        width: 100% !important;
        height: 100% !important;
        inset: 0 !important;
        object-fit: contain !important;
      }
    }
  `;
  document.head.appendChild(style);

  import(`/assets/app-core.js?v=${VERSION}`)
    .then(() => {
      const mapBtn = document.querySelector('#mapBtn');
      const detailTime = document.querySelector('#detailTime');
      const detailLocation = document.querySelector('#detailLocation');
      const heroMeta = document.querySelector('#heroMeta');

      if (mapBtn) {
        mapBtn.href = FULL_MAP_URL;
        mapBtn.hidden = false;
      }
      if (detailTime) detailTime.textContent = '08:00';
      if (detailLocation) detailLocation.textContent = 'Toà B1, Đại học Bách khoa Hà Nội';
      if (heroMeta) heroMeta.textContent = 'Chủ Nhật · 08:00 · Toà B1, Đại học Bách khoa Hà Nội';
    })
    .catch(err => {
      console.error('Failed to load application logic', err);
    });
})();