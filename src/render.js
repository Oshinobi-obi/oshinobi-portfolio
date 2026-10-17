// Builds every section's markup from src/data/profile.js.
import { profile } from './data/profile.js';
import { esc } from './lib/util.js';

const ARROW = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const IMG_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="m21 16-5-5-9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const GH_ICON =`<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

function sectionHead(num, id, title, sub) {
  return `
    <header class="section__head" data-reveal>
      <span class="section__num">${num}</span>
      <h2 class="section__title" id="${id}">${title}</h2>
      ${sub ? `<p class="section__sub">${sub}</p>` : ''}
    </header>`;
}

function photoUrl() {
  if (!profile.photo) return '';
  return import.meta.env.BASE_URL + profile.photo.replace(/^\/+/, '');
}

export function renderAll() {
  document.querySelectorAll('[data-name]').forEach((el) => (el.textContent = profile.name));

  // ── Hero ──
  document.querySelector('[data-hero-content]').innerHTML = `
    <p class="hero__eyebrow" data-hero-item><span class="dot"></span> ${esc(profile.role)}</p>
    <h1 class="hero__title" data-hero-item>
      <span class="hero__hi">Hi, I'm</span>
      <span class="hero__name gradient-text">${esc(profile.name)}</span>
    </h1>
    <p class="hero__tagline" data-hero-item>${esc(profile.tagline)}</p>
    <div class="hero__ctas" data-hero-item>
      <a class="btn btn--primary" href="#projects">View Projects ${ARROW}</a>
      <a class="btn btn--ghost" href="${esc(profile.githubUrl)}" target="_blank" rel="noopener">${GH_ICON} GitHub</a>
    </div>`;

  // ── About ──
  const initials = profile.name.slice(0, 2).toUpperCase();
  const photo = photoUrl();
  document.querySelector('[data-about]').innerHTML = `
    ${sectionHead('01', 'about-title', 'About Me')}
    <div class="about__grid">
      <div class="about__card-wrap" data-reveal>
        <div class="tilt about__card" data-tilt data-tilt-max="14">
          <div class="tilt__glare" aria-hidden="true"></div>
          <div class="about__photo layer" style="--z:40px">
            ${
              photo
                ? `<img src="${esc(photo)}" alt="Photo of ${esc(profile.name)}" loading="lazy" />`
                : `<div class="about__placeholder" role="img" aria-label="Photo placeholder"><span>${esc(initials)}</span><small>[PHOTO]</small></div>`
            }
          </div>
          <div class="about__badge layer" style="--z:70px">
            <span class="dot"></span> Open to opportunities
          </div>
          <div class="about__card-name layer" style="--z:55px">
            <strong>${esc(profile.name)}</strong>
            <span>${esc(profile.location)}</span>
          </div>
        </div>
      </div>
      <div class="about__text">
        ${profile.about.map((p) => `<p data-reveal>${esc(p)}</p>`).join('')}
        <dl class="facts" data-reveal>
          ${profile.facts
            .map((f) => `<div class="fact"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)
            .join('')}
        </dl>
      </div>
    </div>`;

  // ── Languages & Tech ──
  document.querySelector('[data-tech]').innerHTML = `
    ${sectionHead('02', 'tech-title', 'Languages &amp; Tech', `Live from GitHub — bytes of code per language across my public repositories.`)}
    <div class="tech__grid">
      <div class="tech__sphere" data-reveal>
        <div class="tech__canvas" data-scene="languages" aria-hidden="true"></div>
        <p class="tech__hint" aria-hidden="true">Drag to spin · hover a language</p>
        <div class="tech__tooltip" aria-hidden="true"></div>
      </div>
      <div class="tech__side">
        <h3 class="sub-title" data-reveal>Language breakdown</h3>
        <div class="lang-list" data-lang-list aria-live="polite">
          <p class="muted">Loading language data…</p>
        </div>
        <h3 class="sub-title" data-reveal>Tools I use</h3>
        <ul class="chips" data-reveal>
          ${profile.tools.map((t) => `<li class="chip">${esc(t)}</li>`).join('')}
        </ul>
      </div>
    </div>`;

  // ── Featured projects ──
  document.querySelector('[data-projects]').innerHTML = `
    ${sectionHead('03', 'projects-title', 'Featured Projects', 'Systems built for real offices, barangays, and classmates.')}
    <div class="projects">
      ${profile.projects.map(projectCard).join('')}
    </div>`;

  // ── Gallery (the carousel itself is built by lib/gallery.js) ──
  document.querySelector('[data-gallery]').innerHTML = sectionHead(
    '04',
    'gallery-title',
    'Project Gallery',
    "A closer look at the systems I'm proudest of. Drag, swipe, or use the arrows — click a screenshot to enlarge it."
  );

  // ── Repos ──
  document.querySelector('[data-repos]').innerHTML = `
    ${sectionHead('05', 'repos-title', 'All Public Repos', 'Auto-populated from the GitHub API, most recently updated first.')}
    <div class="repos" data-repo-grid aria-live="polite">
      ${Array.from({ length: 6 }, () => `<div class="repo repo--skeleton"></div>`).join('')}
    </div>
    <p class="repos__more" data-reveal>
      <a class="btn btn--ghost" href="${esc(profile.githubUrl)}?tab=repositories" target="_blank" rel="noopener">${GH_ICON} See everything on GitHub</a>
    </p>`;

  // ── Contact / footer ──
  document.querySelector('[data-contact]').innerHTML = `
    ${sectionHead('06', 'contact-title', "Let's build something", 'Have a project, a role, or a community problem worth solving? Reach out.')}
    <ul class="contact" data-reveal>
      ${profile.contact.map(contactLink).join('')}
    </ul>
    <div class="footer__bottom">
      <span>${esc(profile.copyright)}</span>
      <span class="muted">Built with Vite, Three.js &amp; GSAP</span>
      <a href="#top" class="footer__top">Back to top ↑</a>
    </div>`;
}

function projectCard(p, i) {
  const repoLink = p.repo
    ? `<a class="project__link" href="https://github.com/${esc(p.repo)}" target="_blank" rel="noopener">${GH_ICON} <span>View code</span></a>`
    : `<span class="project__link project__link--muted">Repo coming soon</span>`;
  return `
    <article class="project-wrap" data-flip>
      <div class="tilt project" data-tilt data-tilt-max="10" style="--accent-shift:${i * 40}deg">
        <div class="tilt__glare" aria-hidden="true"></div>
        <div class="project__bg layer" style="--z:-20px" aria-hidden="true"></div>
        <span class="project__index layer" style="--z:20px" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <p class="project__kicker layer" style="--z:30px">${esc(p.kicker)}</p>
        <h3 class="project__title layer" style="--z:60px">${esc(p.title)}</h3>
        <p class="project__desc layer" style="--z:35px">${esc(p.description)}</p>
        <ul class="project__stack layer" style="--z:45px" aria-label="Tech stack">
          ${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}
        </ul>
        <div class="project__foot layer" style="--z:50px">
          ${p.highlight ? `<span class="project__highlight">${esc(p.highlight)}</span>` : '<span></span>'}
          <span class="project__actions">
            ${
              p.gallery
                ? `<a class="project__link" href="#gallery" data-gallery-link="${esc(p.gallery)}">${IMG_ICON} <span>Screenshots</span></a>`
                : ''
            }
            ${repoLink}
          </span>
        </div>
      </div>
    </article>`;
}

function contactLink(c) {
  if (c.placeholder) {
    return `<li><a class="contact__item contact__item--placeholder" href="${esc(c.href)}" aria-disabled="true" title="Placeholder — set in src/data/profile.js">
      <span class="contact__label">${esc(c.label)}</span>
      <span class="contact__value">${esc(c.value)}</span>
      <span class="contact__tag">placeholder</span>
    </a></li>`;
  }
  return `<li><a class="contact__item" href="${esc(c.href)}" target="_blank" rel="noopener">
    <span class="contact__label">${esc(c.label)}</span>
    <span class="contact__value">${esc(c.value)}</span>
    ${ARROW}
  </a></li>`;
}
