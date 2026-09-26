const REPO = 'gchung00/pokeman';
const FILE = 'save-data.json';
const API  = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
const RAW  = `https://raw.githubusercontent.com/${REPO}/main/${FILE}`;

const LS_TOKEN = 'githubToken';
const LS_SHA   = 'githubSha';

export const getToken = () => localStorage.getItem(LS_TOKEN);
export const setToken = (t) => localStorage.setItem(LS_TOKEN, t);
export const clearToken = () => localStorage.removeItem(LS_TOKEN);

/** Fetch the latest save from GitHub. Returns { inventory, streak } or null on failure. */
export async function loadFromGitHub() {
  try {
    // Raw URL is public — no token needed for reading
    const res = await fetch(`${RAW}?t=${Date.now()}`); // cache-bust
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Push the current save state to GitHub. Returns true on success. */
export async function saveToGitHub(inventory, streak) {
  const token = getToken();
  if (!token) return false;

  const sha = localStorage.getItem(LS_SHA);

  const payload = JSON.stringify({
    inventory,
    streak,
    lastSaved: new Date().toISOString(),
  });
  const content = btoa(unescape(encodeURIComponent(payload))); // UTF-8 safe base64

  const body = {
    message: `save: update inventory (${inventory.length} Pokémon, streak ${streak})`,
    content,
    ...(sha ? { sha } : {}),
  };

  try {
    const res = await fetch(API, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 409) {
      // SHA conflict — re-fetch the current SHA and retry once
      const info = await fetch(API, {
        headers: { Authorization: `token ${token}` },
      }).then(r => r.json());
      localStorage.setItem(LS_SHA, info.sha);
      return saveToGitHub(inventory, streak);
    }

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem(LS_SHA, data.content.sha);
    return true;
  } catch {
    return false;
  }
}

/** Fetch the current SHA (needed before the first PUT). */
export async function fetchCurrentSha() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(API, {
      headers: { Authorization: `token ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem(LS_SHA, data.sha);
    return data.sha;
  } catch {
    return null;
  }
}
