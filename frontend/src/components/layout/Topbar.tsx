import React, { useState } from 'react';
import { useAuth, TenantScope } from '../../auth/AuthContext';
import { LogOut, User as UserIcon, Menu, Building2, Globe, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '../../api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui';

interface TopbarProps {
  onOpenSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const { user, logout, activeScope, setScope } = useAuth();
  const queryClient = useQueryClient();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.findAll(),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const tenants: any[] = (tenantsData as any)?.data ?? tenantsData ?? [];

  const handleSelectScope = (scope: TenantScope | null) => {
    setScope(scope);
    setIsSwitcherOpen(false);
    queryClient.invalidateQueries();
  };

  return (
    <>
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">Clinical Operations Workspace</h1>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Hospital Unit Online
            </span>
          </div>

          {/* Super Admin Scope Pill */}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-slate-300 font-light">|</span>
              {activeScope ? (
                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs animate-pulse">
                  <Building2 className="h-3.5 w-3.5 text-white" />
                  <span>Hospital Scope: {activeScope.name} [{activeScope.code}]</span>
                  <button
                    onClick={() => handleSelectScope(null)}
                    title="Exit Scope / Switch back to Global"
                    className="ml-1 text-emerald-100 hover:text-white font-black text-sm focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                  <Globe className="h-3.5 w-3.5 text-primary-600" />
                  <span>Global Scope (All Hospitals)</span>
                </div>
              )}
              <button
                onClick={() => setIsSwitcherOpen(true)}
                className="text-xs font-bold text-primary-600 hover:text-primary-800 underline flex items-center gap-1 focus:outline-none ml-1"
              >
                <span>Switch Scope</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3.5">
          {/* Mobile Super Admin Scope Button */}
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setIsSwitcherOpen(true)}
              className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {activeScope ? <Building2 className="h-3.5 w-3.5 text-emerald-600" /> : <Globe className="h-3.5 w-3.5 text-primary-600" />}
              <span>{activeScope ? activeScope.code : 'Global'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200/80">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center border border-primary-200/60 shadow-2xs">
              <UserIcon className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-extrabold text-slate-900 leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : 'Clinical Staff'}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:bg-rose-100 text-xs font-bold text-slate-600 transition-all focus:outline-none shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Scope Switcher Modal */}
      <Modal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        title="Select Hospital Workspace Scope"
        footer={
          <Button variant="outline" onClick={() => setIsSwitcherOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium">
            As a Super Admin, you can switch your active operational scope to manage data, staff users, and access roles isolated to a specific hospital code.
          </p>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Global option */}
            <div
              onClick={() => handleSelectScope(null)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                !activeScope
                  ? 'bg-primary-50 border-primary-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-bold">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Global Scope (Platform-Wide)</h4>
                  <p className="text-xs text-gray-500 font-medium">View aggregated analytics across all registered hospitals</p>
                </div>
              </div>
              {!activeScope && <Check className="h-5 w-5 text-primary-600 font-extrabold" />}
            </div>

            {/* Hospital list */}
            {tenants.map((t) => {
              const isSelected = activeScope?.id === t._id;
              return (
                <div
                  key={t._id}
                  onClick={() => handleSelectScope({ id: t._id, code: t.code, name: t.name })}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-sm">
                      {t.code.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                        <span className="font-mono text-xs font-extrabold bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          {t.code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {t.address?.city ? `${t.address.city}, ${t.address.state || ''}` : 'No location specified'}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <Check className="h-5 w-5 text-emerald-600 font-extrabold" />
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 opacity-0 hover:opacity-100 transition-opacity">
                      Enter Scope →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
};
