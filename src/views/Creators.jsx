/*
 * Creators — a CRM small enough to actually keep up to date.
 *
 * A spreadsheet on a phone is a pinch-and-scroll exercise, so each creator is
 * a card that shows the four things you need while you are in the DMs
 * (who, how big, where in the pipeline, what it costs) and hides the rest.
 *
 * The budget panel splits money into spent and committed, because an agreed
 * rate you have not paid yet is still gone as far as the next deal is
 * concerned.
 */
import { useMemo, useState } from 'react';
import {
  Area, Btn, DeleteButton, Empty, Field, IconBtn, Panel, Picker, SectionLabel,
  Sheet, Switcher, Tag, cx, EditIcon, LinkIcon, PlusIcon
} from '../components/ui.jsx';
import { addItem, patchItem, removeItem, set, useStore } from '../lib/store.js';
import { filterList } from '../lib/search.js';
import { CRM_STATUSES, NICHES, PLATFORMS, crmTone, money } from '../lib/constants.js';

const EMPTY = {
  handle: '', platform: 'TikTok', followers: '', niche: 'Lo-Fi',
  status: 'To Contact', rate: '', paid: false, link: '', notes: ''
};

const followersLabel = n => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
};

export default function Creators ({ query }) {
  const { creators, budget } = useStore();
  const [draft, setDraft] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editBudget, setEditBudget] = useState(false);

  const visible = useMemo(() => {
    let list = filterList('creators', creators, query);
    if (statusFilter !== 'All') list = list.filter(c => c.status === statusFilter);
    return [...list].sort(
      (a, b) =>
        CRM_STATUSES.indexOf(b.status) - CRM_STATUSES.indexOf(a.status) ||
        Number(b.followers || 0) - Number(a.followers || 0)
    );
  }, [creators, query, statusFilter]);

  const spent = creators.filter(c => c.paid).reduce((n, c) => n + Number(c.rate || 0), 0);
  const committed = creators
    .filter(c => !c.paid && c.status !== 'To Contact')
    .reduce((n, c) => n + Number(c.rate || 0), 0);
  const left = Math.max(0, budget - spent - committed);
  const pct = v => (budget > 0 ? Math.min(100, (v / budget) * 100) : 0);

  function save () {
    if (!draft.handle.trim()) return;
    const handle = draft.handle.trim().replace(/^@*/, '@');
    if (draft.id) patchItem('creators', draft.id, { ...draft, handle });
    else addItem('creators', { ...draft, handle });
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      <Panel className="p-3.5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Seeding budget</span>
          <button
            type="button"
            onClick={() => setEditBudget(true)}
            className="font-mono text-sm text-ink tabular-nums transition active:text-amber"
          >
            {money(left)} <span className="text-ink-faint">of {money(budget)} left</span>
          </button>
        </div>

        {/* One track, two fills: paid out in amber, agreed-but-unpaid hatched
            behind it. */}
        <div className="flex h-2 overflow-hidden rounded-full bg-chassis ring-1 ring-edge">
          <div className="h-full bg-amber transition-[width] duration-500" style={{ width: `${pct(spent)}%` }} />
          <div
            className="h-full bg-amber/30 transition-[width] duration-500"
            style={{ width: `${pct(committed)}%` }}
          />
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-2 font-mono text-[11px]">
          <Stat label="Spent" value={money(spent)} tone="text-amber" />
          <Stat label="Committed" value={money(committed)} tone="text-ink-dim" />
          <Stat label="Free" value={money(left)} tone={left > 0 ? 'text-led' : 'text-alert'} />
        </div>
      </Panel>

      <Btn variant="primary" className="w-full py-3" onClick={() => setDraft({ ...EMPTY })}>
        <PlusIcon /> Add creator
      </Btn>

      <Switcher
        value={statusFilter}
        options={['All', ...CRM_STATUSES]}
        onChange={setStatusFilter}
        tone={o => (o === 'All' ? 'cool' : crmTone(o))}
        scroll
      />

      <div className="space-y-2.5">
        <SectionLabel
          right={
            <span className="font-mono text-[11px] text-ink-faint tabular-nums">
              {visible.length} of {creators.length}
            </span>
          }
        >
          Pipeline
        </SectionLabel>

        {visible.length === 0 ? (
          <Empty title={creators.length === 0 ? 'No creators yet' : 'No matches'}>
            {creators.length === 0
              ? 'Small accounts with loud comment sections beat big accounts with quiet ones.'
              : 'Clear the filter or shorten the search.'}
          </Empty>
        ) : (
          visible.map(c => <CreatorCard key={c.id} c={c} onEdit={() => setDraft({ ...EMPTY, ...c })} />)
        )}
      </div>

      <Sheet
        open={!!draft}
        title={draft?.id ? 'Edit creator' : 'New creator'}
        onClose={() => setDraft(null)}
        footer={
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => setDraft(null)}>Cancel</Btn>
            <Btn variant="primary" className="flex-1" disabled={!draft?.handle.trim()} onClick={save}>Save</Btn>
          </div>
        }
      >
        {draft && (
          <>
            <Field
              label="Handle"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              value={draft.handle}
              onChange={e => setDraft({ ...draft, handle: e.target.value })}
              placeholder="@lofi.tapes"
            />
            <div className="grid grid-cols-2 gap-3">
              <Picker
                label="Platform"
                options={PLATFORMS}
                value={draft.platform}
                onChange={e => setDraft({ ...draft, platform: e.target.value })}
              />
              <Field
                label="Followers"
                type="number"
                inputMode="numeric"
                value={draft.followers}
                onChange={e => setDraft({ ...draft, followers: e.target.value })}
                placeholder="12400"
              />
            </div>
            <Picker
              label="Niche"
              options={NICHES}
              value={draft.niche}
              onChange={e => setDraft({ ...draft, niche: e.target.value })}
            />
            <div>
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Status</span>
              <Switcher
                value={draft.status}
                options={CRM_STATUSES}
                onChange={status => setDraft({ ...draft, status })}
                tone={crmTone}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Agreed rate"
                type="number"
                inputMode="decimal"
                value={draft.rate}
                onChange={e => setDraft({ ...draft, rate: e.target.value })}
                placeholder="25"
              />
              <label className="flex cursor-pointer select-none flex-col justify-end">
                <span className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">Paid out</span>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, paid: !draft.paid })}
                  className={cx(
                    'flex h-[46px] items-center justify-between rounded-lg border px-3 transition active:translate-y-px',
                    draft.paid ? 'border-amber/60 bg-amber/10 text-amber' : 'border-edge bg-chassis text-ink-faint'
                  )}
                >
                  <span className="font-mono text-[12px] uppercase tracking-wider">{draft.paid ? 'Yes' : 'No'}</span>
                  <span
                    className={cx(
                      'h-2.5 w-2.5 rounded-full transition',
                      draft.paid ? 'bg-amber shadow-[0_0_8px_rgba(224,164,88,0.7)]' : 'bg-edge-lit'
                    )}
                  />
                </button>
              </label>
            </div>
            <Field
              label="Video link"
              type="url"
              autoCapitalize="none"
              value={draft.link}
              onChange={e => setDraft({ ...draft, link: e.target.value })}
              placeholder="https://"
            />
            <Area
              label="Notes"
              rows={3}
              value={draft.notes}
              onChange={e => setDraft({ ...draft, notes: e.target.value })}
              placeholder="What you offered, when you followed up, what they said."
            />
          </>
        )}
      </Sheet>

      <Sheet
        open={editBudget}
        title="Seeding budget"
        onClose={() => setEditBudget(false)}
        footer={<Btn variant="primary" className="w-full" onClick={() => setEditBudget(false)}>Done</Btn>}
      >
        <Field
          label="Total budget"
          type="number"
          inputMode="decimal"
          value={budget}
          onChange={e => set({ budget: Number(e.target.value) || 0 })}
          hint="Spent is what you have paid. Committed is agreed but not paid yet."
        />
      </Sheet>
    </div>
  );
}

