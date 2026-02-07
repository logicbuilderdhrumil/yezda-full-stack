/**
 * Organization Perspective Switcher.
 * Allows admin users to select an organization and view the client portal
 * from that organization's perspective.
 */
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Building2, ChevronDown, X, Search } from 'lucide-react';
import { useOrgPerspective } from '@/context/OrgPerspectiveContext';
import { OrganizationsService } from '@/services/OrganizationsService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Input,
} from '@/components/ui';
import { cn } from '@/utils';
import type { Organization } from '@/@types/organization';

interface OrgPerspectiveSwitcherProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * OrgPerspectiveSwitcher provides a dropdown for admins to select
 * which organization to view as in the client portal.
 */
export function OrgPerspectiveSwitcher({ className }: OrgPerspectiveSwitcherProps): ReactNode {
  const { activeOrgId, activeOrgName, isPerspectiveMode, setActiveOrg, clearPerspective } =
    useOrgPerspective();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch organizations when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrganizations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await OrganizationsService.list({ pageSize: 100 });
        setOrganizations(response.data);
      } catch (err) {
        setError('Failed to load organizations');
        console.error('Failed to fetch organizations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [isOpen]);

  // Filter organizations by search query
  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const query = searchQuery.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.slug?.toLowerCase().includes(query) ||
        org.primaryContactEmail?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  const handleSelectOrg = (org: Organization) => {
    setActiveOrg(org.id, org.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearPerspective = () => {
    clearPerspective();
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2 text-sm font-normal',
            isPerspectiveMode &&
              'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/40',
            className
          )}
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[150px] truncate">
            {isPerspectiveMode ? activeOrgName : 'View as Org...'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 bg-neutral-900 border-neutral-700"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-neutral-400 font-normal text-xs uppercase tracking-wide">
          Organization Perspective
        </DropdownMenuLabel>

        {/* Search input */}
        <div className="px-2 py-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-neutral-700" />

        {/* Loading state */}
        {isLoading && (
          <div className="px-2 py-4 text-center text-sm text-neutral-400">
            Loading organizations...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="px-2 py-4 text-center text-sm text-red-400">{error}</div>
        )}

        {/* Organizations list */}
        {!isLoading && !error && (
          <div className="max-h-60 overflow-y-auto">
            {filteredOrganizations.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-neutral-400">
                {searchQuery ? 'No organizations found' : 'No organizations available'}
              </div>
            ) : (
              filteredOrganizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelectOrg(org)}
                  className={cn(
                    'cursor-pointer focus:bg-neutral-800 focus:text-neutral-100',
                    activeOrgId === org.id && 'bg-neutral-800'
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="truncate font-medium">{org.name}</span>
                    {org.slug && (
                      <span className="text-xs text-neutral-500 truncate">{org.slug}</span>
                    )}
                  </div>
                  {activeOrgId === org.id && (
                    <span className="ml-auto text-xs text-amber-500">Active</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </div>
        )}

        {/* Exit perspective option */}
        {isPerspectiveMode && (
          <>
            <DropdownMenuSeparator className="bg-neutral-700" />
            <DropdownMenuItem
              onClick={handleClearPerspective}
              className="cursor-pointer text-amber-400 focus:bg-amber-900/20 focus:text-amber-300"
            >
              <X className="h-4 w-4 mr-2" />
              Exit Perspective Mode
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
