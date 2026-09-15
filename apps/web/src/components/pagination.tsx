'use client';

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

const pagerButton =
  'inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
const pageButton =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50';
const activePageButton =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-indigo-600 bg-indigo-600 px-2 text-sm font-medium text-white';
const perPageSelect =
  'h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

/** Páginas visíveis com reticências: 1 … (atual-1, atual, atual+1) … total. */
function pageItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('gap');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('gap');
  items.push(total);

  return items;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const pages = Math.max(totalPages, 1);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <label className="flex items-center gap-2 text-slate-500">
        <span>Exibir</span>
        <select
          className={perPageSelect}
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          aria-label="Itens por página"
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>
          por página · <span className="tabular-nums">{total}</span> no total
        </span>
      </label>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={pagerButton}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>

        {pageItems(page, pages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === page ? activePageButton : pageButton}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={pagerButton}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
