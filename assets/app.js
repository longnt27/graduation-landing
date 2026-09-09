// Load the original full-resolution generated artwork. These files are intentionally
// not committed by ChatGPT because the GitHub connector truncates large binary uploads.
(() => {
  const VERSION = 'original-fullres-v2';
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

  // Remove the tentative schedule card entirely; only confirmed event details remain.
  const detailsGrid = document.querySelector('#details .info-grid');
  const scheduleCard = detailsGrid?.querySelector('.paper:nth-child(2)');
  if (scheduleCard) scheduleCard.remove();

  // Guestbook may be anonymous. Add one optional image input without making the
  // base HTML dependent on large binary assets or another framework.
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

    /* RSVP only needs the form. The inline status below the submit button is
       enough feedback, so hide the redundant summary panel and center the form. */
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
        padding: 11px 14px !important;
        font-size: 12px !important;
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

  import(`/assets/app-core.js?v=${VERSION}`).catch(err => {
    console.error('Failed to load application logic', err);
  });
})();