import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Input, Select, Card, Spinner, Alert } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Search, Eye } from 'lucide-react';
import { Patient } from '../../types/api';

const patientSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit phone'),
  email: z.string().email().optional().or(z.literal('')),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  abhaId: z.string().optional(),
  address: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { page, limit, setPage } = usePagination();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');

  // Load patients
  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', page, limit, debouncedSearch, sortBy, sortOrder],
    queryFn: () => patientsApi.findAll({ page, limit, search: debouncedSearch, sortBy, sortOrder }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(patientSchema),
    defaultValues: { gender: 'MALE' }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const onSubmit = (values: any) => {
    const payload = {
      ...values,
      email: values.email || undefined,
      bloodGroup: values.bloodGroup || undefined,
      abhaId: values.abhaId || undefined,
      address: values.address || undefined,
      dob: values.dob ? new Date(values.dob) : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Cohort</h1>
          <p className="text-sm text-gray-500 font-semibold">Search, list, and register clinical patients</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Register Patient
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by MRN, Name, Phone..."
            className="flex-1 text-sm bg-transparent outline-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2 ml-0 sm:ml-4">
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="createdAt">Newest</option>
            <option value="mrn">MRN</option>
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
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
        <Alert variant="danger">Failed to load patients: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">MRN</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Age / DoB</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data?.data?.map((patient: Patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-primary-700">{patient.mrn}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{patient.firstName} {patient.lastName}</td>
                    <td className="px-6 py-4 font-semibold">{patient.gender}</td>
                    <td className="px-6 py-4 font-semibold">{patient.phone}</td>
                    <td className="px-6 py-4 font-medium">
                      {patient.dob ? new Date(patient.dob).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/patients/${patient._id}`)}
                        className="inline-flex items-center gap-1.5 font-bold"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View File
                      </Button>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 font-semibold">
                      No patients matched search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-bold">
                Showing page {page} of {data.meta.totalPages} ({data.meta.total} records total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="font-bold text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="font-bold text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Register New Patient File"
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
              Register Patient
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {createMutation.isError && (
            <Alert variant="danger">{(createMutation.error as Error).message}</Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Last Name" required {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              required
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
              {...register('gender')}
              error={errors.gender?.message}
            />
            <Input label="Phone Number" required {...register('phone')} error={errors.phone?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" {...register('email')} error={errors.email?.message} />
            <Input label="Date of Birth" type="date" {...register('dob')} error={errors.dob?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Blood Group"
              options={[
                { value: '', label: 'Select Blood Group' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
              {...register('bloodGroup')}
            />
            <Input label="ABHA ID" {...register('abhaId')} />
          </div>
          <Input label="Residential Address" {...register('address')} />
        </form>
      </Modal>
    </div>
  );
};

export default PatientList;
