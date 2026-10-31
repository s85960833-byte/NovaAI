# Nova AI UI Rules

- Keep exactly one viewport meta: width=device-width, initial-scale=1, viewport-fit=cover.
- Never use 100vw or scale/zoom on html, body, or the app root for sizing.
- html, body, and #novaApp must stay width/max-width 100%, min-width 0, and clip horizontal overflow.
- Every decorative layer must be fixed to inset:0, clipped, pointer-events:none, and contain:layout paint; animate only inner layers.
- Main app is a 100dvh flex column; header is fixed-height, message area flex:1 with min-height:0 and vertical scrolling, composer stays at the bottom with safe-area padding.
- Mobile category cards are one column through 599px; two columns from 600px.
- The first body paint is the static splash; #novaApp stays hidden until /health confirms readiness. Interface language defaults to English independently of reply language.
- Remove the splash node from the DOM after its transition; never leave an invisible full-screen overlay behind.
- Navigation requests are network-first and the service worker must never serve a stale cached index.html.
- Check every element's bounding box against innerWidth in Playwright at 360, 390, 412, 768 and 1280 CSS pixels.
