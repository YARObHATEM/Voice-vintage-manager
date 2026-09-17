/*
 * ui.jsx — the parts everything else is built from.
 *
 * The look is borrowed from the hardware the app is about: a dark anodised
 * chassis, hairline seams between panels, controls that visibly sink a pixel
 * when you press them, and monospace for anything that is data rather than
 * prose.
 */
import { useEffect, useRef, useState } from 'react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ---------- surfaces ---------- */

export function Panel ({ className, children, ...rest }) {
  return (
    <div
      className={cx(
        'rounded-panel border border-edge bg-panel',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionLabel ({ children, right }) {
  return (
    <div className="mb-2 flex items-baseline justify-between px-1">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">{children}</h2>
      {right}
    </div>
  );
}

/* ---------- controls ---------- */

const BTN = {
  primary:
    'bg-amber text-chassis border-amber-deep font-semibold ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_2px_6px_rgba(0,0,0,0.45)] ' +
    'active:shadow-[0_1px_2px_rgba(0,0,0,0.5)_inset]',
  solid:
    'bg-panel-2 text-ink border-edge-lit ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_5px_rgba(0,0,0,0.35)] ' +
    'active:shadow-[0_1px_3px_rgba(0,0,0,0.5)_inset]',
  ghost: 'bg-transparent text-ink-dim border-edge active:bg-panel-2',
  danger: 'bg-transparent text-alert border-alert/40 active:bg-alert/10'
};

export function Btn ({ variant = 'solid', className, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center gap-1.5 rounded-lg border',
        'px-3 py-2 text-sm transition-[transform,background-color,box-shadow] duration-100',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
        BTN[variant],
        className
      )}
      {...rest}
    />
  );
}

/* A round tap target for the small destructive or secondary actions that sit
   inside a row. 40px so it is still hittable with a thumb. */
export function IconBtn ({ label, className, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        'border border-edge text-ink-faint transition active:translate-y-px active:bg-panel-2',
        className
      )}
      {...rest}
    />
  );
}

const FIELD_BASE =
  'w-full rounded-lg border border-edge bg-chassis px-3 py-2.5 text-ink ' +
  'placeholder:text-ink-faint outline-none transition ' +
  'focus:border-amber/60 focus:ring-2 focus:ring-amber/15';

export function Field ({ label, hint, className, ...rest }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </span>
      )}
      <input className={FIELD_BASE} {...rest} />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Area ({ label, rows = 3, className, ...rest }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </span>
      )}
      <textarea rows={rows} className={cx(FIELD_BASE, 'resize-y leading-relaxed')} {...rest} />
    </label>
  );
}

export function Picker ({ label, options, className, ...rest }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </span>
      )}
      <select className={cx(FIELD_BASE, 'appearance-none pr-8')} {...rest}>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/* A row of tactile switches. Used for status and priority, where seeing all
   the options at once matters more than saving the width. */
export function Switcher ({ value, options, onChange, tone = () => 'amber', scroll = false, className }) {
  return (
    <div
      className={cx(
        'flex gap-1.5',
        // Filter rows scroll sideways instead of wrapping: two wrapped rows of
        // chips push the actual list off the screen.
        scroll ? 'vv-no-bar -mx-3 overflow-x-auto px-3 pb-0.5' : 'flex-wrap',
        className
      )}
    >
      {options.map(opt => {
        const on = value === opt;
        const t = tone(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cx(
              'shrink-0 rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider',
              'transition duration-100 active:translate-y-px',
              on
                ? TONE_ON[t]
                : 'border-edge bg-chassis text-ink-faint active:bg-panel-2'
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const TONE_ON = {
  amber: 'border-amber/60 bg-amber/15 text-amber shadow-[0_0_0_1px_rgba(224,164,88,0.15)_inset]',
  led: 'border-led/60 bg-led/15 text-led',
  alert: 'border-alert/60 bg-alert/15 text-alert',
  cool: 'border-edge-lit bg-panel-2 text-ink'
};

export function Tag ({ children, onRemove, tone = 'cool', className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        TONE_ON[tone],
        className
      )}
    >
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-current/70 active:text-current" aria-label="Remove tag">
          &times;
        </button>
      )}
    </span>
  );
}

/* ---------- feedback ---------- */

export function Progress ({ value, total, tone = 'amber' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-chassis ring-1 ring-edge">
        <div
          className={cx(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            tone === 'led' ? 'bg-led' : 'bg-amber'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-[11px] text-ink-dim tabular-nums">{pct}%</span>
    </div>
  );
}

export function Empty ({ title, children }) {
  return (
    <div className="rounded-panel border border-dashed border-edge px-5 py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed text-ink-faint">{children}</p>}
    </div>
  );
}

/* ---------- bottom sheet ---------- */

/*
 * Forms live in a sheet rather than a separate route: on a phone the thing you
 * were looking at should still be behind the thing you are typing into, and
 * closing should never feel like navigating back.
 */
export function Sheet ({ open, title, onClose, children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="vv-fade-in absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'vv-sheet-in relative flex max-h-[88vh] w-full max-w-lg flex-col',
          'rounded-t-2xl border-t border-x border-edge-lit bg-panel',
          'shadow-[0_-12px_40px_rgba(0,0,0,0.6)]'
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
          <div className="absolute left-1/2 top-1.5 h-1 w-9 -translate-x-1/2 rounded-full bg-edge-lit" />
          <h2 className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink">{title}</h2>
          <IconBtn label="Close" onClick={onClose}>&times;</IconBtn>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="border-t border-edge px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* Two-step delete. A confirm() dialog is jarring inside an installed app, and
   an undo toast is more machinery than a personal tracker needs. */
export function DeleteButton ({ onDelete, label = 'Delete' }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <IconBtn label={label} onClick={() => setArmed(true)} className="active:text-alert">
        <TrashIcon />
      </IconBtn>
    );
  }
  return (
    <Btn variant="danger" className="px-2 py-1.5 font-mono text-[11px] uppercase" onClick={onDelete}>
      Sure?
    </Btn>
  );
}

/* ---------- icons ---------- */
/* Inline so the app has no icon font and no network dependency. */

const svg = props => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...props
});

export const TrashIcon = p => (
  <svg width="16" height="16" {...svg(p)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

export const PlusIcon = p => (
  <svg width="18" height="18" {...svg(p)}><path d="M12 5v14M5 12h14" /></svg>
);

export const SearchIcon = p => (
  <svg width="16" height="16" {...svg(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

export const EditIcon = p => (
  <svg width="16" height="16" {...svg(p)}>
    <path d="M4 20h4l10-10-4-4L4 16v4ZM14.5 5.5l4 4" />
  </svg>
);

export const LinkIcon = p => (
  <svg width="14" height="14" {...svg(p)}>
    <path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18l1-1" />
  </svg>
);

export const ChevronIcon = p => (
  <svg width="16" height="16" {...svg(p)}><path d="m9 6 6 6-6 6" /></svg>
);

export { cx };
