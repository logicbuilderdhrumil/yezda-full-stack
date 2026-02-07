/**
 * Organization Perspective Context.
 * Allows admin users to switch between viewing the client portal as different organizations.
 * Uses sessionStorage to persist the perspective across page refreshes and allow the axios
 * interceptor to access it outside React.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

/** Storage key for org perspective in sessionStorage. */
export const ORG_PERSPECTIVE_STORAGE_KEY = 'yezda_org_perspective';

interface OrgPerspective {
  /** ID of the organization being viewed as, or null if not in perspective mode. */
  activeOrgId: string | null;
  /** Name of the organization being viewed as, for display purposes. */
  activeOrgName: string | null;
  /** Whether the user is currently viewing as a specific org. */
  isPerspectiveMode: boolean;
  /** Sets the active organization perspective. */
  setActiveOrg: (orgId: string, orgName: string) => void;
  /** Clears the perspective and returns to normal view. */
  clearPerspective: () => void;
}

const OrgPerspectiveContext = createContext<OrgPerspective | null>(null);

interface OrgPerspectiveProviderProps {
  children: ReactNode;
}

/**
 * Reads stored perspective from sessionStorage.
 */
function getStoredPerspective(): { orgId: string | null; orgName: string | null } {
  try {
    const stored = sessionStorage.getItem(ORG_PERSPECTIVE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        orgId: parsed.orgId ?? null,
        orgName: parsed.orgName ?? null,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { orgId: null, orgName: null };
}

/**
 * OrgPerspectiveProvider manages the organization perspective state.
 * Admin users can select an organization to "view as" in the client portal.
 */
export function OrgPerspectiveProvider({ children }: OrgPerspectiveProviderProps): ReactNode {
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    return getStoredPerspective().orgId;
  });

  const [activeOrgName, setActiveOrgName] = useState<string | null>(() => {
    return getStoredPerspective().orgName;
  });

  const isPerspectiveMode = activeOrgId !== null;

  const setActiveOrg = useCallback((orgId: string, orgName: string) => {
    setActiveOrgId(orgId);
    setActiveOrgName(orgName);
    try {
      sessionStorage.setItem(
        ORG_PERSPECTIVE_STORAGE_KEY,
        JSON.stringify({ orgId, orgName })
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearPerspective = useCallback(() => {
    setActiveOrgId(null);
    setActiveOrgName(null);
    try {
      sessionStorage.removeItem(ORG_PERSPECTIVE_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const value = useMemo(
    () => ({
      activeOrgId,
      activeOrgName,
      isPerspectiveMode,
      setActiveOrg,
      clearPerspective,
    }),
    [activeOrgId, activeOrgName, isPerspectiveMode, setActiveOrg, clearPerspective]
  );

  return (
    <OrgPerspectiveContext.Provider value={value}>
      {children}
    </OrgPerspectiveContext.Provider>
  );
}

/**
 * useOrgPerspective hook provides access to the organization perspective state.
 * Must be used within an OrgPerspectiveProvider.
 */
export function useOrgPerspective(): OrgPerspective {
  const context = useContext(OrgPerspectiveContext);
  if (!context) {
    throw new Error('useOrgPerspective must be used within OrgPerspectiveProvider');
  }
  return context;
}
