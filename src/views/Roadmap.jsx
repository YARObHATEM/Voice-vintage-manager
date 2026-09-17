/*
 * Roadmap — a phased checklist rather than a Kanban board.
 *
 * A board needs horizontal room and a drag gesture, and this is a phone. The
 * same information in a phased list reads in one column, ticks with a thumb,
 * and still answers the only question that matters at a glance: how much of
 * this is actually done.
 */
import { useMemo, useState } from 'react';
import {
  Area, Btn, DeleteButton, Empty, Field, Panel, Progress, Sheet, Switcher, cx, PlusIcon
} from '../components/ui.jsx';
import { addItem, patchItem, removeItem, useStore } from '../lib/store.js';
import { filterList } from '../lib/search.js';
import { PHASES } from '../lib/seed.js';

export default function Roadmap ({ query }) {
  const { roadmap } = useStore();
  const [draft, setDraft] = useState(null);
  const [hideDone, setHideDone] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const visible = useMemo(() => {
    let list = filterList('roadmap', roadmap, query);
    if (hideDone) list = list.filter(t => !t.done);
    return list;
  }, [roadmap, query, hideDone]);

  const done = roadmap.filter(t => t.done).length;

  function save () {
    if (!draft.title.trim()) return;
    const payload = { ...draft, title: draft.title.trim() };
    if (draft.id) patchItem('roadmap', draft.id, payload);
    else addItem('roadmap', { ...payload, done: false });
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      <Panel className="p-3.5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Launch readiness</span>
          <span className="font-mono text-sm text-ink tabular-nums">
            {done}<span className="text-ink-faint">/{roadmap.length}</span>
          </span>
        </div>
        <Progress value={done} total={roadmap.length} tone={done === roadmap.length && roadmap.length > 0 ? 'led' : 'amber'} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PHASES.map(p => {
            const items = roadmap.filter(t => t.phase === p.id);
            const d = items.filter(t => t.done).length;
            return (
              <div key={p.id} className="rounded-lg border border-edge bg-chassis px-2 py-2">
                <div className="font-mono text-[9.5px] uppercase leading-tight tracking-[0.1em] text-ink-faint">
                  {p.label.split(' ')[0]}
                </div>
                <div className="mt-1 font-mono text-[13px] text-ink tabular-nums">
                  {d}<span className="text-ink-faint">/{items.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex gap-2">
        <Btn variant="primary" className="flex-1 py-3" onClick={() => setDraft({ phase: PHASES[0].id, title: '', note: '' })}>
          <PlusIcon /> Add step
        </Btn>
        <Btn className="px-3" onClick={() => setHideDone(h => !h)}>
          {hideDone ? 'Show done' : 'Hide done'}
        </Btn>
      </div>

      {visible.length === 0 && (
        <Empty title="Nothing here">
          {query ? 'No step matches that search.' : 'Every step is ticked. Go and ship it.'}
        </Empty>
      )}

      {PHASES.map(phase => {
        const items = visible.filter(t => t.phase === phase.id);
        if (items.length === 0) return null;
        const all = roadmap.filter(t => t.phase === phase.id);
        const d = all.filter(t => t.done).length;
        const shut = collapsed[phase.id];
        return (
          <section key={phase.id} className="space-y-2">
            <button
              type="button"
              onClick={() => setCollapsed(c => ({ ...c, [phase.id]: !shut }))}
              className="flex w-full items-center gap-2.5 px-1 text-left"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{phase.label}</span>
              <span className="h-px flex-1 bg-edge" />
              <span className="font-mono text-[11px] text-ink-faint tabular-nums">{d}/{all.length}</span>
            </button>
            <p className="px-1 text-xs leading-relaxed text-ink-faint">{phase.blurb}</p>

            {!shut && (
              <Panel className="divide-y divide-edge overflow-hidden">
                {items.map(item => (
                  <Step key={item.id} item={item} onEdit={() => setDraft({ ...item })} />
                ))}
              </Panel>
            )}
          </section>
        );
      })}

      <Sheet
        open={!!draft}
        title={draft?.id ? 'Edit step' : 'New step'}
        onClose={() => setDraft(null)}
        footer={
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => setDraft(null)}>Cancel</Btn>
            <Btn variant="primary" className="flex-1" disabled={!draft?.title.trim()} onClick={save}>Save</Btn>
          </div>
        }
      >
        {draft && (
          <>
            <Field
              label="Step"
              autoFocus
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              placeholder="Submit build to TestFlight"
            />
            <Area
              label="Note"
              rows={3}
              value={draft.note || ''}
              onChange={e => setDraft({ ...draft, note: e.target.value })}
              placeholder="What done looks like."
            />
            <div>
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Phase</span>
              <Switcher
                value={draft.phase}
                options={PHASES.map(p => p.id)}
                onChange={phase => setDraft({ ...draft, phase })}
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                {PHASES.find(p => p.id === draft.phase)?.label}
              </p>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}

function Step ({ item, onEdit }) {
  return (
    <div className="flex items-start gap-3 p-3">
      {/* A physical-feeling tick: the box sinks and lights green rather than
          swapping to a checkbox glyph. */}
      <button
        type="button"
        onClick={() => patchItem('roadmap', item.id, { done: !item.done })}
        aria-pressed={item.done}
        aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
        className={cx(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
          'transition duration-150 active:translate-y-px',
          item.done
            ? 'border-led/60 bg-led/20 text-led shadow-[0_0_10px_rgba(94,194,106,0.18)]'
            : 'border-edge-lit bg-chassis text-transparent shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]'
        )}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      </button>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className={cx('text-[14.5px] leading-snug transition', item.done ? 'text-ink-faint line-through' : 'text-ink')}>
          {item.title}
        </p>
        {item.note && (
          <p className={cx('mt-0.5 text-xs leading-relaxed', item.done ? 'text-ink-faint/60' : 'text-ink-faint')}>
            {item.note}
          </p>
        )}
      </button>

      <DeleteButton onDelete={() => removeItem('roadmap', item.id)} label="Delete step" />
    </div>
  );
}
