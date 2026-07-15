import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Card, Spinner, Alert } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { Department } from '../../types/api';

const departmentSchema = z.object({
  name: z.string().min(2, 'Required'),
  code: z.string().min(2, 'Min 2 characters').toUpperCase(),
  description: z.string().optional(),
});

type DeptFormValues = z.infer<typeof departmentSchema>;

const DepartmentList: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit } = usePagination();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load departments
  const { data, isLoading, error } = useQuery({
    queryKey: ['departments', page, limit],
    queryFn: () => departmentsApi.findAll({ page, limit }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(departmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const onSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 font-semibold">Organize clinical operations, wards, and administrative units</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load departments: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data?.data?.map((dept: Department) => (
                  <tr key={dept._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-primary-700">{dept.code}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{dept.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-semibold">{dept.description || '—'}</td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400 font-semibold">
                      No departments configured yet.
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
        title="Create Department"
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
              Create Department
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input label="Department Name" required {...register('name')} error={errors.name?.message} />
            </div>
            <Input label="Code" required {...register('code')} error={errors.code?.message} placeholder="e.g. CARD" />
          </div>
          <Input label="Description" {...register('description')} />
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentList;
