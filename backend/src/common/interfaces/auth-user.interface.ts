export interface AuthUser {
  userId: string;
  tenantId: string | null;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}
