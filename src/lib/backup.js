/*
 * backup.js — the escape hatch.
 *
 * Local storage is the right default for something this personal, but it is
 * also one cleared-website-data away from gone. Export writes the entire state
 * as a dated JSON file; import replaces it. No accounts, no sync, no service
 * that can go away and take the notes with it.
 */
import { getState, replaceAll, SCHEMA_VERSION } from './store.js';

export function exportPayload () {
  return { app: 'vintage-voice-hq', v: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: getState() };
}

function stamp () {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function downloadBackup () {
  const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vintage-voice-hq-${stamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download on some iOS versions.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyBackup () {
  const text = JSON.stringify(exportPayload(), null, 2);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

/* Accepts either a wrapped export or a bare state object, so pasting the
   inner `data` block by hand still works. */
export function applyBackupText (text) {
  const parsed = JSON.parse(text);
  const data = parsed && typeof parsed === 'object' && parsed.data ? parsed.data : parsed;
  if (!data || typeof data !== 'object') throw new Error('That file does not look like a backup.');
  replaceAll(data);
}

export function readFileAsText (file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read that file.'));
    r.readAsText(file);
  });
}
