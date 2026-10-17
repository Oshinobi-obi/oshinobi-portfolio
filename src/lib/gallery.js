// Project gallery: a 3D coverflow carousel (CSS 3D, so screenshots stay
// crisp) with project + category filters, drag/swipe, keyboard control, and
// a lightbox. Media is discovered automatically from src/assets/gallery/:
//
//   gallery/<project>/<file>                    plain screenshots
//   gallery/<project>/<category>/<file>         screenshots grouped by flow
//   gallery/<project>/gifs/<category>.gif       animated demo for that flow
//
// Demos (GIF, MP4 or WebM) live in a `gifs/` (or `demos/`) folder and are
// matched to a category by file name. Only slides near the front load their
// media, so big GIFs don't all download at once.
import { profile } from '../data/profile.js';
import { env } from './env.js';
import { esc } from './util.js';
import { revealBatch } from './reveal.js';

const files = import.meta.glob('../assets/gallery/**/*.{png,jpg,jpeg,webp,avif,gif,mp4,webm,PNG,JPG,JPEG,WEBP,GIF,MP4}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const DEMO_FOLDERS = ['gifs', 'demos', 'videos'];
const ACRONYMS = ['nsef', 'ams', 'dtr', 'ui', 'api', 'qr', 'pdf', 'rfid', 'ble', 'gps', 'cto', 'ris', 'rsmi', 'splv', 'sphv', 'cse'];
// "All" shows at most this many slides per project, so one big project
// doesn't drown the rest. Pick a project chip to see everything.
const ALL_PER_PROJECT = 4;

const ARROW_L = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARROW_R = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CLOSE = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const PLAY = `<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>`;

/** "admin-verify-nsef-team" → "Admin verify NSEF team" */
function humanize(name) {
  const words = name.replace(/\.[^.]+$/, '').replace(/^[\d\s._-]+/, '').split(/[-_\s]+/).filter(Boolean);
  const out = words
    .map((w) => (ACRONYMS.includes(w.toLowerCase()) ? w.toUpperCase() : w.toLowerCase()))
    .join(' ')
    .replace(/\bapp CSE\b/i, 'APP-CSE')
    .replace(/\bappcse\b/i, 'APP-CSE')
    .replace(/\bwhats\b/i, "what's")
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi, (m) => m[0].toUpperCase() + m.slice(1));
  return out ? out[0].toUpperCase() + out.slice(1) : '';
}

const isVideo = (file) => /\.(mp4|webm)$/i.test(file);
const isAnimated = (file) => /\.(gif|mp4|webm)$/i.test(file);
const stripNumber = (name) => name.replace(/\.[^.]+$/, '').replace(/^[\d\s._-]+/, '').toLowerCase();

/** Group discovered files into { [project]: { root: [], categories: Map, demos: Map } }. */
function scan() {
  const collator = new Intl.Collator(undefined, { numeric: true });
  const byProject = {};
  for (const [path, url] of Object.entries(files)) {
    const parts = path.split('/gallery/')[1].split('/');
    const [project, ...rest] = parts;
    const p = (byProject[project] ||= { root: [], categories: new Map(), demos: new Map() });
    const file = rest[rest.length - 1];
    const item = { file, url, video: isVideo(file) };
    if (rest.length === 1) p.root.push(item);
    else if (DEMO_FOLDERS.includes(rest[0].toLowerCase())) p.demos.set(file.replace(/\.[^.]+$/, ''), item);
    else {
      if (!p.categories.has(rest[0])) p.categories.set(rest[0], []);
      p.categories.get(rest[0]).push(item);
    }
  }
  for (const p of Object.values(byProject)) {
    p.root.sort((a, b) => collator.compare(a.file, b.file));
    p.categories.forEach((list) => list.sort((a, b) => collator.compare(a.file, b.file)));
    // A GIF/video inside a flow folder is that flow's demo (preferring the one
    // named after the folder), unless gifs/ already supplied one.
    p.categories.forEach((list, name) => {
      const animated = list.filter((i) => isAnimated(i.file));
      if (!animated.length || p.demos.has(name)) return;
      const demo = animated.find((i) => stripNumber(i.file) === stripNumber(name)) || animated[0];
      list.splice(list.indexOf(demo), 1);
      p.demos.set(name, demo);
    });
    // Unconfigured flow folders show in name order (01-…, 02-…).
    p.categories = new Map([...p.categories.entries()].sort(([a], [b]) => collator.compare(a, b)));
  }
  return byProject;
}

