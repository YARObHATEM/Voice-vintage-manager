/*
 * BottomNav — five tabs, thumb height, always there.
 *
 * Fixed to the bottom with the iPhone home-indicator inset added as padding,
 * so the last row of a list never ends up under the bar and the bar never
 * ends up under the indicator.
 */
import { cx } from './ui.jsx';

const stroke = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round', strokeLinejoin: 'round'
};

export const TABS = [
  {
    id: 'hooks',
    label: 'Hooks',
    icon: (
      <svg viewBox="0 0 24 24" width="21" height="21" {...stroke}>
        <path d="M12 3v11.5" /><circle cx="9" cy="17" r="3" />
        <path d="M12 3c3 .8 5 2.4 5 4.6 0 1.5-1 2.4-2.6 3" />
      </svg>
    )
  },
  {
    id: 'roadmap',
    label: 'Plan',
    icon: (
      <svg viewBox="0 0 24 24" width="21" height="21" {...stroke}>
        <path d="M4 6h5M4 12h5M4 18h5" /><path d="m13 6 2 2 4-4M13 13.5h7M13 19h7" />
      </svg>
    )
  },
  {
    id: 'creators',
    label: 'Creators',
    icon: (
      <svg viewBox="0 0 24 24" width="21" height="21" {...stroke}>
        <circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
        <path d="M16.5 7.5a3 3 0 0 1 0 5.4M18.5 19c-.2-1.4-.7-2.6-1.5-3.5" />
      </svg>
    )
  },
  {
    id: 'backlog',
    label: 'Backlog',
    icon: (
      <svg viewBox="0 0 24 24" width="21" height="21" {...stroke}>
        <rect x="4" y="4" width="16" height="6" rx="1.6" /><rect x="4" y="14" width="16" height="6" rx="1.6" />
        <path d="M7.5 7h.01M7.5 17h.01" />
      </svg>
    )
  },
  {
    id: 'data',
    label: 'Data',
    icon: (
      <svg viewBox="0 0 24 24" width="21" height="21" {...stroke}>
        <ellipse cx="12" cy="6" rx="7" ry="2.8" />
        <path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6" /><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8" />
      </svg>
    )
  }
];

export default function BottomNav ({ tab, onChange }) {
  return (
    <nav
      className={cx(
        'fixed inset-x-0 bottom-0 z-40 border-t border-edge',
        'bg-chassis shadow-[0_-8px_20px_rgba(9,9,11,0.9)]',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map(t => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-current={on ? 'page' : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 transition active:bg-panel-2/60"
            >
              {/* The lit seam above the active tab, like a selected channel. */}
              <span
                className={cx(
                  'absolute inset-x-3 top-0 h-px transition-opacity duration-200',
                  on ? 'bg-amber opacity-100' : 'opacity-0'
                )}
              />
              <span className={cx('transition-colors duration-150', on ? 'text-amber' : 'text-ink-faint')}>
                {t.icon}
              </span>
              <span
                className={cx(
                  'font-mono text-[9.5px] uppercase tracking-[0.12em] transition-colors duration-150',
                  on ? 'text-amber' : 'text-ink-faint'
                )}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
