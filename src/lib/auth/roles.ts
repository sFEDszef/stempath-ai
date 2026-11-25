/** Roles come from the authenticated server session, never a URL or login choice. */
export function isResearchRole(role: unknown): boolean {
  return role === 'ADMIN' || role === 'RESEARCHER';
}
