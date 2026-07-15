import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  LayoutDashboard,
  UserRound,
  Stethoscope,
  Building2,
  CalendarClock,
  FileText,
  ClipboardList,
  FolderLock,
  BadgeIndianRupee,
  UsersRound,
  Settings,
  ShieldCheck,
  Package,
  HeartHandshake,
  FlaskConical,
  Scan,
  Hospital,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  className?: string;
  mobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, mobile, onClose }) => {
  const { user, hasPermission } = useAuth();

  const navigationSections = [
    {
      title: 'Clinical Operations',
      items: [
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: null },
        { label: 'Patients', to: '/patients', icon: UserRound, permission: 'patients:read' },
        { label: 'Appointments', to: '/appointments', icon: CalendarClock, permission: 'appointments:read' },
        { label: 'Doctors', to: '/doctors', icon: Stethoscope, permission: 'doctors:read' },
        { label: 'Departments', to: '/departments', icon: Building2, permission: 'departments:read' },
      ],
    },
    {
      title: 'Care & Diagnostics',
      items: [
        { label: 'Medical Records', to: '/records', icon: FileText, permission: 'medical-records:read' },
        { label: 'Prescriptions', to: '/prescriptions', icon: ClipboardList, permission: 'prescriptions:read' },
        { label: 'Pharmacy', to: '/pharmacy', icon: FlaskConical, permission: 'pharmacy:read' },
        { label: 'Laboratory', to: '/laboratory', icon: Package, permission: 'laboratory:read' },
        { label: 'Radiology', to: '/radiology', icon: Scan, permission: 'radiology:read' },
      ],
    },
    {
      title: 'Financial & Admin',
      items: [
        { label: 'Billing & Invoices', to: '/billing', icon: BadgeIndianRupee, permission: 'billing:read' },
        { label: 'Insurance & Claims', to: '/insurance', icon: HeartHandshake, permission: 'insurance:read' },
        { label: 'Inventory Stores', to: '/inventory', icon: Package, permission: 'inventory:read' },
      ],
    },
    {
      title: 'Governance & Security',
      items: [
        { label: 'Staff Users', to: '/users', icon: UsersRound, permission: 'users:read' },
        { label: 'Access Roles', to: '/roles', icon: ShieldCheck, permission: 'roles:read' },
        { label: 'Audit Trail', to: '/audit', icon: FolderLock, permission: 'audit-logs:read' },
        { label: 'System Settings', to: '/settings', icon: Settings, permission: 'settings:read' },
      ],
    },
  ];

  const superAdminItems = [
    { label: 'Hospitals Directory', to: '/hospitals', icon: Hospital },
  ];

  const baseClasses = mobile
    ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-full bg-sidebar shadow-2xl border-r border-sidebar-border md:hidden'
    : 'hidden md:flex w-64 bg-sidebar border-r border-sidebar-border shadow-lg';

  return (
    <aside className={clsx(baseClasses, 'flex flex-col text-sidebar-text text-sm select-none', className)}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between gap-3 px-5 border-b border-sidebar-border/80 bg-sidebar-DEFAULT/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white font-extrabold shadow-md shadow-primary-900/30">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">MediCare</span>
              <span className="text-[10px] font-black uppercase bg-primary-500/30 text-primary-300 px-1.5 py-0.5 rounded border border-primary-500/40">HMS</span>
            </div>
            <span className="text-[11px] text-sidebar-muted font-semibold tracking-wide truncate max-w-[140px]">
              {user?.role?.replace('_', ' ') || 'Clinical Staff'}
            </span>
          </div>
        </div>
        {mobile && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg border border-sidebar-border p-1.5 text-sidebar-text hover:bg-white/10"
            aria-label="Close navigation"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {user?.role === 'SUPER_ADMIN' && (
          <div className="space-y-1">
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Platform Command</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse"></span>
            </div>
            {superAdminItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-semibold group",
                      isActive
                        ? "bg-gradient-to-r from-primary-600/30 to-primary-600/10 text-white font-bold border-l-4 border-primary-400 shadow-sm"
                        : "text-sidebar-muted hover:text-white hover:bg-sidebar-hover"
                    )
                  }
                >
                  <Icon className="h-4.5 w-4.5 text-primary-400 transition-transform group-hover:scale-110 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {navigationSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => item.permission === null || hasPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-muted/80">
                  {section.title}
                </span>
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 font-medium group",
                          isActive
                            ? "bg-gradient-to-r from-primary-600/30 to-primary-600/10 text-white font-bold border-l-4 border-primary-400 shadow-sm"
                            : "text-sidebar-text/80 hover:text-white hover:bg-sidebar-hover"
                        )
                      }
                    >
                      <Icon className={clsx("h-4.5 w-4.5 transition-transform group-hover:scale-110 shrink-0", 
                        item.to === '/dashboard' ? 'text-primary-400' : 'text-sidebar-muted group-hover:text-primary-300'
                      )} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-sidebar-border/80 bg-sidebar-DEFAULT/40 shrink-0">
        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-sidebar-text text-[11px]">OPD & Clinical Live</span>
          </div>
          <span className="text-[10px] font-mono text-sidebar-muted">v2.4</span>
        </div>
      </div>
    </aside>
  );
};
