/**
 * Tenant helper - provides companyId for server-side or standalone usage.
 * For client-side React components, use useCompany() from contexts/company-context.tsx instead.
 */

export function getCompanyIdFromHeaders(headers: Headers): string | null {
  return headers.get("x-company-id") || null;
}
