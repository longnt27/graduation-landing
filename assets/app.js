// Load the original full-resolution generated artwork. These files are intentionally
// not committed by ChatGPT because the GitHub connector truncates large binary uploads.
(() => {
  const VERSION = 'original-fullres-v1';
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