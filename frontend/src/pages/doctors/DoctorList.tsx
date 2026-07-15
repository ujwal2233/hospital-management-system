import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, departmentsApi, usersApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Input, Select, Card, Spinner, Alert } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { Doctor } from '../../types/api';

const doctorSchema = z.object({
  name: z.string().min(2, 'Required'),
  specialization: z.string().min(2, 'Required'),
  departmentId: z.string().min(1, 'Required'),
  licenseNumber: z.string().min(2, 'Required'),
  consultationFee: z.number().min(0, 'Must be positive'),
  userId: z.string().optional().or(z.literal('')),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

const DoctorList: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit, setPage } = usePagination();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');

  // Load doctors
  const { data, isLoading, error } = useQuery({
    queryKey: ['doctors', page, limit, debouncedSearch, sortBy, sortOrder],
    queryFn: () => doctorsApi.findAll({ page, limit, search: debouncedSearch, sortBy, sortOrder }),
  });

  // Load departments for selector
  const { data: depts } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.findAll({ limit: 100 }),
  });

  // Load user roles to see eligible staff
  const { data: users } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => usersApi.findAll({ limit: 100 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { consultationFee: 500 }
  });

  const createMutation = useMutation({
    mutationFn: doctorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const onSubmit = (values: any) => {
    const payload = {
      ...values,
      userId: values.userId || undefined,
    };
    createMutation.mutate(payload);
  };

  const deptOptions = (depts?.data || []).map((d: any) => ({ value: d._id, label: `${d.name} (${d.code})` }));
  deptOptions.unshift({ value: '', label: 'Select Department' });

  const userOptions = (users?.data || [])
    .filter((u: any) => u.role === 'DOCTOR')
    .map((u: any) => ({ value: u._id, label: `${u.firstName} ${u.lastName} (${u.email})` }));
  userOptions.unshift({ value: '', label: 'Select Linked Login (Optional)' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinicians</h1>
          <p className="text-sm text-gray-500 font-semibold">Manage doctor directory, fees, and links to logins</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Doctor Profile
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by name, specialization, license..."
          className="flex-1 text-sm bg-transparent outline-none"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="flex items-center gap-2 ml-4">
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="createdAt">Newest</option>
            <option value="name">Name</option>
            <option value="specialization">Specialization</option>
            <option value="consultationFee">Fee</option>
          </select>
          <button
            className="text-sm px-2 py-1 border rounded bg-gray-50"
            onClick={() => setSortOrder((s) => (s === 'asc' ? 'desc' : 'asc'))}
            type="button"
          >
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load doctor profiles: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">License Number</th>
                  <th className="px-6 py-4">Consultation Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data?.data?.map((doc: Doctor) => (
                  <tr key={doc._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 font-semibold">{doc.specialization}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {typeof doc.departmentId === 'object' ? doc.departmentId?.name : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{doc.licenseNumber}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{doc.consultationFee}</td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 font-semibold">
                      No doctor profiles configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Add Doctor Profile"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
              Create Profile
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {createMutation.isError && (
            <Alert variant="danger">{(createMutation.error as Error).message}</Alert>
          )}
          <Input label="Doctor's Full Name" required {...register('name')} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Specialization" required {...register('specialization')} error={errors.specialization?.message} />
            <Select label="Clinical Department" required options={deptOptions} {...register('departmentId')} error={errors.departmentId?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="License / Registration No." required {...register('licenseNumber')} error={errors.licenseNumber?.message} />
            <Input
              label="Consultation Fee (₹)"
              type="number"
              required
              {...register('consultationFee', { valueAsNumber: true })}
              error={errors.consultationFee?.message}
            />
          </div>
          <Select label="Linked Operator Profile" options={userOptions} {...register('userId')} />
        </form>
      </Modal>
    </div>
  );
};

export default DoctorList;
