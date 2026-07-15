import { SystemRole } from '../enums';

export const RESOURCES = [
  'tenants',
  'users',
  'roles',
  'patients',
  'doctors',
  'departments',
  'appointments',
  'medical-records',
  'prescriptions',
  'pharmacy',
  'laboratory',
  'radiology',
  'inventory',
  'insurance',
  'billing',
  'files',
  'settings',
  'reports',
  'audit-logs',
] as const;

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

export const permission = (resource: Resource, action: Action): string => `${resource}:${action}`;

export const ALL_PERMISSIONS: string[] = RESOURCES.flatMap((r) =>
  ACTIONS.map((a) => permission(r, a)),
);

const crud = (r: Resource): string[] => ACTIONS.map((a) => permission(r, a));
const of = (r: Resource, ...actions: Action[]): string[] => actions.map((a) => permission(r, a));

/** Default permission bundles for system roles (used by seed + custom-role catalog). */
export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  [SystemRole.SUPER_ADMIN]: ALL_PERMISSIONS,

  [SystemRole.HOSPITAL_ADMIN]: [
    ...of('tenants', 'read'),
    ...crud('users'),
    ...crud('roles'),
    ...crud('patients'),
    ...crud('doctors'),
    ...crud('departments'),
    ...crud('appointments'),
    ...of('medical-records', 'read'),
    ...of('prescriptions', 'read'),
    ...of('pharmacy', 'read'),
    ...of('laboratory', 'read'),
    ...of('radiology', 'read'),
    ...crud('inventory'),
    ...crud('insurance'),
    ...crud('billing'),
    ...of('files', 'read', 'delete'),
    ...crud('settings'),
    ...of('reports', 'read'),
    ...of('audit-logs', 'read'),
  ],

  [SystemRole.DOCTOR]: [
    ...of('patients', 'read', 'update'),
    ...of('doctors', 'read'),
    ...of('departments', 'read'),
    ...of('appointments', 'read', 'update'),
    ...crud('medical-records'),
    ...crud('prescriptions'),
    ...of('laboratory', 'create', 'read'),
    ...of('radiology', 'create', 'read'),
    ...of('pharmacy', 'read'),
    ...of('files', 'create', 'read'),
    ...of('reports', 'read'),
  ],

  [SystemRole.NURSE]: [
    ...of('patients', 'read', 'update'),
    ...of('doctors', 'read'),
    ...of('departments', 'read'),
    ...of('appointments', 'read'),
    ...of('medical-records', 'create', 'read', 'update'),
    ...of('prescriptions', 'read'),
    ...of('laboratory', 'read'),
    ...of('radiology', 'read'),
    ...of('files', 'create', 'read'),
  ],

  [SystemRole.RECEPTIONIST]: [
    ...of('patients', 'create', 'read', 'update'),
    ...of('doctors', 'read'),
    ...of('departments', 'read'),
    ...crud('appointments'),
    ...of('billing', 'create', 'read'),
    ...of('insurance', 'read'),
    ...of('files', 'create', 'read'),
  ],

  [SystemRole.PHARMACIST]: [
    ...of('patients', 'read'),
    ...of('prescriptions', 'read', 'update'),
    ...crud('pharmacy'),
    ...of('inventory', 'read', 'update'),
    ...of('files', 'read'),
  ],

  [SystemRole.LAB_TECHNICIAN]: [
    ...of('patients', 'read'),
    ...of('medical-records', 'read'),
    ...crud('laboratory'),
    ...of('files', 'create', 'read'),
  ],

  [SystemRole.RADIOLOGIST]: [
    ...of('patients', 'read'),
    ...of('medical-records', 'read'),
    ...crud('radiology'),
    ...of('files', 'create', 'read'),
  ],

  [SystemRole.ACCOUNTANT]: [
    ...of('patients', 'read'),
    ...crud('billing'),
    ...crud('insurance'),
    ...of('reports', 'read'),
    ...of('audit-logs', 'read'),
  ],

  [SystemRole.INVENTORY_MANAGER]: [
    ...crud('inventory'),
    ...of('pharmacy', 'read'),
    ...of('reports', 'read'),
  ],
};
