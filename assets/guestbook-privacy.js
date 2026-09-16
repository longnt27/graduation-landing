(() => {
  const form = document.querySelector('#guestbookForm');
  if (!form || document.querySelector('#messagePublic')) return;

  const actions = form.querySelector('.form-actions');
  const imageField = form.querySelector('.guestbook-image-field');
  const visibility = document.createElement('div');
  visibility.className = 'guestbook-visibility';
  visibility.innerHTML = `
    <label class="guestbook-visibility-option" for="messagePublic">
      <input id="messagePublic" name="isPublic" type="checkbox" checked>
      <span>Hiển thị lời nhắn công khai</span>
    </label>
    <div class="helper">Bỏ chọn để chỉ gửi riêng cho em Long.</div>
  `;
  (imageField || actions)?.after(visibility);

  const style = document.createElement('style');
  style.textContent = `
    .guestbook-visibility {
      margin-top: 18px;
      padding: 14px 15px;
      border: 1px solid rgba(233,207,147,.16);
      border-radius: 14px;
      background: rgba(255,250,240,.055);
    }
    .guestbook-visibility-option {
      display: flex;
      align-items: center;
      gap: 11px;
      color: #fff4dc;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .guestbook-visibility-option input {
      appearance: none;
      width: 20px;
      height: 20px;
      margin: 0;
      flex: 0 0 20px;
      border: 1px solid rgba(233,207,147,.42);
      border-radius: 6px;
      background: rgba(255,255,255,.04);
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .guestbook-visibility-option input::after {
      content: '✓';
      color: #351006;
      font-size: 14px;
      font-weight: 900;
      transform: scale(0);
      transition: transform .12s ease;
    }
    .guestbook-visibility-option input:checked {
      background: linear-gradient(135deg,#f3dfaa,#bd8f3d);
      border-color: rgba(243,223,170,.85);
    }
    .guestbook-visibility-option input:checked::after {
      transform: scale(1);
    }
    .guestbook-visibility .helper {
      margin-top: 7px;
      padding-left: 31px;
    }
  `;
  document.head.appendChild(style);

  const checkbox = visibility.querySelector('#messagePublic');
  const status = document.querySelector('#guestbookStatus');
  let submittedPublic = true;

  form.addEventListener('submit', () => {
    submittedPublic = checkbox.checked;
  }, true);

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
    if (url === '/api/guestbook' && method === 'POST' && typeof init.body === 'string') {
      try {
        const payload = JSON.parse(init.body);
        payload.isPublic = checkbox.checked;
        init = { ...init, body: JSON.stringify(payload) };
      } catch {
        // Let the original request proceed; the server will return a useful error.
      }
    }
    return nativeFetch(input, init);
  };

  if (status) {
    new MutationObserver(() => {
      if (submittedPublic || !status.classList.contains('success')) return;
      const strong = status.querySelector('strong');
      if (strong?.textContent?.startsWith('Đã lưu lời chúc của ')) {
        strong.textContent = strong.textContent.replace('Đã lưu lời chúc của ', 'Đã gửi riêng lời chúc của ');
      }
    }).observe(status, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
})();
