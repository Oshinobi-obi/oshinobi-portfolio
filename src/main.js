import './styles/main.css';
import { profile } from './data/profile.js';
import { langColor } from './data/languageColors.js';
import { renderAll } from './render.js';
import { env, onReducedMotionChange } from './lib/env.js';
import { esc, timeAgo, fmtPct } from './lib/util.js';
import { initCursorGlow } from './lib/cursor.js';
import { initTilt } from './lib/tilt.js';
import { initGallery } from './lib/gallery.js';
import { initReveals, revealBatch, refreshScroll } from './lib/reveal.js';
import { lazyScene } from './lib/lazyScene.js';
import { getRepos, getLanguageStats } from './lib/github.js';

const root = document.documentElement;
root.classList.add(env.webgl ? 'webgl' : 'no-webgl');
root.classList.toggle('reduced-motion', env.reducedMotion);
onReducedMotionChange(() => root.classList.toggle('reduced-motion', env.reducedMotion));

renderAll();
initNav();
initCursorGlow();
initTilt();
initGallery();
initReveals();

const reposPromise = getRepos(profile.githubUser, profile.hiddenRepos);
const langsPromise = reposPromise.then((repos) => getLanguageStats(profile.githubUser, repos));
langsPromise.catch(() => {});

reposPromise.then(renderRepos, renderRepoError);
langsPromise.then(renderLangList, renderLangError);

if (env.webgl) {
  lazyScene(document.querySelector('[data-scene="hero"]'), () => import('./scenes/hero.js'));
  lazyScene(document.querySelector('[data-scene="languages"]'), () => import('./scenes/languages.js'), {
    data: langsPromise,
    tooltip: document.querySelector('.tech__tooltip'),
  });
}

if (env.webgl && !env.reducedMotion) {
  const startMorph = () =>
    import('./scenes/morph.js')
      .then((m) =>
        m.createMorph({
          heroEl: document.querySelector('.hero'),
          sphereEl: document.querySelector('.tech__sphere'),
          canvasEl: document.querySelector('[data-scene="languages"]'),
        })
      )
      .catch((err) => console.warn('[morph] disabled', err));
  if ('requestIdleCallback' in window) requestIdleCallback(startMorph, { timeout: 2000 });
  else setTimeout(startMorph, 800);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[aria-disabled="true"]');
  if (a) e.preventDefault();
});

function renderLangList({ languages, approximate }) {
  const list = document.querySelector('[data-lang-list]');
  const top = languages.slice(0, 10);
  const rest = languages.slice(10);
  const otherPct = rest.reduce((a, l) => a + l.percent, 0);
  const rows = [...top];
  if (rest.length) rows.push({ name: `Other (${rest.length})`, percent: otherPct, other: true });

  list.innerHTML = `
    <ul class="langs" aria-label="Languages by share of code">
      ${rows
        .map(
          (l) => `
        <li class="lang" data-reveal-lang>
          <span class="lang__name"><i style="--c:${l.other ? '#8b93b8' : langColor(l.name)}"></i>${esc(l.name)}</span>
          <span class="lang__pct">${fmtPct(l.percent)}</span>
          <span class="lang__bar" aria-hidden="true"><span style="--w:${Math.max(l.percent, 0.6)}%; --c:${l.other ? '#8b93b8' : langColor(l.name)}"></span></span>
        </li>`
        )
        .join('')}
    </ul>
    ${approximate ? `<p class="muted small">Some per-repo data was rate-limited; percentages are approximate.</p>` : ''}`;

  if (!env.webgl) {
    const max = languages[0].percent;
    document.querySelector('[data-scene="languages"]').innerHTML = `
      <div class="tag-cloud">${languages
        .slice(0, 14)
        .map(
          (l) =>
            `<span style="--c:${langColor(l.name)}; font-size:${(0.8 + Math.sqrt(l.percent / max) * 0.9).toFixed(2)}rem"><i></i>${esc(l.name)}</span>`
        )
        .join('')}</div>`;
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        list.classList.add('is-visible');
        io.disconnect();
      }
    },
    { threshold: 0.2 }
  );
  io.observe(list);
  revealBatch('[data-reveal-lang]', { x: -24, y: 0, opacity: 0, duration: 0.6 });
  refreshScroll();
}

function renderLangError(err) {
  document.querySelector('[data-lang-list]').innerHTML = `
    <p class="notice">Couldn't load language stats from GitHub. ${esc(err?.message || '')}</p>`;
}

function renderRepos(repos) {
  const grid = document.querySelector('[data-repo-grid]');
  if (!repos.length) {
    grid.innerHTML = `<p class="muted">No public repositories yet.</p>`;
    return;
  }
  grid.innerHTML = repos
    .map(
      (r) => `
      <a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener" data-reveal-repo>
        <div class="repo__top">
          <svg class="repo__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>
          <h3 class="repo__name">${esc(r.name)}</h3>
          ${r.archived ? '<span class="repo__badge">archived</span>' : ''}
        </div>
        <p class="repo__desc">${r.description ? esc(r.description) : '<span class="muted">No description provided.</span>'}</p>
        <div class="repo__meta">
          <span class="repo__lang">${
            r.language ? `<i style="--c:${langColor(r.language)}"></i>${esc(r.language)}` : '<span class="muted">—</span>'
          }</span>
          <span title="Stars">★ ${r.stargazers_count}</span>
          <span title="${esc(new Date(r.pushed_at || r.updated_at).toLocaleString())}">Updated ${timeAgo(r.pushed_at || r.updated_at)}</span>
        </div>
      </a>`
    )
    .join('');
  revealBatch('[data-reveal-repo]', { y: 40, opacity: 0, duration: 0.7 });
  refreshScroll();
}

function renderRepoError(err) {
  document.querySelector('[data-repo-grid]').innerHTML = `
    <p class="notice">Couldn't load repositories from GitHub. ${esc(err?.message || '')}
    <a href="${esc(profile.githubUrl)}?tab=repositories" target="_blank" rel="noopener">Browse them on GitHub →</a></p>`;
}

function initNav() {
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const links = nav.querySelector('.nav__links');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  links.addEventListener('click', (e) => e.target.closest('a') && setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const map = new Map([...links.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        map.forEach((a) => a.classList.remove('is-active'));
        map.get(entry.target.id)?.classList.add('is-active');
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  ['top', ...map.keys()].forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}
