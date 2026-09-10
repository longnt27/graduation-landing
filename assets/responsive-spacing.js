(() => {
  const EVENT = {
    dateTime: '2026-09-27T09:00:00+07:00',
    time: '09:00 (dự kiến)',
    location: 'Toà C2, Đại học Bách khoa Hà Nội'
  };
  const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=21.0064474%2C105.8423066';
  const MAP_EMBED = 'https://www.google.com/maps?q=21.0064474%2C105.8423066&z=18&output=embed';

  // Keep the hero to the two intended actions even if an older cached app.js
  // still injects the temporary Messenger CTA into the invitation itself.
  const heroMessenger = document.querySelector('.hero-actions #messengerBtn');
  if (heroMessenger) heroMessenger.remove();

  // custom-ui.js from earlier revisions observes these nodes with the previous
  // event details. Replacing the nodes detaches that stale observer while keeping
  // the same IDs for app-core.js and the rest of the page.
  const eventIds = ['heroMeta', 'detailTime', 'detailLocation', 'days', 'hours', 'minutes', 'seconds'];
  const eventNodes = {};
  eventIds.forEach(id => {
    const oldNode = document.getElementById(id);
    if (!oldNode) return;
    const node = oldNode.cloneNode(true);
    oldNode.replaceWith(node);
    eventNodes[id] = node;
  });

  function applyEventDetails() {
    const meta = `Chủ Nhật · ${EVENT.time} · ${EVENT.location}`;
    if (eventNodes.heroMeta && eventNodes.heroMeta.textContent !== meta) eventNodes.heroMeta.textContent = meta;
    if (eventNodes.detailTime && eventNodes.detailTime.textContent !== EVENT.time) eventNodes.detailTime.textContent = EVENT.time;
    if (eventNodes.detailLocation && eventNodes.detailLocation.textContent !== EVENT.location) eventNodes.detailLocation.textContent = EVENT.location;
  }

  function tickCountdown() {
    const safe = Math.max(0, new Date(EVENT.dateTime).getTime() - Date.now());
    const values = [
      Math.floor(safe / 86400000),
      Math.floor((safe % 86400000) / 3600000),
      Math.floor((safe % 3600000) / 60000),
      Math.floor((safe % 60000) / 1000)
    ];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => {
      const node = eventNodes[id];
      const value = String(values[index]).padStart(2, '0');
      if (node && node.textContent !== value) node.textContent = value;
    });
  }

  applyEventDetails();
  tickCountdown();
  setInterval(tickCountdown, 1000);

  const eventObserver = new MutationObserver(() => {
    applyEventDetails();
    tickCountdown();
  });
  Object.values(eventNodes).forEach(node => {
    eventObserver.observe(node, { childList: true, characterData: true, subtree: true });
  });

  const mapBtn = document.getElementById('mapBtn');
  const mapEmbed = document.querySelector('.map-embed');
  function applyMap() {
    if (mapBtn && mapBtn.href !== MAP_URL) mapBtn.href = MAP_URL;
    if (mapEmbed && mapEmbed.src !== MAP_EMBED) mapEmbed.src = MAP_EMBED;
  }
  applyMap();
  if (mapBtn) {
    new MutationObserver(applyMap).observe(mapBtn, { attributes: true, attributeFilter: ['href'] });
  }

  const style = document.createElement('style');
  style.textContent = `
    #rsvp .panel,
    #rsvp .forms-grid {
      overflow: visible !important;
    }

    /* Details and RSVP each have one card. Let them span the same desktop
       container width as the countdown and guestbook instead of keeping the
       old two-column / 860px constraints. */
    @media (min-width: 900px) {
      #details .info-grid,
      #rsvp .forms-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        justify-content: stretch !important;
      }
    }

    /* app.css intentionally made the desktop hero wider than every other
       section. Keep all top-level section edges aligned on large screens. */
    @media (min-width: 1200px) {
      .hero .container {
        width: min(1180px, calc(100% - 36px)) !important;
      }
    }

    /* Keep the invitation close to the next section on phones/tablets. Desktop
       spacing is intentionally untouched. */
    @media (max-width: 639px) {
      .hero {
        padding-top: 5px !important;
        padding-bottom: 7px !important;
      }
      #countdown {
        padding-top: 4px !important;
      }

      .map-embed-wrap {
        display: block !important;
        width: 100% !important;
        height: clamp(160px, 46vw, 190px) !important;
        min-height: 0 !important;
        aspect-ratio: auto !important;
      }
      .map-embed {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        border: 0 !important;
      }
    }

    @media (min-width: 640px) and (max-width: 899px) {
      .hero {
        padding-top: 8px !important;
        padding-bottom: 10px !important;
      }
      #countdown {
        padding-top: 5px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
