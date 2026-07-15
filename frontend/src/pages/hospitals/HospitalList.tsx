import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { tenantsApi } from '../../api';
import { Button, Input, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { Plus, Hospital, MapPin, Phone, Mail, Edit2, CheckCircle, XCircle, ArrowRight, Building2, Check } from 'lucide-react';
import { Tenant } from '../../types/api';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── schema ─────────────────────────────────────────────────────────────────
const tenantSchema = z.object({
  name: z.string().min(2, 'Hospital name is required').max(120),
  code: z
    .string()
    .min(2, 'Code must be 2-10 characters')
    .max(10)
    .regex(/^[A-Za-z0-9]+$/, 'Only letters and numbers allowed'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[6-9]\d{9}$/.test(v), 'Must be a valid 10-digit Indian mobile number'),
  email: z.string().optional().refine((v) => !v || z.string().email().safeParse(v).success, 'Invalid email'),
  gstin: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    city:  z.string().optional(),
    state: z.string().optional(),
    pincode: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{6}$/.test(v), 'Pincode must be 6 digits'),
  }).optional(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

// ─── component ───────────────────────────────────────────────────────────────
const HospitalList: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeScope, setScope } = useAuth();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);

  // ── queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.findAll(),
  });

  const tenants: Tenant[] = (data as any)?.data ?? data ?? [];

  // ── form (shared for create & edit) ─────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { address: {} },
  });

  // ── mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tenants'] });

  const createMutation = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => { invalidate(); setIsCreateOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tenantsApi.update(id, data),
    onSuccess: () => { invalidate(); setEditTenant(null); reset(); },
  });

  // ── handlers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    reset({ address: {} });
    setIsCreateOpen(true);
  };

  const openEdit = (t: Tenant) => {
    reset({
      name:    t.name,
      code:    t.code,
      phone:   t.phone ?? '',
      email:   t.email ?? '',
      gstin:   t.gstin ?? '',
      address: t.address ?? {},
    });
    setEditTenant(t);
  };

  const onSubmitCreate = (values: TenantFormValues) => {
    createMutation.mutate(values as any);
  };

  const onSubmitEdit = (values: TenantFormValues) => {
    if (!editTenant) return;
    updateMutation.mutate({ id: editTenant._id, data: values });
  };

  const handleEnterScope = (t: Tenant) => {
    setScope({ id: t._id, code: t.code, name: t.name });
    navigate('/users');
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
          <p className="text-sm text-gray-500 font-semibold">
            Manage hospital tenants registered in this HMS platform
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Register Hospital
        </Button>
      </div>

      {/* Error */}
      {error && <Alert variant="danger">Failed to load hospitals: {(error as Error).message}</Alert>}
      {createMutation.isError && (
        <Alert variant="danger">Create failed: {(createMutation.error as Error)?.message}</Alert>
      )}
      {updateMutation.isError && (
        <Alert variant="danger">Update failed: {(updateMutation.error as Error)?.message}</Alert>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Hospitals', value: tenants.length },
          { label: 'Active',   value: tenants.filter((t) => t.isActive).length },
          { label: 'Inactive', value: tenants.filter((t) => !t.isActive).length },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-2xl font-extrabold text-gray-900">{isLoading ? '—' : s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold uppercase text-gray-500 tracking-wider bg-gray-50">
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">GSTIN</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {tenants.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {t.code.slice(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {t.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {t.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="h-3 w-3" /> {t.phone}
                        </div>
                      )}
                      {t.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Mail className="h-3 w-3" /> {t.email}
                        </div>
                      )}
                      {!t.phone && !t.email && <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {t.address?.city ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {[t.address.city, t.address.state].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      {t.gstin || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {t.isActive ? (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <XCircle className="h-3 w-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeScope?.id === t._id ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                            <Check className="h-3.5 w-3.5" /> Active Scope
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleEnterScope(t)}
                            className="inline-flex items-center gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-bold"
                          >
                            <Building2 className="h-3 w-3" /> Enter Scope <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(t)}
                          className="inline-flex items-center gap-1.5 text-xs"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 font-semibold">
                      <Hospital className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No hospitals registered yet. Click "Register Hospital" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Register / Edit Modal (shared form) ───────────────────────── */}
      {[
        { open: isCreateOpen, title: 'Register New Hospital', onClose: () => { setIsCreateOpen(false); reset(); }, onSubmit: onSubmitCreate, isPending: createMutation.isPending, btnLabel: 'Register Hospital' },
        { open: !!editTenant, title: 'Edit Hospital Details',  onClose: () => { setEditTenant(null); reset(); },    onSubmit: onSubmitEdit,   isPending: updateMutation.isPending, btnLabel: 'Save Changes' },
      ].map(({ open, title, onClose, onSubmit, isPending, btnLabel }) => (
        <Modal
          key={title}
          isOpen={open}
          onClose={onClose}
          title={title}
          footer={
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit(onSubmit)} loading={isPending}>{btnLabel}</Button>
            </>
          }
        >
          <form className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Hospital Name"
                  required
                  placeholder="e.g. City General Hospital"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>
              <Input
                label="Hospital Code"
                required
                placeholder="e.g. CGH"
                {...register('code')}
                error={errors.code?.message}
              />
              <Input
                label="GSTIN"
                placeholder="22AAAAA0000A1Z5"
                {...register('gstin')}
                error={errors.gstin?.message}
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                placeholder="9876543210"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Input
                label="Email"
                type="email"
                placeholder="admin@hospital.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            {/* Address */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
              <legend className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Address</legend>
              <Input
                label="Street / Line 1"
                placeholder="123 MG Road"
                {...register('address.line1')}
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City"
                  placeholder="Mumbai"
                  {...register('address.city')}
                />
                <Input
                  label="State"
                  placeholder="Maharashtra"
                  {...register('address.state')}
                />
                <Input
                  label="Pincode"
                  placeholder="400001"
                  {...register('address.pincode')}
                  error={errors.address?.pincode?.message}
                />
              </div>
            </fieldset>

            <p className="text-xs text-gray-400">
              After registering, create a <strong>Hospital Admin</strong> user for this hospital code via the Staff Users page.
            </p>
          </form>
        </Modal>
      ))}
    </div>
  );
};

export default HospitalList;
