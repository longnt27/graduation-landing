const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/assets/frame-fix.css?v=2';
document.head.appendChild(stylesheet);

function upgrade(selector, src) {
  const nodes = [...document.querySelectorAll(selector)];
  if (!nodes.length) return;

  const probe = new Image();
  probe.decoding = 'async';
  probe.onload = () => {
    for (const node of nodes) node.src = src;
  };
  probe.src = src;
}

upgrade('.frame-tablet', '/assets/frame-tablet-v3.png');
upgrade('.frame-mobile', '/assets/frame-mobile-v3.png');
upgrade('.ornament', '/assets/divider-v3.png');
