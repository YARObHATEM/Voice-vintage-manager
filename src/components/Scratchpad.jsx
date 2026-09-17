/*
 * Scratchpad — the fastest path from a thought to somewhere it will survive.
 *
 * It sits above every tab and is never more than one tap from anywhere in the
 * app. Collapsed it shows the first line, so the pad is visible without
 * costing half the screen; expanded it is a plain textarea that saves as you
 * type. There is no Save button because there is nothing to press.
 */
import { useEffect, useRef, useState } from 'react';
import { set, useStore } from '../lib/store.js';
import { ChevronIcon, IconBtn, cx } from './ui.jsx';

export default function Scratchpad () {
  const { scratchpad } = useStore();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const ref = useRef(null);
  const firstEdit = useRef(true);

  // Flash the LED briefly on every edit, so "it saved" is something you see
  // rather than something you have to trust.
  useEffect(() => {
    if (firstEdit.current) { firstEdit.current = false; return; }
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(t);
  }, [scratchpad]);

  useEffect(() => {
    if (open && ref.current) {
      const el = ref.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [open]);

  const preview = scratchpad.trim().split('\n')[0] || 'Tap to dump a thought, a caption, a one-liner.';
  const words = scratchpad.trim() ? scratchpad.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-panel border border-edge bg-panel-2/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition active:bg-panel"
      >
        <span
          className={cx(
            'h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300',
            flash ? 'bg-led shadow-[0_0_6px_rgba(94,194,106,0.8)]' : 'bg-edge-lit'
          )}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Pad</span>
        {!open && (
          <span className={cx('flex-1 truncate text-sm', scratchpad.trim() ? 'text-ink-dim' : 'text-ink-faint')}>
            {preview}
          </span>
        )}
        {open && <span className="flex-1" />}
        <ChevronIcon className={cx('shrink-0 text-ink-faint transition-transform duration-200', open ? 'rotate-90' : '')} />
      </button>

      {open && (
        <div className="vv-rise px-3 pb-3">
          <textarea
            ref={ref}
            value={scratchpad}
            onChange={e => set({ scratchpad: e.target.value, scratchpadSavedAt: new Date().toISOString() })}
            rows={5}
            placeholder={'Hook that came to you on the bus.\nA caption.\nThe name of a mic you want to fake.'}
            className={cx(
              'w-full resize-y rounded-lg border border-edge bg-chassis px-3 py-2.5',
              'font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-faint',
              'outline-none transition focus:border-amber/60 focus:ring-2 focus:ring-amber/15'
            )}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint tabular-nums">
              {words} {words === 1 ? 'word' : 'words'} &middot; saved locally
            </span>
            <div className="flex gap-1.5">
              {scratchpad.trim() && (
                <IconBtn
                  label="Clear the pad"
                  onClick={() => {
                    if (window.confirm('Clear the scratchpad? This cannot be undone.')) set({ scratchpad: '' });
                  }}
                  className="active:text-alert"
                >
                  <span className="text-xs">&times;</span>
                </IconBtn>
              )}
              <IconBtn label="Collapse the pad" onClick={() => setOpen(false)}>
                <ChevronIcon className="-rotate-90" />
              </IconBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