/** Build each project's ordered categories (config order first, then any extra folders). */
function buildModel() {
  const found = scan();
  return profile.gallery.map((project) => {
    const f = found[project.folder] || { root: [], categories: new Map(), demos: new Map() };
    const configured = project.categories || [];
    // Categories are screenshot subfolders (plus configured flows that only have a demo).
    const names = [
      ...configured.map((c) => c.folder).filter((n) => f.categories.has(n) || f.demos.has(n)),
      ...[...f.categories.keys()].filter((n) => !configured.some((c) => c.folder === n)),
    ].filter((n, i, arr) => arr.indexOf(n) === i);

    // Demos that don't match any category stand alone as overview slides.
    const collator = new Intl.Collator(undefined, { numeric: true });
    const looseDemos = [...f.demos.entries()]
      .filter(([name]) => !names.includes(name))
      .sort(([a], [b]) => collator.compare(a, b))
      .map(([, item]) => ({
        ...item,
        isDemo: true,
        caption: project.captions?.[`gifs/${item.file}`] || humanize(item.file),
      }));

    const categories = names.map((name) => {
      const cfg = configured.find((c) => c.folder === name) || {};
      const category = { folder: name, label: cfg.label || humanize(name), role: cfg.role || '' };
      const steps = (f.categories.get(name) || []).map((item, i, all) => ({
        ...item,
        caption: project.captions?.[`${name}/${item.file}`] || humanize(item.file) || `Step ${i + 1} of ${all.length}`,
      }));
      const demo = f.demos.get(name);
      category.demo = demo ? { ...demo, caption: 'Live demo', isDemo: true } : null;
      category.steps = steps;
      return category;
    });

    const root = f.root.map((item) => ({ ...item, caption: project.captions?.[item.file] || humanize(item.file) }));
    return { ...project, root, categories, looseDemos };
  });
}

function slidesFor(model, projectFolder, categoryFolder) {
  const out = [];
  const hasMedia = (p) => p.categories.length > 0 || p.root.length > 0 || p.looseDemos.length > 0;
  const projects =
    projectFolder === 'all'
      ? [...model.filter(hasMedia), ...model.filter((p) => !hasMedia(p))] // real screenshots first
      : model.filter((p) => p.folder === projectFolder);
  for (const project of projects) {
    const start = out.length;
    const cats = project.categories;
    if (categoryFolder && categoryFolder !== 'overview') {
      const c = cats.find((x) => x.folder === categoryFolder);
      if (c) {
        if (c.demo) out.push({ project, category: c, ...c.demo });
        c.steps.forEach((s) => out.push({ project, category: c, ...s }));
      }
      continue;
    }
    // Overview: standalone demos first, then one cover per category
    // (its demo, or its first screenshot).
    project.looseDemos.forEach((d) => out.push({ project, category: null, ...d }));
    for (const c of cats) {
      const cover = c.demo || c.steps[0];
      if (cover) out.push({ project, category: c, ...cover, cover: true, caption: c.demo ? 'Live demo' : cover.caption });
    }
    project.root.forEach((s) => out.push({ project, category: null, ...s }));
    if (!hasMedia(project)) out.push({ project, category: null, placeholder: true });
    if (projectFolder === 'all') out.splice(start + ALL_PER_PROJECT);
  }
  return out;
}

