/*
 * store.js — the whole application state, in localStorage.
 *
 * One JSON blob under one key. It is a personal tracker; the data is a few
 * hundred rows at most, so there is nothing here that a database would do
 * better and quite a lot it would do worse (a login, a network, an outage).
 *
 * Writes are debounced by a beat so typing in the scratchpad does not hit
 * localStorage on every keystroke, and flushed on pagehide so nothing is lost
 * when iOS suspends the tab.
 */
import { useSyncExternalStore } from 'react';
import { SEED_ROADMAP } from './seed.js';

export const STORAGE_KEY = 'vintage-voice-hq/v1';
export const SCHEMA_VERSION = 1;

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const now = () => new Date().toISOString();

function initialState () {
  return {
    v: SCHEMA_VERSION,
    scratchpad: '',
    scratchpadSavedAt: null,
    budget: 200,
    hooks: [],
    roadmap: SEED_ROADMAP.map(([phase, title, note]) => ({
      id: uid(), phase, title, note, done: false, seeded: true, createdAt: now()
    })),
    creators: [],
    backlog: []
  };
}

/* A stored blob is trusted only as far as its shape. Anything missing is
   filled from a fresh state, so a half-written import or an older version
   cannot leave the app rendering undefined. */
export function normalize (raw) {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const arr = (x, fallback) => (Array.isArray(x) ? x : fallback);
  return {
    ...base,
    ...raw,
    v: SCHEMA_VERSION,
    scratchpad: typeof raw.scratchpad === 'string' ? raw.scratchpad : '',
    budget: Number.isFinite(Number(raw.budget)) ? Number(raw.budget) : base.budget,
    hooks: arr(raw.hooks, []).map(h => ({ tags: [], status: 'Idea', ...h, id: h?.id || uid() })),
    roadmap: arr(raw.roadmap, base.roadmap).map(r => ({ done: false, ...r, id: r?.id || uid() })),
    creators: arr(raw.creators, []).map(c => ({ status: 'To Contact', ...c, id: c?.id || uid() })),
    backlog: arr(raw.backlog, []).map(b => ({ priority: 'Medium', ...b, id: b?.id || uid() }))
  };
}

function read () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : initialState();
  } catch {
    // Private mode, blocked storage, corrupt JSON: run from memory instead of
    // showing the user a broken app.
    return initialState();
  }
}

let state = read();
const listeners = new Set();
let flushTimer = null;

function flush () {
  flushTimer = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Quota or blocked storage. The session still works; the next successful
       write catches up. */
  }
}

function commit (next) {
  state = next;
  listeners.forEach(fn => fn());
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 250);
}

export function getState () { return state; }

export function subscribe (fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStore () {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* set(patchOrFn) — the single write path. Everything below is sugar on it. */
export function set (patch) {
  commit({ ...state, ...(typeof patch === 'function' ? patch(state) : patch) });
}

export function addItem (key, item) {
  const record = { id: uid(), createdAt: now(), updatedAt: now(), ...item };
  commit({ ...state, [key]: [record, ...state[key]] });
  return record;
}

export function patchItem (key, id, patch) {
  commit({
    ...state,
    [key]: state[key].map(it => (it.id === id ? { ...it, ...patch, updatedAt: now() } : it))
  });
}

export function removeItem (key, id) {
  commit({ ...state, [key]: state[key].filter(it => it.id !== id) });
}

export function replaceAll (next) {
  commit(normalize(next));
  flush();
}

export function resetAll () {
  commit(initialState());
  flush();
}

if (typeof window !== 'undefined') {
  // Another tab wrote: adopt it rather than letting the two drift apart.
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = e.newValue ? normalize(JSON.parse(e.newValue)) : initialState();
      listeners.forEach(fn => fn());
    } catch { /* ignore a malformed write from elsewhere */ }
  });

  // pagehide is the one iOS reliably fires before suspending a tab.
  window.addEventListener('pagehide', () => { if (flushTimer) flush(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && flushTimer) flush();
  });
}
