/*
 * Data — the part that makes local storage safe to rely on.
 *
 * Everything lives in this browser. That is the point (no account, no server,
 * nothing to go down) and also the risk, so export is one tap, import accepts
 * the file straight back, and the panel says plainly how much is in there.
 */
import { useRef, useState } from 'react';
import { Btn, Panel, SectionLabel, Sheet, Area } from '../components/ui.jsx';
import { applyBackupText, copyBackup, downloadBackup, readFileAsText } from '../lib/backup.js';
import { STORAGE_KEY, resetAll, useStore } from '../lib/store.js';

export default function Data () {
  const state = useStore();
  const fileRef = useRef(null);
  const [note, setNote] = useState(null);
  const [paste, setPaste] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const say = (text, bad = false) => {
    setNote({ text, bad });
    setTimeout(() => setNote(null), 3200);
  };

  const bytes = (() => {
    try { return new Blob([localStorage.getItem(STORAGE_KEY) || '']).size; } catch { return 0; }
  })();
  const size = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;

  async function onFile (e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      applyBackupText(await readFileAsText(file));
      say('Backup restored.');
    } catch (err) {
      say(err.message || 'That file could not be read.', true);
    }
  }

  const rows = [
    ['Hooks', state.hooks.length],
    ['Roadmap steps', state.roadmap.length],
    ['Creators', state.creators.length],
    ['Backlog items', state.backlog.length],
    ['Scratchpad', state.scratchpad.trim() ? `${state.scratchpad.trim().split(/\s+/).length} words` : 'empty']
  ];

  return (
    <div className="space-y-4">
      <Panel className="divide-y divide-edge">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between px-3.5 py-2.5">
            <span className="text-sm text-ink-dim">{label}</span>
            <span className="font-mono text-[13px] text-ink tabular-nums">{value}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between px-3.5 py-2.5">
          <span className="text-sm text-ink-dim">On disk</span>
          <span className="font-mono text-[13px] text-ink-faint tabular-nums">{size}</span>
        </div>
      </Panel>

      <div className="space-y-2.5">
        <SectionLabel>Backup</SectionLabel>
        <Btn variant="primary" className="w-full py-3" onClick={() => { downloadBackup(); say('Backup downloaded.'); }}>
          Export everything as JSON
        </Btn>
        <div className="flex gap-2">
          <Btn
            className="flex-1 py-3"
            onClick={async () => say(await copyBackup() ? 'Copied to clipboard.' : 'Clipboard blocked — use export.', false)}
          >
            Copy to clipboard
          </Btn>
          <Btn className="flex-1 py-3" onClick={() => fileRef.current?.click()}>Import file</Btn>
        </div>
        <Btn className="w-full py-3" onClick={() => setPaste('')}>Paste a backup</Btn>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        <p className="px-1 text-xs leading-relaxed text-ink-faint">
          Importing replaces everything currently in the app. Export first if you are not sure.
        </p>
      </div>

      <div className="space-y-2.5">
        <SectionLabel>Install</SectionLabel>
        <Panel className="p-3.5 text-xs leading-relaxed text-ink-faint">
          <p>
            <span className="text-ink-dim">iPhone:</span> open in Safari, tap Share, then Add to Home Screen. It
            then runs fullscreen and iOS is much less likely to clear its storage.
          </p>
          <p className="mt-2">
            <span className="text-ink-dim">Android / desktop:</span> use the browser&rsquo;s install prompt.
          </p>
        </Panel>
      </div>

      <div className="space-y-2.5">
        <SectionLabel>Danger</SectionLabel>
        <Btn variant="danger" className="w-full py-3" onClick={() => setConfirmReset(true)}>
          Erase everything
        </Btn>
      </div>

      {note && (
        <div className="vv-rise fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-lg border border-edge-lit bg-panel-2 px-4 py-2.5 text-center text-sm text-ink shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <span className={note.bad ? 'text-alert' : 'text-ink'}>{note.text}</span>
        </div>
      )}

      <Sheet
        open={paste !== null}
        title="Paste a backup"
        onClose={() => setPaste(null)}
        footer={
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => setPaste(null)}>Cancel</Btn>
            <Btn
              variant="primary"
              className="flex-1"
              disabled={!paste?.trim()}
              onClick={() => {
                try {
                  applyBackupText(paste);
                  setPaste(null);
                  say('Backup restored.');
                } catch (err) {
                  say(err.message || 'That is not valid backup JSON.', true);
                }
              }}
            >
              Restore
            </Btn>
          </div>
        }
      >
        <Area
          label="Backup JSON"
          rows={10}
          value={paste || ''}
          onChange={e => setPaste(e.target.value)}
          placeholder='{ "app": "vintage-voice-hq", ... }'
        />
      </Sheet>

      <Sheet
        open={confirmReset}
        title="Erase everything"
        onClose={() => setConfirmReset(false)}
        footer={
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => setConfirmReset(false)}>Keep it</Btn>
            <Btn
              variant="danger"
              className="flex-1"
              onClick={() => { resetAll(); setConfirmReset(false); say('Everything erased.'); }}
            >
              Erase
            </Btn>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-ink-dim">
          This clears every hook, creator, backlog item and the scratchpad, and puts the roadmap back to its
          default steps. There is no undo, so export first if any of it matters.
        </p>
        <Btn className="w-full" onClick={downloadBackup}>Export a backup first</Btn>
      </Sheet>
    </div>
  );
}
