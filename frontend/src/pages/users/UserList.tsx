import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, UserPlus, Shield } from 'lucide-react';
import { User } from '../../types/api';

const userSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.string().min(1, 'Required'),
});

type UserFormValues = z.infer<typeof userSchema>;

const UserList: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit } = usePagination();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load users
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => usersApi.findAll({ page, limit }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const onSubmit = (values: UserFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Staff</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Manage physician logins, receptionists, accountants, and portal access</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Staff member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load users: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold">
                {data?.data?.map((u: User) => (
                  <tr key={u._id} className="hover:bg-gray-55/30">
                    <td className="px-6 py-4 font-bold text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-6 py-4 text-gray-550 font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
                        <Shield className="h-3 w-3" /> {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.isActive ? 'success' : 'gray'}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.isActive ? 'text-red-650 hover:bg-red-50 font-bold' : 'text-emerald-600 hover:bg-emerald-50 font-bold'}
                          onClick={() => toggleStatusMutation.mutate({ id: u._id, isActive: !u.isActive })}
                          loading={toggleStatusMutation.isPending}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Invite Staff Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>Create Login</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Last Name" required {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <Input label="Email Address" type="email" required {...register('email')} error={errors.email?.message} />
          <Input label="Login Password" type="password" required {...register('password')} error={errors.password?.message} />
          <Select
            label="System Security Role"
            required
            options={[
              { value: 'DOCTOR', label: 'Doctor / Physician' },
              { value: 'NURSE', label: 'Nurse Practitioner' },
              { value: 'RECEPTIONIST', label: 'Reception / Front Desk' },
              { value: 'PHARMACIST', label: 'Pharmacist' },
              { value: 'LAB_TECHNICIAN', label: 'Lab Technician' },
              { value: 'RADIOLOGIST', label: 'Radiologist' },
              { value: 'ACCOUNTANT', label: 'Accountant' },
              { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
              { value: 'HOSPITAL_ADMIN', label: 'Hospital Admin' },
            ]}
            {...register('role')}
            error={errors.role?.message}
          />
        </form>
      </Modal>
    </div>
  );
};

export default UserList;
