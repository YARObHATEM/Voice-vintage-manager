/*
 * search.js — one query box, every section.
 *
 * Each collection declares which of its fields are searchable; matching is a
 * plain case-insensitive substring over those fields joined together. With a
 * few hundred rows that is instant and, unlike fuzzy matching, it never
 * surprises you with a result you cannot see the reason for.
 */

const FIELDS = {
  hooks: h => [h.hook, h.audio, h.vibe, h.script, h.status, (h.tags || []).join(' ')],
  roadmap: r => [r.title, r.note, r.phase],
  creators: c => [c.handle, c.platform, c.niche, c.status, c.notes, c.link],
  backlog: b => [b.title, b.detail, b.type, b.priority]
};

export function matches (collection, item, query) {
  if (!query) return true;
  const hay = FIELDS[collection](item).filter(Boolean).join(' ~ ').toLowerCase();
  // Every whitespace-separated term must appear: "asmr tape" narrows, it does
  // not widen.
  return query.toLowerCase().split(/\s+/).filter(Boolean).every(term => hay.includes(term));
}

export function filterList (collection, list, query) {
  return query ? list.filter(item => matches(collection, item, query)) : list;
}

export function countAll (state, query) {
  if (!query) return null;
  return {
    hooks: filterList('hooks', state.hooks, query).length,
    roadmap: filterList('roadmap', state.roadmap, query).length,
    creators: filterList('creators', state.creators, query).length,
    backlog: filterList('backlog', state.backlog, query).length
  };
}
