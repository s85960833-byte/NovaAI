# NOVA AI — Android Manual Test Plan

> Manual device verification only. Playwright viewport coverage is not proof of camera, microphone, Android permissions, PWA installation or OEM WebView behavior. Record PASS/FAIL with device model, Android version, browser and date. Use synthetic content and an authorised test account only.

## Device record

| Field | Value |
|---|---|
| Device | Pixel 7 / other Android device: __________ |
| Android version | __________ |
| Browser / app container | Chrome / installed PWA / in-app WebView: __________ |
| NOVA build / Staging commit | __________ |
| Tester / date | __________ |

## Test cases

| ID | Test case | Steps | Expected result | PASS / FAIL |
|---|---|---|---|---|
| A01 | Full-screen portrait layout | Open the Staging URL in Chrome at portrait orientation; scroll the home screen and rotate once | Page uses full device width; no side-clipped half-screen layout or horizontal page overflow | ____ |
| A02 | Display cutouts and safe areas | Open page with status/navigation bars visible; inspect top and bottom controls | Header, dialogs and composer remain visible and do not overlap system bars | ____ |
| A03 | Learn workspace | Tap NOVA Learn, open one study mode, return using Back/Close | Learn workspace opens; controls are usable; back returns to home without losing existing chat data | ____ |
| A04 | Build workspace | Tap NOVA Build, open App & Website Builder, return home | Build workspace opens and its tools are visible; no Agents/Learn tools leak into the wrong workspace | ____ |
| A05 | Agents workspace | Tap NOVA Agents, open one agent mode and close it | Agents workspace opens; mode list and navigation work without layout overflow | ____ |
| A06 | Mobile navigation | Open the menu, select Learn/Build/Agents and use Android Back | Navigation responds once; drawer closes; no stuck overlay or hidden page | ____ |
| A07 | Settings drawer | Open Settings, change a harmless display option, close with Close and Android Back | Settings appears above the page, closes correctly and the setting persists after reload | ____ |
| A08 | Existing chats | Open a pre-existing local chat and scroll its messages | Old messages, titles and current-chat selection remain readable | ____ |
| A09 | Local storage compatibility | Use a test browser profile with a pre-upgrade nova localStorage backup; launch the new Staging UI | Legacy chats and memory are loaded; no storage reset or console exception | ____ |
| A10 | Camera permission — first request | Open Photo Solver; tap camera; grant Android camera permission only for this site | Camera starts after permission; no page crash; visible preview is aligned and correctly oriented | ____ |
| A11 | Camera permission — denial | Reset site permission in Android settings; retry Photo Solver; deny permission | Clear permission-denied message appears; gallery/file option remains available | ____ |
| A12 | Camera capture and cleanup | Capture a synthetic worksheet image; close Photo Solver and reopen it | Capture is usable; closing view stops camera indicator/stream; reopening does not reuse stale preview | ____ |
| A13 | Microphone permission — first request | Open Voice; grant microphone permission; speak a short non-sensitive test phrase | Permission is granted; microphone capture begins and the app responds or clearly reports service unavailable | ____ |
| A14 | Microphone permission — denial | Reset site microphone permission; reopen Voice; deny permission | Clear permission-denied message; ordinary text chat still works | ____ |
| A15 | Microphone stop/background | Start Voice, tap Stop or switch apps/lock screen, then return | Recording stops; no persistent microphone indicator; app recovers without reload | ____ |
| A16 | Network loss | Start a harmless chat, disable Wi-Fi/mobile data, then restore connection | User sees a recoverable network error; app remains responsive; retry does not duplicate the user message unexpectedly | ____ |
| A17 | PWA / standalone mode | Install NOVA from Chrome menu, launch from home screen, navigate Learn/Build/Agents | Standalone launch renders full width; core assets load; navigation remains functional | ____ |

## Evidence to retain

- Screenshots for A01–A09 and A17.
- Short screen recording for camera and microphone permission flows A10–A15, avoiding faces, private conversations or personal documents.
- Android permission screen state and Chrome site settings (hide account identifiers).
- Browser console errors, if any, with tokens, email addresses and user content redacted.

Physical Android PASS condition: Every applicable test above passes on the named device. A Playwright pass alone does not change this manual checklist status.
