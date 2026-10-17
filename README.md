# Oshinobi Portfolio

A dark, neon-accented personal portfolio with real-time 3D, built with **Vite + vanilla JS**, **Three.js**, and **GSAP ScrollTrigger**. It builds to a static site, so you can deploy it to GitHub Pages, Vercel, or Netlify.

## Features

- **Hero:** a full-screen Three.js scene. A low-poly crystal with a wireframe shell, orbit rings, and floating code cubes sits inside a two-layer particle field that moves with the mouse (parallax).
- **Neon bloom:** a post-processing glow (UnrealBloomPass) makes the hero's edges and particles bleed light. To change how strong it is, edit `BLOOM_DESKTOP` and `BLOOM_MOBILE` at the top of `src/scenes/hero.js`.
- **Crystal → globe morph:** as you scroll, the hero crystal breaks into about 5,000 particles (about 2,200 on phones). They swirl down the page and re-form as the wireframe globe in Languages & Tech, which then fades in its language tags. The effect runs on a fixed overlay canvas that ignores clicks, and it only renders while the particles are moving. It's turned off for reduced motion.
- **About:** a 3D tilt card with a light-follow glare and layers at different `translateZ` depths.
- **Languages & Tech:** live GitHub data shown as an interactive **3D tag sphere**. You can drag it to spin (it has inertia) and hover a tag to see bytes and percent. An accessible percentage list with bars sits beside it.
- **Featured Projects:** hand-written cards that tilt in 3D with glare and depth layers. They flip in with perspective as you scroll.
- **Project Gallery:** a 3D coverflow carousel of project screenshots. Use drag, swipe, the arrow keys or the arrow buttons to move through it. Filter chips show one project at a time. The front slide leans toward the mouse with a light sheen, and clicking it opens a lightbox.
- **All Public Repos:** a grid filled from the GitHub API. Forks are hidden and repos are sorted by most recently updated.
- **Performance:** Three.js is code-split and lazy-loaded. Scenes pause when they scroll off-screen or the tab is hidden.
- **Accessibility and fallbacks:**
  - Honors `prefers-reduced-motion`: 3D scenes draw one still frame and reveal animations and tilt are turned off.
  - Without WebGL, the hero shows a CSS gradient orb and the language sphere becomes a CSS tag cloud.
  - Responsive down to 375px phones. Includes a skip link, focus styles, and `aria-live` regions.
- **Cursor glow:** a soft glow follows the mouse. It only appears on devices with a fine pointer.

## Project structure

```
├── index.html               # Page shell (section containers)
├── public/favicon.svg
├── src/
│   ├── assets/gallery/      # ← Drop project screenshots here (one folder per project)
│   ├── data/
│   │   ├── profile.js       # ← ALL your personal content lives here
│   │   └── languageColors.js
│   ├── lib/
│   │   ├── env.js           # WebGL / reduced-motion / pointer detection
│   │   ├── github.js        # GitHub API + 1-hour localStorage cache
│   │   ├── lazyScene.js     # Lazy-load + pause-when-offscreen for 3D scenes
│   │   ├── morphState.js    # Shared scroll-morph progress
│   │   ├── reveal.js        # GSAP scroll reveals
│   │   ├── tilt.js          # 3D tilt + glare cards
│   │   ├── cursor.js        # Cursor glow
│   │   ├── gallery.js       # 3D coverflow gallery + lightbox
│   │   └── util.js
│   ├── scenes/
│   │   ├── base.js          # Shared renderer/camera/loop
│   │   ├── shared.js        # Crystal/globe shapes + camera constants
│   │   ├── hero.js          # Crystal + particle field + bloom
│   │   ├── morph.js         # Scroll-driven crystal → globe particle morph
│   │   └── languages.js     # 3D tag sphere
│   ├── styles/main.css
│   ├── render.js            # Builds section markup from profile.js
│   └── main.js              # Entry point
└── vite.config.js
```

## Editing your content

Everything personal is in **`src/data/profile.js`**: name, tagline, bio, facts, tools, featured projects, contact links, and footer text. You don't need to touch any component.

- **Contact placeholders:** replace `[EMAIL]`, `[LINKEDIN]`, and `[FACEBOOK]`. For each one, set its `href` and remove `placeholder: true`. Placeholder cards are styled with a dashed yellow border so you can spot them.
- **Photo:** put an image in `public/` (for example `public/me.jpg`) and set `photo: 'me.jpg'`.
- **Projects:** each entry has `title`, `kicker`, `description`, `stack`, `repo` (`owner/name`, or `''` to hide the code link), and `highlight`.
- **Hidden repos:** the `hiddenRepos` list keeps repos out of the grid. By default it hides the profile README repo `Oshinobi-obi`.

