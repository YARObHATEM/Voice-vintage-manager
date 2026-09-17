/*
 * Hooks — the capture end of the content engine.
 *
 * A video idea is four things: what you see, what you hear, the vibe it is
 * chasing, and the words. The form asks for those in that order and nothing
 * else, because a capture form you have to think about is one you stop using.
 * Everything after capture is a status you can change with one tap from the
 * list.
 */
import { useMemo, useState } from 'react';
import {
  Btn, DeleteButton, Empty, Field, Area, IconBtn, Panel, Progress,
  SectionLabel, Sheet, Switcher, Tag, PlusIcon, EditIcon, cx
} from '../components/ui.jsx';
import { addItem, patchItem, removeItem, useStore } from '../lib/store.js';
import { filterList } from '../lib/search.js';
import { HOOK_STATUSES, hookTone } from '../lib/constants.js';
import { SEED_TAGS } from '../lib/seed.js';

const EMPTY = { hook: '', audio: '', vibe: '', script: '', status: 'Idea', tags: [] };

export default function Hooks ({ query }) {
  const { hooks } = useStore();
  const [draft, setDraft] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState(null);
  const [openId, setOpenId] = useState(null);

  const allTags = useMemo(() => {
    const seen = new Map();
    hooks.forEach(h => (h.tags || []).forEach(t => seen.set(t, (seen.get(t) || 0) + 1)));
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [hooks]);

  const visible = useMemo(() => {
    let list = filterList('hooks', hooks, query);
    if (statusFilter !== 'All') list = list.filter(h => h.status === statusFilter);
    if (tagFilter) list = list.filter(h => (h.tags || []).includes(tagFilter));
    return list;
  }, [hooks, query, statusFilter, tagFilter]);

  const posted = hooks.filter(h => h.status === 'Posted').length;

  function save () {
    if (!draft.hook.trim()) return;
    const payload = { ...draft, hook: draft.hook.trim() };
    if (draft.id) patchItem('hooks', draft.id, payload);
    else addItem('hooks', payload);
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      <Panel className="p-3.5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            First 10 posted
          </span>
          <span className="font-mono text-sm text-ink tabular-nums">
            {Math.min(posted, 10)}<span className="text-ink-faint">/10</span>
          </span>
        </div>
        <Progress value={Math.min(posted, 10)} total={10} tone={posted >= 10 ? 'led' : 'amber'} />
        <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
          {hooks.length} logged &middot; {hooks.filter(h => h.status === 'Idea').length} still ideas &middot;{' '}
          {hooks.filter(h => h.status === 'Filmed').length} filmed, waiting to go out
        </p>
      </Panel>

      <Btn variant="primary" className="w-full py-3" onClick={() => setDraft({ ...EMPTY })}>
        <PlusIcon /> Capture a hook
      </Btn>

      <div className="space-y-2">
        <Switcher
          value={statusFilter}
          options={['All', ...HOOK_STATUSES]}
          onChange={setStatusFilter}
          tone={o => (o === 'All' ? 'cool' : hookTone(o))}
          scroll
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(([t, n]) => (
              <button key={t} type="button" onClick={() => setTagFilter(tagFilter === t ? null : t)}>
                <Tag tone={tagFilter === t ? 'amber' : 'cool'}>
                  {t} <span className="opacity-60">{n}</span>
                </Tag>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <SectionLabel right={<span className="font-mono text-[11px] text-ink-faint tabular-nums">{visible.length}</span>}>
          Concepts
        </SectionLabel>

        {visible.length === 0 ? (
          <Empty title={hooks.length === 0 ? 'Nothing captured yet' : 'No matches'}>
            {hooks.length === 0
              ? 'The hook you thought of in the shower goes here before you lose it.'
              : 'Try a shorter search, or clear the status and tag filters.'}
          </Empty>
        ) : (
          visible.map(h => (
            <HookCard
              key={h.id}
              hook={h}
              open={openId === h.id}
              onToggle={() => setOpenId(openId === h.id ? null : h.id)}
              onEdit={() => setDraft({ ...EMPTY, ...h })}
            />
          ))
        )}
      </div>

      <Sheet
        open={!!draft}
        title={draft?.id ? 'Edit concept' : 'New concept'}
        onClose={() => setDraft(null)}
        footer={
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => setDraft(null)}>Cancel</Btn>
            <Btn variant="primary" className="flex-1" disabled={!draft?.hook.trim()} onClick={save}>
              {draft?.id ? 'Save' : 'Capture'}
            </Btn>
          </div>
        }
      >
        {draft && (
          <>
            <Area
              label="Hook / visual idea"
              rows={2}
              autoFocus
              value={draft.hook}
              onChange={e => setDraft({ ...draft, hook: e.target.value })}
              placeholder="Recording the same sentence on an iPhone, then on this."
            />
            <Field
              label="Audio element"
              value={draft.audio}
              onChange={e => setDraft({ ...draft, audio: e.target.value })}
              placeholder="ASMR click, tape hiss, re-dub comparison"
            />
            <Field
              label="Target sound / vibe"
              value={draft.vibe}
              onChange={e => setDraft({ ...draft, vibe: e.target.value })}
              placeholder="2003 camcorder, lo-fi, nostalgic"
            />
            <Area
              label="Script / notes"
              rows={4}
              value={draft.script}
              onChange={e => setDraft({ ...draft, script: e.target.value })}
              placeholder="Beat by beat. What is on screen at second 0, 3, 7."
            />
            <div>
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Status
              </span>
              <Switcher
                value={draft.status}
                options={HOOK_STATUSES}
                onChange={status => setDraft({ ...draft, status })}
                tone={hookTone}
              />
            </div>
            <TagEditor
              tags={draft.tags}
              suggestions={[...new Set([...SEED_TAGS, ...allTags.map(([t]) => t)])]}
              onChange={tags => setDraft({ ...draft, tags })}
            />
          </>
        )}
      </Sheet>
    </div>
  );
}

function HookCard ({ hook, open, onToggle, onEdit }) {
  const hasDetail = hook.audio || hook.vibe || hook.script;
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start gap-2 p-3.5">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="text-[15px] leading-snug text-ink">{hook.hook}</p>
          {(hook.audio || hook.vibe) && (
            <p className="mt-1 truncate font-mono text-[11px] text-ink-faint">
              {[hook.audio, hook.vibe].filter(Boolean).join('  /  ')}
            </p>
          )}
          {(hook.tags || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {hook.tags.map(t => <Tag key={t}>{t}</Tag>)}
            </div>
          )}
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <IconBtn label="Edit concept" onClick={onEdit}><EditIcon /></IconBtn>
          <DeleteButton onDelete={() => removeItem('hooks', hook.id)} label="Delete concept" />
        </div>
      </div>

      <div className={cx('border-t border-edge px-3.5 py-2.5', open && hasDetail ? '' : '')}>
        <Switcher
          value={hook.status}
          options={HOOK_STATUSES}
          onChange={status => patchItem('hooks', hook.id, { status })}
          tone={hookTone}
        />
      </div>

      {open && hasDetail && (
        <div className="vv-rise space-y-2.5 border-t border-edge bg-chassis/50 px-3.5 py-3">
          {hook.audio && <Detail label="Audio">{hook.audio}</Detail>}
          {hook.vibe && <Detail label="Vibe">{hook.vibe}</Detail>}
          {hook.script && <Detail label="Script">{hook.script}</Detail>}
        </div>
      )}
    </Panel>
  );
}

function Detail ({ label, children }) {
  return (
    <div>
      <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</span>
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-dim">{children}</p>
    </div>
  );
}

/* Tags are typed, not managed. Enter or comma commits one; the suggestion row
   is just a faster keyboard. */
function TagEditor ({ tags, suggestions, onChange }) {
  const [text, setText] = useState('');

  const add = raw => {
    const clean = raw.trim().replace(/^#*/, '');
    if (!clean) return;
    const tag = '#' + clean.replace(/\s+/g, '');
    if (!tags.includes(tag)) onChange([...tags, tag]);
    setText('');
  };

  return (
    <div>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Tags</span>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map(t => (
            <Tag key={t} tone="amber" onRemove={() => onChange(tags.filter(x => x !== t))}>{t}</Tag>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Field
          className="flex-1"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
          }}
          placeholder="#ASMR"
        />
        <Btn onClick={() => add(text)} disabled={!text.trim()}>Add</Btn>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.filter(s => !tags.includes(s)).slice(0, 8).map(s => (
          <button key={s} type="button" onClick={() => add(s)}>
            <Tag>{s}</Tag>
          </button>
        ))}
      </div>
    </div>
  );
}
