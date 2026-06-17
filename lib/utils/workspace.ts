/**
 * Workspace utility functions for managing workspace preferences
 */

/**
 * Set cookie to mark that user has visited workspace
 * Allows direct dashboard access for 24 hours
 */
export function setVisitedWorkspace() {
  document.cookie = 'visited_workspace=true; path=/; max-age=86400'; // 24 hours
}

/**
 * Set cookie to skip workspace page permanently
 * User will go directly to dashboard on future logins
 */
export function setSkipWorkspace() {
  document.cookie = 'skip_workspace=true; path=/; max-age=2592000'; // 30 days
  document.cookie = 'visited_workspace=true; path=/; max-age=86400'; // 24 hours
}

/**
 * Clear skip workspace preference
 * User will see workspace page on next login
 */
export function clearSkipWorkspace() {
  document.cookie = 'skip_workspace=; path=/; max-age=0'; // Delete cookie
  document.cookie = 'visited_workspace=; path=/; max-age=0'; // Delete cookie
}

/**
 * Check if user has set skip workspace preference
 */
export function hasSkipWorkspace(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('skip_workspace=true');
}

/**
 * Check if user has visited workspace recently
 */
export function hasVisitedWorkspace(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('visited_workspace=true');
}

/**
 * Get workspace preference status
 */
export function getWorkspacePreference(): {
  skipWorkspace: boolean;
  visitedRecently: boolean;
  willShowWorkspace: boolean;
} {
  const skipWorkspace = hasSkipWorkspace();
  const visitedRecently = hasVisitedWorkspace();
  const willShowWorkspace = !skipWorkspace && !visitedRecently;

  return {
    skipWorkspace,
    visitedRecently,
    willShowWorkspace,
  };
}
