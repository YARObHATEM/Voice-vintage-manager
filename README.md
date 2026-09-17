# Vintage Voice HQ

The command center for shipping [Vintage Voice](https://github.com/YARObHATEM/vintage-voice) —
the voice recorder that sounds like it was made in 2002.

Content ideas, the launch checklist, the creator outreach pipeline and the
feature backlog, in one phone-sized app that works offline and keeps
everything on your own device.

---

## What is in it

**Pad** — a scratchpad pinned above every tab. It saves as you type, so a hook
that arrives on the bus lands somewhere before you lose it. No save button.

**Hooks** — quick capture for video concepts. Hook or visual idea, audio
element (ASMR click, tape hiss, re-dub comparison), target sound or vibe,
script, status and tags. Status moves Idea → Scripted → Filmed → Posted with
one tap from the list, and a meter at the top tracks the first ten videos.

**Plan** — the launch checklist, pre-filled with 28 steps across three phases:
App Store readiness (RevenueCat, privacy labels, `Info.plist`, screenshots),
the content engine (batching the first ten, profile branding) and outreach
(shortlists, DMs, subreddits). Add your own steps, delete the ones that do not
apply, watch the overall bar move.

**Creators** — a micro-influencer CRM sized for a phone. Handle, platform,
follower count, niche, pipeline status, agreed rate and the video link. The
budget panel splits the $200 into *spent* and *committed*, because an agreed
rate you have not paid yet is still gone as far as the next deal is concerned.

**Backlog** — everything that is not this week. User requests, device ideas
(Soviet spy recorder, Minidisc pack), filter tweaks and bugs, each with a
priority you can change from the card. Next Sprint floats to the top.

**Data** — export everything as JSON in one tap, import it back, see how much
is stored.

A search box in the header filters whichever tab you are on, and tells you how
many matches the other tabs are holding so nothing hides behind a tab you are
not looking at.

---

## Where the data lives

In `localStorage`, in your browser, under one key. There is no account, no
server and nothing to log into — which also means nothing to go down and
nothing to pay for.

The trade-off is that clearing site data clears the app. So:

- **Add it to your Home Screen.** On iPhone: open in Safari, Share, Add to Home
  Screen. iOS is far less likely to evict storage for an installed app, and it
  runs fullscreen with no browser chrome.
- **Export now and then.** Data → *Export everything as JSON*. The file is the
  complete state and imports straight back.

Two tabs open at once stay in sync, and the app writes on a debounce plus on
every backgrounding, so closing the tab mid-sentence does not lose the
sentence.

---

## Running it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static files in dist/
```

`dist/` is plain static output — drop it on Vercel, Netlify, GitHub Pages or
any web server. The build uses a relative base, so a subpath works without
configuration.

### Tests

```sh
npx playwright install chromium   # once, to fetch the browser
npm run build
npm test         # drives the built app in Chromium at iPhone size
SHOTS=1 npm test # also writes screenshots to tests/shots/
```

Playwright is pinned to an exact version rather than a range, because the
browser build it downloads is tied to that version — a floating range quietly
installs a Playwright whose browser is not on disk.

The suite is not unit tests. It walks the path a real first evening takes —
capture a hook, tick a roadmap step, add a creator, file a bug, search,
reload — and fails if anything does not survive the reload, because *nothing
is lost on reload* is the one promise this app makes.

### Icons

`npm run icons` redraws `public/icons/*.png` from `tools/make-icons.mjs`, which
writes the PNGs by hand rather than pulling in an image library to draw two
circles.

---

## How it is built

| | |
|---|---|
| Framework | React 19 + Vite, no router |
| Styling | Tailwind CSS v4, theme tokens in `src/index.css` |
| State | One JSON blob in `localStorage`, via `useSyncExternalStore` |
| Offline | A service worker that caches the shell; data never touches it |
| Bundle | ~82 KB gzipped |

```
src/
  App.jsx              header, search, tab switching
  lib/store.js         the entire state, and the only write path
  lib/seed.js          the 28 default roadmap steps
  lib/search.js        which fields each section searches
  lib/backup.js        export, import, clipboard
  components/          ui primitives, scratchpad, bottom nav
  views/               one file per tab
```

There is no router because five tabs in a phone-width column do not need URLs,
and skipping it keeps the app opening instantly from the Home Screen.

---

## Design

Dark, always. This is a thing you open at 1am to dump an idea, and a white
flash is the wrong way to start that. Zinc for the chassis, hairline seams
between panels, a warm amber for anything you can press, a green LED for done,
and monospace for anything that is data rather than prose — borrowed from the
hardware the app is about.
