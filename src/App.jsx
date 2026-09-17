/*
 * App — header, scratchpad, one tab, bottom nav.
 *
 * There is no router. Five tabs in a phone-width column do not need URLs, and
 * skipping the router keeps the bundle small enough that the app opens from
 * the Home Screen with no visible load.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import BottomNav, { TABS } from './components/BottomNav.jsx';
import Scratchpad from './components/Scratchpad.jsx';
import { SearchIcon, cx } from './components/ui.jsx';
import { countAll } from './lib/search.js';
import { useStore } from './lib/store.js';
import Backlog from './views/Backlog.jsx';
import Creators from './views/Creators.jsx';
import Data from './views/Data.jsx';
import Hooks from './views/Hooks.jsx';
import Roadmap from './views/Roadmap.jsx';

const TAB_KEY = 'vintage-voice-hq/tab';

const VIEWS = { hooks: Hooks, roadmap: Roadmap, creators: Creators, backlog: Backlog, data: Data };

export default function App () {
  const state = useStore();
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      return VIEWS[saved] ? saved : 'hooks';
    } catch { return 'hooks'; }
  });
  const [query, setQuery] = useState('');
  const scroller = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* storage blocked */ }
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  const counts = useMemo(() => countAll(state, query.trim()), [state, query]);
  const View = VIEWS[tab];

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-lg flex-col">
      <header className="sticky top-0 z-30 bg-chassis px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-1 pb-2.5">
          <h1 className="flex items-baseline gap-1.5">
            <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-ink-dim">Vintage Voice</span>
            <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-amber">HQ</span>
          </h1>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            {TABS.find(t => t.id === tab)?.label}
          </span>
        </div>

        <div className="relative pb-2.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-[60%] text-ink-faint">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Search everything"
            className={cx(
              'w-full rounded-lg border border-edge bg-panel py-2.5 pl-9 pr-9 text-ink',
              'placeholder:text-ink-faint outline-none transition',
              'focus:border-amber/60 focus:ring-2 focus:ring-amber/15'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-[60%] items-center justify-center rounded-md text-ink-faint active:bg-panel-2"
            >
              &times;
            </button>
          )}
        </div>

        {/* When you are searching, the other tabs say how many matches they are
            holding, so nothing hides behind the tab you are not on. */}
        {counts && (
          <div className="vv-fade-in flex gap-1.5 overflow-x-auto pb-2.5">
            {TABS.filter(t => t.id !== 'data').map(t => {
              const n = counts[t.id] ?? 0;
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  disabled={n === 0}
                  className={cx(
                    'shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition',
                    n === 0
                      ? 'border-edge text-ink-faint/50'
                      : on
                        ? 'border-amber/60 bg-amber/15 text-amber'
                        : 'border-edge-lit bg-panel text-ink-dim active:bg-panel-2'
                  )}
                >
                  {t.label} <span className="tabular-nums">{n}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="h-px bg-edge" />
      </header>

      <main ref={scroller} className="flex-1 px-3 pb-28 pt-3">
        <div className="mb-4">
          <Scratchpad />
        </div>
        {/* Keyed on the tab so every switch replays the rise-in, which reads as
            a change of screen without the cost of a real transition. */}
        <div key={tab} className="vv-rise">
          <View query={query.trim()} />
        </div>
      </main>

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