function Stat ({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-edge bg-chassis px-2 py-1.5">
      <div className="text-[9.5px] uppercase tracking-[0.1em] text-ink-faint">{label}</div>
      <div className={cx('mt-0.5 tabular-nums', tone)}>{value}</div>
    </div>
  );
}

function CreatorCard ({ c, onEdit }) {
  const f = followersLabel(c.followers);
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start gap-2 p-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-mono text-[14px] text-ink">{c.handle}</span>
            {f && <span className="shrink-0 font-mono text-[11px] text-ink-faint tabular-nums">{f}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Tag>{c.platform}</Tag>
            {c.niche && <Tag>{c.niche}</Tag>}
            {Number(c.rate) > 0 && (
              <Tag tone={c.paid ? 'amber' : 'cool'}>
                {money(c.rate)}{c.paid ? ' paid' : ' agreed'}
              </Tag>
            )}
          </div>
          {c.notes && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-faint">{c.notes}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <IconBtn label="Edit creator" onClick={onEdit}><EditIcon /></IconBtn>
          {c.link && (
            <a
              href={c.link}
              target="_blank"
              rel="noreferrer"
              aria-label="Open video link"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-edge text-ink-faint transition active:translate-y-px active:bg-panel-2"
            >
              <LinkIcon />
            </a>
          )}
          <DeleteButton onDelete={() => removeItem('creators', c.id)} label="Delete creator" />
        </div>
      </div>
      <div className="border-t border-edge px-3.5 py-2.5">
        <Switcher
          value={c.status}
          options={CRM_STATUSES}
          onChange={status => patchItem('creators', c.id, { status })}
          tone={crmTone}
        />
      </div>
    </Panel>
  );
}
