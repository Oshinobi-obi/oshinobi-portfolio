// GitHub REST API access with a 1-hour localStorage cache.
// Unauthenticated requests are limited to 60/hour per IP, so every response
// is cached and stale data is reused if a later request fails.

const API = 'https://api.github.com';
const TTL = 60 * 60 * 1000; // 1 hour
const CACHE_VERSION = 'v1';

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* storage full or blocked (private mode) — safe to ignore */
  }
}

/** Return cached data if fresh, else fetch; fall back to stale cache on error. */
async function cached(key, fetcher, shouldCache = () => true) {
  const fullKey = `gh:${CACHE_VERSION}:${key}`;
  const hit = readCache(fullKey);
  if (hit && Date.now() - hit.t < TTL) return hit.data;
  try {
    const data = await fetcher();
    if (shouldCache(data)) writeCache(fullKey, data);
    return data;
  } catch (err) {
    if (hit) return hit.data;
    throw err;
  }
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) {
    const limited = res.status === 403 || res.status === 429;
    throw new Error(limited ? 'GitHub API rate limit reached — try again later.' : `GitHub API error ${res.status}`);
  }
  return res.json();
}

/** All public, non-fork repos, most recently updated first. */
export async function getRepos(user, hidden = []) {
  const raw = await cached(`repos:${user}`, async () => {
    const list = await getJSON(`${API}/users/${encodeURIComponent(user)}/repos?per_page=100`);
    // Keep only the fields we render to keep the cache small.
    return list.map((r) => ({
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      language: r.language,
      stargazers_count: r.stargazers_count,
      fork: r.fork,
      archived: r.archived,
      size: r.size,
      pushed_at: r.pushed_at,
      updated_at: r.updated_at,
      languages_url: r.languages_url,
    }));
  });
  const hide = new Set(hidden.map((h) => h.toLowerCase()));
  return raw
    .filter((r) => !r.fork && !hide.has(r.name.toLowerCase()))
    .sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));
}

/** Run async tasks with limited concurrency. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Sum bytes per language across repos.
 * Returns { languages: [{ name, bytes, percent }], total, approximate }.
 * If the per-repo language endpoint is rate-limited, falls back to each
 * repo's primary language weighted by repo size (marked `approximate`).
 */
export async function getLanguageStats(user, repos) {
  const key = `langs:${user}:${repos.map((r) => r.name).join(',')}`;
  return cached(key, async () => {
    const totals = {};
    let approximate = false;

    await pool(repos, 5, async (repo) => {
      try {
        const langs = await getJSON(repo.languages_url);
        for (const [lang, bytes] of Object.entries(langs)) totals[lang] = (totals[lang] || 0) + bytes;
      } catch {
        approximate = true;
        if (repo.language) totals[repo.language] = (totals[repo.language] || 0) + Math.max(1, repo.size) * 1024;
      }
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (!total) throw new Error('No language data available.');
    const languages = Object.entries(totals)
      .map(([name, bytes]) => ({ name, bytes, percent: (bytes / total) * 100 }))
      .sort((a, b) => b.bytes - a.bytes);
    return { languages, total, approximate };
  }, (d) => !d.approximate); // don't cache partial (rate-limited) results
}
