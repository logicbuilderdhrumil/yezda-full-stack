/**
 * OrganizationSelector – searchable dropdown for multi-tenant context switching.
 *
 * Uses a Popover + filterable list pattern (pure Radix/Tailwind, no cmdk dependency).
 * If fewer than 6 organizations are provided the search input is hidden.
 */
import { useState, useMemo, type ReactNode } from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui';
import type { OrganizationSelectorProps, OrganizationOption } from '@/@types/custom-components';

// ============================================================================
// AVATAR FALLBACK
// ============================================================================

/** Renders an org logo or a two-letter fallback. */
function OrgAvatar({ org }: { org: OrganizationOption }): ReactNode {
  const initials = org.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (org.logoUrl) {
    return (
      <img
        src={org.logoUrl}
        alt={org.name}
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
      {initials}
    </span>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dropdown selector for switching the active organization.
 *
 * @example
 * ```tsx
 * <OrganizationSelector
 *   organizations={orgs}
 *   selectedOrgId={currentOrgId}
 *   onSelect={handleOrgChange}
 * />
 * ```
 */
export function OrganizationSelector({
  organizations,
  selectedOrgId,
  onSelect,
  disabled = false,
  placeholder = 'Select organization',
  className,
}: OrganizationSelectorProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = organizations.find((o) => o.id === selectedOrgId);
  const showSearch = organizations.length > 5;

  const filtered = useMemo(() => {
    if (!search) return organizations;
    const q = search.toLowerCase();
    return organizations.filter((o) => o.name.toLowerCase().includes(q));
  }, [organizations, search]);

  function handleSelect(orgId: string) {
    onSelect(orgId);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className={cn('relative inline-block text-left', className)}>
      {/* Trigger */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <OrgAvatar org={selected} />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronIcon open={open} />
      </Button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSearch('');
            }}
            aria-hidden="true"
          />

          <div className="absolute left-0 z-50 mt-1 w-full min-w-[220px] rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {/* Search */}
            {showSearch && (
              <div className="border-b border-gray-200 p-2 dark:border-gray-700">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search organizations…"
                  className="w-full rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:text-gray-100"
                  autoFocus
                />
              </div>
            )}

            {/* List */}
            <ul
              role="listbox"
              aria-label="Organizations"
              className="max-h-60 overflow-y-auto p-1"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No organizations found
                </li>
              )}
              {filtered.map((org) => {
                const isSelected = org.id === selectedOrgId;
                return (
                  <li
                    key={org.id}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      isSelected && 'bg-gray-100 font-medium dark:bg-gray-700',
                    )}
                    onClick={() => handleSelect(org.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(org.id);
                      }
                    }}
                    tabIndex={0}
                  >
                    <OrgAvatar org={org} />
                    <span className="flex-1 truncate">{org.name}</span>
                    {org.memberCount !== undefined && (
                      <span className="text-xs text-gray-400">
                        {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    )}
                    {isSelected && <CheckIcon />}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// ICONS (inline SVGs to avoid extra icon dependency)
// ============================================================================

function ChevronIcon({ open }: { open: boolean }): ReactNode {
  return (
    <svg
      className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon(): ReactNode {
  return (
    <svg
      className="h-4 w-4 text-primary-600 dark:text-primary-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
