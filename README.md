# MADE IN COLLABORATION WITH LSSGD
# Content Helper Community — Website

Gold liquid-chrome cinematic hero (Three.js) + animated content sections.

## Structure
```
chc-site/
├─ index.html              # markup, meta/OG, importmap
├─ css/styles.css          # styles (gold/black tokens, animations)
├─ js/main.js              # 3D hero + creators render + scroll/count-up
├─ vercel.json             # static config (clean URLs)
└─ assets/
   ├─ anton.js             # Anton display font (3D-ready, baked)
   ├─ chc-logo.webp        # animated logo (5 MB GIF → 76 KB)
   ├─ chc-logo.png         # static logo (OG / apple-touch)
   ├─ favicon.png
   ├─ MUSIC.txt            # how to add background music
   └─ creators/            # drop creator PFPs here (see README.txt)
```

## Edit the creators (subs / links / PFPs)
Open `js/main.js` → `CREATORS` array near the bottom:
```js
{ name:'ZND', subs:'1.2M', url:'https://youtube.com/@znd' }
```
- `subs` shows next to the name (leave `'—'` to show "YouTube")
- Drop a PFP at `assets/creators/<slug>.webp` (e.g. `skyfly-facts.webp`) — auto monogram fallback if missing.

## Background music
Player is wired to `assets/music.mp3`. Drop your **no-vocals** track there (provide your own licensed file). Toggle = bottom-right button.

## Other quick edits
- Hero 3D words → `LINES` in `js/main.js`
- Marker scribble → `#m1`/`#m2` in `index.html`
- Stats / copy → `index.html`
- Brand colors → `:root` in `css/styles.css`

## Deploy to Vercel (git)
```
git remote add origin <your-repo-url>
git push -u origin main
```
Then import the repo on vercel.com → it deploys automatically (no build step, static).

## Run locally
```
python3 -m http.server 8080   # http://localhost:8080
```

## Notes
- Three.js + Google Fonts load from CDN. Anton 3D font is bundled.
