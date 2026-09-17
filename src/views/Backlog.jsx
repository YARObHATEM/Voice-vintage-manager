/*
 * Backlog — where everything that is not this week goes.
 *
 * User requests, device ideas (the Soviet spy recorder, the Minidisc pack),
 * filter tweaks and bugs all live in one list, because they compete for the
 * same evenings. The only real decision is priority, so that is the only
 * control on the card, and Next Sprint floats to the top where you will see
 * it.
 */
import { useMemo, useState } from 'react';
import {
  Area, Btn, DeleteButton, Empty, Field, IconBtn, Panel, Picker, SectionLabel,
  Sheet, Switcher, Tag, cx, EditIcon, PlusIcon
} from '../components/ui.jsx';
import { addItem, patchItem, removeItem, useStore } from '../lib/store.js';
import { filterList } from '../lib/search.js';
import { BACKLOG_TYPES, PRIORITIES, priorityTone } from '../lib/constants.js';

const EMPTY = { title: '', detail: '', type: 'User Request', priority: 'Medium', done: false };

/* Highest first, and done items sink whatever their priority. */
const ORDER = ['Next Sprint', 'High', 'Medium', 'Low'];

export default function Backlog ({ query }) {
  const { backlog } = useStore();
  const [draft, setDraft] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [hideDone, setHideDone] = useState(true);

  const visible = useMemo(() => {
    let list = filterList('backlog', backlog, query);
    if (typeFilter !== 'All') list = list.filter(b => b.type === typeFilter);
    if (hideDone) list = list.filter(b => !b.done);
    return [...list].sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority) ||
        String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
  }, [backlog, query, typeFilter, hideDone]);

  const nextSprint = backlog.filter(b => !b.done && b.priority === 'Next Sprint').length;
  const doneCount = backlog.filter(b => b.done).length;

  function save () {
    if (!draft.title.trim()) return;
    const payload = { ...draft, title: draft.title.trim() };
    if (draft.id) patchItem('backlog', draft.id, payload);
    else addItem('backlog', payload);
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between p-3.5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Queued for next sprint</div>
          <div className="mt-1 font-mono text-2xl text-ink tabular-nums">{nextSprint}</div>
        </div>
        <div className="text-right font-mono text-[11px] text-ink-faint tabular-nums">
          <div>{backlog.length - doneCount} open</div>
          <div className="mt-0.5 text-led/70">{doneCount} shipped</div>
        </div>
      </Panel>

      <div className="flex gap-2">
        <Btn variant="primary" className="flex-1 py-3" onClick={() => setDraft({ ...EMPTY })}>
          <PlusIcon /> Add to backlog
        </Btn>
        <Btn className="px-3" onClick={() => setHideDone(h => !h)}>
          {hideDone ? 'Show shipped' : 'Hide shipped'}
        </Btn>
      </div>

      <Switcher value={typeFilter} options={['All', ...BACKLOG_TYPES]} onChange={setTypeFilter} scroll />

      <div className="space-y-2.5">
        <SectionLabel right={<span className="font-mono text-[11px] text-ink-faint tabular-nums">{visible.length}</span>}>
          Items
        </SectionLabel>

        {visible.length === 0 ? (
          <Empty title={backlog.length === 0 ? 'Backlog is empty' : 'No matches'}>
            {backlog.length === 0
              ? 'Every "wouldn’t it be good if" goes here. Soviet spy recorder. Minidisc pack. That hiss that is slightly too loud.'
              : 'Change the type filter, or show shipped items.'}
          </Empty>
        ) : (
          visible.map(b => <BacklogCard key={b.id} item={b} onEdit={() => setDraft({ ...EMPTY, ...b })} />)
        )}
      </div>

      <Sheet
        open={!!draft}
        title={draft?.id ? 'Edit item' : 'New backlog item'}
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
              label="What"
              autoFocus
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              placeholder="Minidisc device pack"
            />
            <Area
              label="Detail"
              rows={4}
              value={draft.detail}
              onChange={e => setDraft({ ...draft, detail: e.target.value })}
              placeholder="Who asked, what it would take, why it matters."
            />
            <Picker
              label="Type"
              options={BACKLOG_TYPES}
              value={draft.type}
              onChange={e => setDraft({ ...draft, type: e.target.value })}
            />
            <div>
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Priority</span>
              <Switcher
                value={draft.priority}
                options={PRIORITIES}
                onChange={priority => setDraft({ ...draft, priority })}
                tone={priorityTone}
              />
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}

function BacklogCard ({ item, onEdit }) {
  return (
    <Panel className={cx('overflow-hidden transition', item.done && 'opacity-55')}>
      <div className="flex items-start gap-2.5 p-3.5">
        <button
          type="button"
          onClick={() => patchItem('backlog', item.id, { done: !item.done })}
          aria-pressed={item.done}
          aria-label={item.done ? 'Move back to open' : 'Mark as shipped'}
          className={cx(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition active:translate-y-px',
            item.done
              ? 'border-led/60 bg-led/20 text-led'
              : 'border-edge-lit bg-chassis text-transparent'
          )}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7" />
          </svg>
        </button>

        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <p className={cx('text-[15px] leading-snug', item.done ? 'text-ink-faint line-through' : 'text-ink')}>
            {item.title}
          </p>
          {item.detail && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-faint">{item.detail}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag>{item.type}</Tag>
            <Tag tone={priorityTone(item.priority)}>{item.priority}</Tag>
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <IconBtn label="Edit item" onClick={onEdit}><EditIcon /></IconBtn>
          <DeleteButton onDelete={() => removeItem('backlog', item.id)} label="Delete item" />
        </div>
      </div>

      {!item.done && (
        <div className="border-t border-edge px-3.5 py-2.5">
          <Switcher
            value={item.priority}
            options={PRIORITIES}
            onChange={priority => patchItem('backlog', item.id, { priority })}
            tone={priorityTone}
          />
        </div>
      )}
    </Panel>
  );
}