### Adding gallery screenshots

There's one folder per project:

| Folder | Project |
| --- | --- |
| `src/assets/gallery/ams-shopee/` | AMS StockWatch (office requisition portal) |
| `src/assets/gallery/ams-admin/` | AMS StockWatch Admin |
| `src/assets/gallery/dat2dtr/` | Dat2DTR |
| `src/assets/gallery/stemhub/` | STEM Education Training Hub |
| `src/assets/gallery/stemhub-trainee/` | STEM Hub Trainee Portal |

1. Drop `.png`, `.jpg`, `.webp`, `.avif` or `.gif` files into the right folder. You don't need to change any code: the gallery finds them automatically.
2. Number the files to set their order, and use the rest of the name as the caption. For example, `01-dashboard.png` and `02-requisition-cart.png` become "Dashboard" and "Requisition cart".
3. To give a screenshot a longer caption, add it under that project's `captions` in `profile.js`, keyed by file name.
4. A folder with no images shows a "Screenshots coming soon" slide.
5. To add a new project to the gallery, add an entry to `gallery` in `profile.js` and create a folder with the same `folder` name.

#### Splitting a project into feature flows (like STEM Hub)

For a bigger project, put each flow in its own subfolder. Put an animated demo for each flow in a `gifs/` folder, named exactly like the flow's subfolder:

```
src/assets/gallery/stemhub/
├── participant-account-and-registration/  001.jpg, 002.jpg, …
├── admin-verify-nsef-team/                 001.jpg, …
└── gifs/
    ├── participant-account-and-registration.gif
    └── admin-verify-nsef-team.gif
```

Here's how the gallery uses that layout:

- **Project chip:** picking the project opens a second row of chips, one per flow.
- **Overview:** shows one animated demo per flow. Its caption has a "View all N steps →" link.
- **Picking a flow:** shows that flow's live demo first, then its screenshots captioned "Step 1 of N".
- **Labels and order:** set them under that project's `categories` in `profile.js` (`folder`, `label`, `role`). Folders you don't list are still shown, with names generated from the folder name.
- **Demo formats:** `.mp4` and `.webm` work as demos too, and they're usually about 10× smaller than GIFs. The gallery autoplays them muted and on a loop.
- **Loading:** only the slides closest to the front load their media, so large GIFs don't all download at once.

Tips:

- Take screenshots at around 1280×800 or 1600×1000. Slides use a 16:10 frame and crop from the top, so put the important part of the page at the top.
- Keep each image under about 500 KB. Exporting as `.webp` helps.
- Blur or remove any real names, employee IDs or other personal data before uploading. This matters especially for DTR and DepEd records.

## Local development

You need Node.js 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

To preview the fallbacks without changing your OS settings, add one of these to the URL:

- `?reducedmotion` forces reduced-motion mode.
- `?nowebgl` forces the no-WebGL fallback.

## GitHub API notes

- Unauthenticated requests are limited to **60 per hour per visitor IP**. One page load makes one request for the repo list plus one per repo for languages (about 14 today).
- Responses are cached in `localStorage` for **1 hour**. If a later request fails, the stale cache is used instead.
- If the per-repo language calls are rate-limited, the site estimates percentages from each repo's primary language and size. It marks the list as approximate and doesn't cache the estimate.
- Forked repos are excluded from both the language stats and the repo grid.

## Build

```bash
npm run build
```

```bash
npm run preview
```

The output goes to `dist/`. `vite.config.js` uses `base: './'`, so the same build works from a domain root or a sub-path.

## Deploy

### GitHub Pages

1. Push this project to a GitHub repo, for example `Oshinobi-obi/portfolio`.
2. Add `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. In the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.
4. If you want the site at `https://oshinobi-obi.github.io/`, name the repo `Oshinobi-obi.github.io`.

### Vercel

Import the repo at vercel.com/new. It detects Vite automatically: the build command is `npm run build` and the output directory is `dist`.

### Netlify

Use **Add new site → Import from Git** with build command `npm run build` and publish directory `dist`. Or drag the `dist/` folder onto app.netlify.com/drop.

## Tech

[Vite](https://vitejs.dev) · [Three.js](https://threejs.org) · [GSAP + ScrollTrigger](https://gsap.com) · Space Grotesk, Inter, and JetBrains Mono from Google Fonts.

© 2026 Oshinobi
