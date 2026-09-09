(() => {
  const SELECTOR = '.field select';
  const EVENT = {
    dateTime: '2026-09-27T08:00:00+07:00',
    time: '08:00',
    location: 'Toà B1, Đại học Bách khoa Hà Nội'
  };

  function applyEventDetails() {
    const heroMeta = document.querySelector('#heroMeta');
    const detailTime = document.querySelector('#detailTime');
    const detailLocation = document.querySelector('#detailLocation');
    const expectedMeta = `Chủ Nhật · ${EVENT.time} · ${EVENT.location}`;

    if (heroMeta && heroMeta.textContent !== expectedMeta) heroMeta.textContent = expectedMeta;
    if (detailTime && detailTime.textContent !== EVENT.time) detailTime.textContent = EVENT.time;
    if (detailLocation && detailLocation.textContent !== EVENT.location) detailLocation.textContent = EVENT.location;
  }

  function applyCountdown() {
    const target = new Date(EVENT.dateTime).getTime();
    const safe = Math.max(0, target - Date.now());
    const values = [
      Math.floor(safe / 86400000),
      Math.floor((safe % 86400000) / 3600000),
      Math.floor((safe % 3600000) / 60000),
      Math.floor((safe % 60000) / 1000)
    ];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => {
      const node = document.getElementById(id);
      const value = String(values[index]).padStart(2, '0');
      if (node && node.textContent !== value) node.textContent = value;
    });
  }

  applyEventDetails();
  applyCountdown();

  // app-core.js still owns the general page behavior. Keep the confirmed event
  // details authoritative even if an older cached CONFIG writes placeholders.
  const eventNodes = ['heroMeta', 'detailTime', 'detailLocation', 'days', 'hours', 'minutes', 'seconds']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const eventObserver = new MutationObserver(() => {
    applyEventDetails();
    applyCountdown();
  });
  eventNodes.forEach(node => eventObserver.observe(node, { childList: true, characterData: true, subtree: true }));

  function closeAll(except = null) {
    document.querySelectorAll('.custom-select.is-open').forEach(root => {
      if (root !== except) {
        root.classList.remove('is-open', 'open-up');
        const trigger = root.querySelector('.custom-select-trigger');
        const menu = root.querySelector('.custom-select-menu');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (menu) menu.hidden = true;
      }
    });
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.customSelectReady === 'true') return;
    select.dataset.customSelectReady = 'true';

    const wasRequired = select.required;
    select.required = false;
    select.dataset.customRequired = wasRequired ? 'true' : 'false';
    select.classList.add('native-select-proxy');

    const root = document.createElement('div');
    root.className = 'custom-select';
    select.parentNode.insertBefore(root, select);
    root.appendChild(select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-required', wasRequired ? 'true' : 'false');

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    menu.id = `${select.id || select.name}-custom-menu`;
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    trigger.setAttribute('aria-controls', menu.id);

    // Empty-value options are placeholders, not real choices. Keep them in the
    // native select so reset/FormData semantics stay intact, but never render
    // them inside the custom listbox.
    const optionButtons = Array.from(select.options).map((option, index) => {
      if (!option.value) return null;

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'custom-select-option';
      item.setAttribute('role', 'option');
      item.dataset.index = String(index);
      item.textContent = option.textContent;
      item.disabled = option.disabled;
      item.addEventListener('click', () => choose(index));
      menu.appendChild(item);
      return item;
    });
    const selectableIndices = optionButtons
      .map((item, index) => item && !item.disabled ? index : null)
      .filter(index => index !== null);

    root.append(trigger, menu);

    function sync() {
      const selected = select.options[select.selectedIndex] || select.options[0];
      trigger.textContent = selected?.textContent || 'Chọn';
      trigger.classList.toggle('is-placeholder', !select.value);
      trigger.classList.remove('is-invalid');
      trigger.removeAttribute('aria-invalid');
      optionButtons.forEach((item, index) => {
        if (item) item.setAttribute('aria-selected', index === select.selectedIndex ? 'true' : 'false');
      });
    }

    function resolveFocusableIndex(index, direction = 1) {
      if (!selectableIndices.length) return -1;
      if (selectableIndices.includes(index)) return index;

      if (direction < 0) {
        const previous = [...selectableIndices].reverse().find(candidate => candidate <= index);
        return previous ?? selectableIndices[selectableIndices.length - 1];
      }

      const next = selectableIndices.find(candidate => candidate >= index);
      return next ?? selectableIndices[0];
    }

    function focusOption(index, direction = 1) {
      const next = resolveFocusableIndex(index, direction);
      if (next < 0) return;
      optionButtons[next]?.focus({ preventScroll: true });
      optionButtons[next]?.scrollIntoView({ block: 'nearest' });
    }

    function open(preferredIndex = select.selectedIndex, direction = 1) {
      closeAll(root);
      root.classList.add('is-open');
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');

      requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const menuHeight = menu.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom - 12;
        const spaceAbove = rect.top - 12;
        root.classList.toggle('open-up', spaceBelow < Math.min(menuHeight, 220) && spaceAbove > spaceBelow);
        focusOption(preferredIndex, direction);
      });
    }

    function close({ focusTrigger = false } = {}) {
      root.classList.remove('is-open', 'open-up');
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (focusTrigger) trigger.focus();
    }

    function choose(index) {
      const option = select.options[index];
      if (!option || option.disabled || !option.value) return;
      select.selectedIndex = index;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      close({ focusTrigger: true });
    }

    trigger.addEventListener('click', () => {
      if (root.classList.contains('is-open')) close();
      else open(select.selectedIndex || selectableIndices[0], 1);
    });

    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        open(select.selectedIndex + delta, delta);
      } else if (event.key === 'Home') {
        event.preventDefault();
        open(selectableIndices[0], 1);
      } else if (event.key === 'End') {
        event.preventDefault();
        open(selectableIndices[selectableIndices.length - 1], -1);
      } else if (event.key === 'Escape') {
        close();
      }
    });

    menu.addEventListener('keydown', event => {
      const current = document.activeElement?.dataset?.index;
      const currentIndex = Number.isFinite(Number(current)) ? Number(current) : select.selectedIndex;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        focusOption(currentIndex + delta, delta);
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusOption(selectableIndices[0], 1);
      } else if (event.key === 'End') {
        event.preventDefault();
        focusOption(selectableIndices[selectableIndices.length - 1], -1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close({ focusTrigger: true });
      } else if (event.key === 'Tab') {
        close();
      }
    });

    select.addEventListener('change', sync);

    const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
    label?.addEventListener('click', event => {
      event.preventDefault();
      trigger.focus();
    });

    select.form?.addEventListener('reset', () => {
      setTimeout(sync, 0);
    });

    sync();
  }

  document.querySelectorAll(SELECTOR).forEach(enhanceSelect);

  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', event => {
      const invalid = Array.from(form.querySelectorAll('select.native-select-proxy[data-custom-required="true"]'))
        .find(select => !select.value);
      if (!invalid) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const trigger = invalid.closest('.custom-select')?.querySelector('.custom-select-trigger');
      if (trigger) {
        trigger.classList.add('is-invalid');
        trigger.setAttribute('aria-invalid', 'true');
        trigger.focus();
      }
    }, true);
  });

  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.custom-select')) closeAll();
  });

  window.addEventListener('resize', () => closeAll());
  window.addEventListener('scroll', () => closeAll(), { passive: true });

  const style = document.createElement('style');
  style.textContent = `
    .native-select-proxy {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0 0 0 0) !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
      border: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .custom-select {
      position: relative;
      width: 100%;
      min-width: 0;
    }
    .custom-select-trigger {
      position: relative;
      width: 100%;
      min-height: 49px;
      border-radius: 14px;
      border: 1px solid rgba(233,207,147,.17);
      background: rgba(255,250,240,.085);
      color: #fff8ef;
      padding: 14px 46px 14px 15px;
      text-align: left;
      font: inherit;
      line-height: 1.35;
      cursor: pointer;
      outline: none;
      transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .custom-select-trigger::after {
      content: '';
      position: absolute;
      right: 17px;
      top: 50%;
      width: 8px;
      height: 8px;
      border-right: 2px solid #e9cf93;
      border-bottom: 2px solid #e9cf93;
      transform: translateY(-70%) rotate(45deg);
      transition: transform .18s ease;
      pointer-events: none;
    }
    .custom-select.is-open .custom-select-trigger::after {
      transform: translateY(-25%) rotate(225deg);
    }
    .custom-select-trigger:hover {
      background: rgba(255,250,240,.105);
      border-color: rgba(233,207,147,.30);
    }
    .custom-select-trigger:focus-visible,
    .custom-select.is-open .custom-select-trigger {
      background: rgba(255,250,240,.12);
      border-color: rgba(233,207,147,.48);
      box-shadow: 0 0 0 3px rgba(233,207,147,.08);
    }
    .custom-select-trigger.is-placeholder {
      color: rgba(255,239,219,.55);
    }
    .custom-select-trigger.is-invalid {
      border-color: rgba(255,130,145,.82) !important;
      box-shadow: 0 0 0 3px rgba(255,130,145,.10) !important;
    }
    .custom-select-menu {
      position: absolute;
      z-index: 80;
      left: 0;
      right: 0;
      top: calc(100% + 7px);
      max-height: min(280px, 45vh);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 6px;
      border-radius: 14px;
      border: 1px solid rgba(233,207,147,.24);
      background: #2f050a;
      box-shadow: 0 18px 45px rgba(0,0,0,.42);
    }
    .custom-select.open-up .custom-select-menu {
      top: auto;
      bottom: calc(100% + 7px);
    }
    .custom-select-menu[hidden] {
      display: none !important;
    }
    .custom-select-option {
      display: block;
      width: 100%;
      border: 0;
      border-radius: 10px;
      padding: 11px 12px;
      background: transparent;
      color: #fff8ef;
      text-align: left;
      font: inherit;
      line-height: 1.35;
      cursor: pointer;
      outline: none;
    }
    .custom-select-option:hover,
    .custom-select-option:focus-visible {
      background: #57101a;
      color: #fffdf7;
    }
    .custom-select-option[aria-selected="true"] {
      background: #6a101b;
      color: #fffdf7;
    }
    .custom-select-option:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    /* Embedded Google Maps is useful on larger screens, but on phones an iframe
       steals touch gestures and is easy to break with tiny viewport heights. */
    @media (max-width: 639px) {
      .map-embed-wrap {
        display: none !important;
      }
      #details .form-actions {
        margin-top: 18px !important;
      }
      #mapBtn {
        width: 100%;
      }
    }
    @media (min-width: 640px) {
      .map-embed-wrap {
        display: block !important;
        width: 100% !important;
        min-height: 0 !important;
        aspect-ratio: 16 / 9 !important;
      }
      .map-embed {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        border: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