export function initGallery() {
  const root = document.querySelector('[data-gallery]');
  if (!root || !profile.gallery?.length) return;

  const model = buildModel();
  let project = 'all';
  let category = 'overview';
  let slides = [];
  let active = 0;

  root.insertAdjacentHTML(
    'beforeend',
    `
    <div class="gallery">
      <div class="gallery__filters" role="group" aria-label="Filter by project" data-reveal>
        <button class="gchip is-active" data-filter="all" aria-pressed="true">All</button>
        ${model
          .map((p) => `<button class="gchip" data-filter="${esc(p.folder)}" aria-pressed="false">${esc(p.title)}</button>`)
          .join('')}
      </div>
      <div class="gallery__subfilters" role="group" aria-label="Filter by feature" data-subfilters hidden></div>
      <div class="gallery__stage" aria-roledescription="carousel" aria-label="Project screenshots">
        <div class="gallery__track" data-track></div>
        <div class="gallery__floor" aria-hidden="true"></div>
      </div>
      <div class="gallery__controls">
        <button class="gnav" data-prev aria-label="Previous slide">${ARROW_L}</button>
        <div class="gallery__caption" aria-live="polite" data-caption></div>
        <button class="gnav" data-next aria-label="Next slide">${ARROW_R}</button>
      </div>
      <div class="gallery__dots" data-dots aria-hidden="true"></div>
    </div>
    <dialog class="lightbox" aria-label="Screenshot viewer">
      <button class="lightbox__close" data-close aria-label="Close viewer">${CLOSE}</button>
      <button class="gnav lightbox__prev" data-lb-prev aria-label="Previous slide">${ARROW_L}</button>
      <figure class="lightbox__figure">
        <img alt="" data-lb-img />
        <video data-lb-video muted loop playsinline controls hidden></video>
        <figcaption data-lb-caption></figcaption>
      </figure>
      <button class="gnav lightbox__next" data-lb-next aria-label="Next slide">${ARROW_R}</button>
    </dialog>`
  );

  const stage = root.querySelector('.gallery__stage');
  const track = root.querySelector('[data-track]');
  const subfilters = root.querySelector('[data-subfilters]');
  const caption = root.querySelector('[data-caption]');
  const dots = root.querySelector('[data-dots]');
  const dialog = root.querySelector('.lightbox');
  const lbImg = dialog.querySelector('[data-lb-img]');
  const lbVideo = dialog.querySelector('[data-lb-video]');
  const lbCaption = dialog.querySelector('[data-lb-caption]');

  const where = (s) => (s.category ? `${s.category.role ? `${s.category.role} · ` : ''}${s.category.label}` : '');
  const labelOf = (s) =>
    s.placeholder ? `${s.project.title} — screenshots coming soon` : [s.project.title, where(s), s.caption].filter(Boolean).join(': ');

  function slideHTML(s, i) {
    let media;
    if (s.placeholder) {
      media = `<div class="gslide__placeholder">
           <div class="gslide__skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
           <p>Screenshots coming soon</p>
           ${import.meta.env.DEV ? `<code>src/assets/gallery/${esc(s.project.folder)}/</code>` : ''}
         </div>`;
    } else if (s.video) {
      media = `<video data-src="${esc(s.url)}" muted loop playsinline preload="none" aria-label="${esc(labelOf(s))}"></video>`;
    } else {
      media = `<img data-src="${esc(s.url)}" alt="${esc(labelOf(s))}" decoding="async" draggable="false" />`;
    }
    const barText = s.category ? `${s.project.title} › ${s.category.label}` : s.project.title;
    return `
      <button class="gslide${s.placeholder ? ' gslide--placeholder' : ''}" data-i="${i}" aria-label="${esc(labelOf(s))}" tabindex="-1">
        <div class="gslide__frame" data-gframe>
          <div class="gslide__bar" aria-hidden="true">
            <i></i><i></i><i></i>
            <span>${esc(barText)}</span>
          </div>
          <div class="gslide__media">
            ${media}
            ${s.isDemo ? `<span class="gslide__badge">${PLAY} Live demo</span>` : ''}
          </div>
          <div class="gslide__shine" aria-hidden="true"></div>
        </div>
      </button>`;
  }

  function renderSubfilters() {
    const p = model.find((x) => x.folder === project);
    const cats = p?.categories || [];
    // Show the flow row when there's more than one thing to switch between.
    subfilters.hidden = cats.length + (p?.looseDemos.length ? 1 : 0) < 2;
    root.querySelector('.gallery').classList.toggle('has-sub', !subfilters.hidden);
    if (subfilters.hidden) return;
    const chip = (folder, label) =>
      `<button class="gchip gchip--sub${category === folder ? ' is-active' : ''}" data-category="${esc(folder)}" aria-pressed="${category === folder}">${esc(label)}</button>`;
    // Consecutive flows with the same tag share one group label.
    const groups = [];
    for (const c of cats) {
      const last = groups[groups.length - 1];
      if (last && last.role === c.role) last.items.push(c);
      else groups.push({ role: c.role, items: [c] });
    }
    subfilters.innerHTML =
      chip('overview', 'Overview') +
      groups
        .map((g) =>
          g.role
            ? `<span class="gsub-group" role="group" aria-label="${esc(g.role)}"><small>${esc(g.role)}</small>${g.items.map((c) => chip(c.folder, c.label)).join('')}</span>`
            : g.items.map((c) => chip(c.folder, c.label)).join('')
        )
        .join('');
  }

  function render() {
    slides = slidesFor(model, project, category);
    active = Math.min(active, Math.max(0, slides.length - 1));
    renderSubfilters();
    // Slides shrink by the flow row's real height so everything fits on screen.
    root.querySelector('.gallery').style.setProperty('--sub-h', `${subfilters.hidden ? 0 : subfilters.offsetHeight}px`);
    track.innerHTML = slides.map(slideHTML).join('');
    dots.innerHTML = slides.map((_, i) => `<span data-dot="${i}"></span>`).join('');
    dots.hidden = slides.length > 24;
    layout();
    revealBatch(track.querySelectorAll('[data-gframe]'), {
      opacity: 0,
      y: 60,
      z: -260,
      rotationX: -25,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.06,
    });
  }

  /** Load media only for slides near the front; play/pause videos. */
  function hydrate(el, distance) {
    const media = el.querySelector('[data-src]');
    if (media && distance <= 2 && !media.getAttribute('src')) media.src = media.dataset.src;
    if (media?.tagName === 'VIDEO') {
      if (distance === 0 && !env.reducedMotion) media.play?.().catch(() => {});
      else media.pause?.();
    }
  }

  /** Position every slide around the active one (coverflow). */
  function layout() {
    const w = track.firstElementChild?.offsetWidth || 600;
    const small = window.innerWidth < 640;
    const spacing = w * (small ? 0.62 : 0.5);
    const calm = env.reducedMotion;

    [...track.children].forEach((el, i) => {
      const d = i - active;
      const ad = Math.abs(d);
      const visible = ad <= (small ? 1 : 3);
      el.style.setProperty('--x', `${d * spacing + (ad ? Math.sign(d) * w * 0.12 : 0)}px`);
      el.style.setProperty('--z', `${calm ? -ad * 60 : -ad * 220}px`);
      el.style.setProperty('--ry', `${calm ? 0 : -Math.sign(d) * Math.min(ad, 1) * 42}deg`);
      el.style.setProperty('--o', visible ? String(ad ? Math.max(0.35, 1 - ad * 0.22) : 1) : '0');
      el.style.zIndex = String(100 - ad);
      el.classList.toggle('is-active', d === 0);
      el.classList.toggle('is-hidden', !visible);
      el.tabIndex = d === 0 ? 0 : -1;
      el.setAttribute('aria-current', d === 0 ? 'true' : 'false');
      hydrate(el, ad);
    });

    const s = slides[active];
    if (s) {
      const steps = s.category?.steps.length || 0;
      const openFlow =
        s.cover && steps
          ? ` · <button class="gallery__flow-link" data-open-category="${esc(s.category.folder)}" data-project="${esc(s.project.folder)}">View all ${steps} screenshots →</button>`
          : '';
      caption.innerHTML = `
        <strong>${esc(s.project.title)}</strong>
        <span>${s.placeholder ? esc(s.project.subtitle) : esc([where(s), s.caption].filter(Boolean).join(' — '))}</span>
        <small>${active + 1} / ${slides.length}${openFlow}${
          s.project.repo
            ? ` · <a href="https://github.com/${esc(s.project.repo)}" target="_blank" rel="noopener">Repo ↗</a>`
            : ''
        }</small>`;
    }
    dots.querySelectorAll('[data-dot]').forEach((dot, i) => dot.classList.toggle('is-active', i === active));
    root.querySelector('[data-prev]').disabled = active === 0;
    root.querySelector('[data-next]').disabled = active >= slides.length - 1;
  }

  function go(i, focus = false) {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    if (next === active) return;
    active = next;
    layout();
    if (focus) track.children[active]?.focus({ preventScroll: true });
    if (dialog.open) showInLightbox();
  }

  function setFilter(p, c = 'overview') {
    project = p;
    category = c;
    active = 0;
    root.querySelectorAll('[data-filter]').forEach((b) => {
      const on = b.dataset.filter === p;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    render();
    // Keep the chosen chips visible in the swipeable rows on phones.
    for (const row of [root.querySelector('.gallery__filters'), subfilters]) {
      const chip = row.querySelector('.is-active');
      if (chip && row.scrollWidth > row.clientWidth) {
        row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
      }
    }
  }

  // ── Lightbox ──
  function showInLightbox() {
    const s = slides[active];
    if (!s || s.placeholder) return dialog.open && dialog.close();
    lbImg.hidden = !!s.video;
    lbVideo.hidden = !s.video;
    if (s.video) {
      lbImg.removeAttribute('src');
      lbVideo.src = s.url;
      lbVideo.play().catch(() => {});
    } else {
      lbVideo.pause();
      lbVideo.removeAttribute('src');
      lbImg.src = s.url;
      lbImg.alt = labelOf(s);
    }
    lbCaption.innerHTML = `<strong>${esc(s.project.title)}</strong> — ${esc([where(s), s.caption].filter(Boolean).join(' — '))} <small>${active + 1} / ${slides.length}</small>`;
    dialog.querySelector('[data-lb-prev]').disabled = active === 0;
    dialog.querySelector('[data-lb-next]').disabled = active >= slides.length - 1;
  }
  function openLightbox() {
    if (slides[active]?.placeholder || typeof dialog.showModal !== 'function') return;
    showInLightbox();
    dialog.showModal();
  }
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    if (e.target.closest('[data-lb-prev]')) go(active - 1);
    if (e.target.closest('[data-lb-next]')) go(active + 1);
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(active - 1);
    if (e.key === 'ArrowRight') go(active + 1);
  });
  dialog.addEventListener('close', () => {
    lbVideo.pause();
    track.children[active]?.focus({ preventScroll: true });
  });

  // ── Controls ──
  root.querySelector('[data-prev]').addEventListener('click', () => go(active - 1));
  root.querySelector('[data-next]').addEventListener('click', () => go(active + 1));
  root.querySelector('.gallery__filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (b) setFilter(b.dataset.filter);
  });
  subfilters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-category]');
    if (b) setFilter(project, b.dataset.category);
  });
  caption.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-category]');
    if (b) setFilter(b.dataset.project, b.dataset.openCategory);
  });
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') (e.preventDefault(), go(active - 1, true));
    if (e.key === 'ArrowRight') (e.preventDefault(), go(active + 1, true));
    if (e.key === 'Home') (e.preventDefault(), go(0, true));
    if (e.key === 'End') (e.preventDefault(), go(slides.length - 1, true));
  });

  // Click a side slide to bring it forward; click the front one to enlarge.
  let dragged = false;
  track.addEventListener('click', (e) => {
    const el = e.target.closest('.gslide');
    if (!el || dragged) return;
    const i = Number(el.dataset.i);
    i === active ? openLightbox() : go(i);
  });

  // Drag / swipe
  let startX = null;
  stage.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    dragged = false;
  });
  stage.addEventListener('pointermove', (e) => {
    if (startX !== null && Math.abs(e.clientX - startX) > 8) dragged = true;
    tiltActive(e);
  });
  const endDrag = (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(active - Math.sign(dx));
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', () => (startX = null));
  stage.addEventListener('pointerleave', (e) => {
    endDrag(e);
    resetTilt();
  });

  // Front slide leans toward the mouse, with a moving light sheen.
  function tiltActive(e) {
    if (env.reducedMotion || e.pointerType !== 'mouse') return;
    const el = track.children[active];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return resetTilt();
    el.style.setProperty('--tx', `${(0.5 - py) * 10}deg`);
    el.style.setProperty('--ty', `${(px - 0.5) * 14}deg`);
    el.style.setProperty('--sx', `${px * 100}%`);
    el.classList.add('is-tilting');
  }
  function resetTilt() {
    [...track.children].forEach((el) => {
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
      el.classList.remove('is-tilting');
    });
  }

  // "Screenshots" buttons on featured project cards jump here, pre-filtered.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-gallery-link]');
    if (link) setFilter(link.dataset.galleryLink);
  });

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      root.querySelector('.gallery').style.setProperty('--sub-h', `${subfilters.hidden ? 0 : subfilters.offsetHeight}px`);
      layout();
    });
  });

  render();
}
