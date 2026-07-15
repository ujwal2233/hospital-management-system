import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api';
import { Button, Input, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, Plus, Check } from 'lucide-react';
import { Role } from '../../types/api';

const roleSchema = z.object({
  name: z.string().min(2, 'Required'),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Available system permissions resources
const RESOURCES = [
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
];

const ACTIONS = ['create', 'read', 'update', 'delete'];

const normalizeRoleName = (name: string) =>
  name
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

const RoleList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Load roles
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.findAll,
  });

  const roleRows = (roles as any)?.data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { permissions: [] }
  });

  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      reset();
      setSelectedPermissions([]);
    },
  });

  const handleTogglePermission = (perm: string) => {
    setPermissionError(null);
    let updated: string[];
    if (selectedPermissions.includes(perm)) {
      updated = selectedPermissions.filter((p) => p !== perm);
    } else {
      updated = [...selectedPermissions, perm];
    }
    setSelectedPermissions(updated);
    setValue('permissions', updated);
  };

  const onSubmit = (values: RoleFormValues) => {
    if (selectedPermissions.length === 0) {
      setPermissionError('At least 1 permission is required');
      return;
    }
    createMutation.mutate({
      name: normalizeRoleName(values.name),
      permissions: selectedPermissions,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Roles & Policies</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Configure system security scopes and define custom role templates</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Custom Role
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load roles: {error.message}</Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleRows.map((role: Role) => (
            <Card key={role._id} className="p-6 border border-gray-200 flex flex-col justify-between h-[360px]">
              <div>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <span className="flex items-center gap-2 font-bold text-gray-800 text-lg">
                    <ShieldCheck className="h-5 w-5 text-primary-500" />
                    {role.name}
                  </span>
                  <Badge variant={role.isSystem ? 'info' : 'primary'}>
                    {role.isSystem ? 'System Core' : 'Custom'}
                  </Badge>
                </div>
                <div className="overflow-y-auto max-h-[200px] pr-1 space-y-1.5">
                  <span className="text-xs text-gray-400 font-bold block mb-2">Granted Scopes ({role.permissions?.length || 0})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions?.map((p) => (
                      <span key={p} className="bg-gray-50 text-gray-650 border border-gray-150 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
          setSelectedPermissions([]);
        }}
        title="Create Custom Access Role"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>Configure Role</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Custom Role Name" required placeholder="e.g. Ward Pharmacist" {...register('name')} error={errors.name?.message} />
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 block">Select Permission Matrices</label>
            {permissionError && <span className="text-xs text-red-650 font-bold block mb-1">{permissionError}</span>}
            
            <div className="max-h-[220px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-4">
              {RESOURCES.map((res) => (
                <div key={res} className="border-b border-gray-150 pb-3 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-gray-900 block mb-2 uppercase tracking-wide">{res.replace('-', ' ')}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ACTIONS.map((act) => {
                      const perm = `${res}:${act}`;
                      const isChecked = selectedPermissions.includes(perm);
                      return (
                        <button
                          type="button"
                          key={act}
                          onClick={() => handleTogglePermission(perm)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold border transition-all ${
                            isChecked
                              ? 'bg-primary-50 border-primary-300 text-primary-700 font-bold'
                              : 'bg-white border-gray-250 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 bg-white'}`}>
                            {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                          <span className="capitalize">{act}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoleList;
