import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../api';
import { Button, Input, Card, Spinner, Alert } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings } from 'lucide-react';

const settingsSchema = z.object({
  clinicName: z.string().min(2, 'Required'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Indian GSTIN format').optional().or(z.literal('')),
  taxRate: z.number().min(0).max(100).default(18),
  lowStockThreshold: z.number().min(1).default(5),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Load settings
  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.findAll,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(settingsSchema),
    values: {
      clinicName: (data?.clinicName as string) || 'City General Hospital',
      gstin: (data?.gstin as string) || '',
      taxRate: Number(data?.taxRate ?? 18),
      lowStockThreshold: Number(data?.lowStockThreshold ?? 5),
    }
  });

  const saveMutation = useMutation({
    mutationFn: settingsApi.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Settings updated successfully.');
    },
  });

  const onSubmit = (values: any) => {
    saveMutation.mutate(values);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Settings</h1>
        <p className="text-sm text-gray-500 font-semibold font-sans">Configure local hospital metadata, tax rates, and inventory thresholds</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load settings: {error.message}</Alert>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Hospital Name"
              required
              {...register('clinicName')}
              error={errors.clinicName?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hospital GSTIN Code"
                placeholder="27ABCDE1234F1Z5"
                {...register('gstin')}
                error={errors.gstin?.message}
              />
              <Input
                label="Standard GST Tax Rate (%)"
                type="number"
                required
                {...register('taxRate', { valueAsNumber: true })}
                error={errors.taxRate?.message}
              />
            </div>
            <Input
              label="Ancillary Supplies Low-Stock Threshold"
              type="number"
              required
              {...register('lowStockThreshold', { valueAsNumber: true })}
              error={errors.lowStockThreshold?.message}
            />

            <div className="border-t pt-4 flex justify-end">
              <Button type="submit" loading={saveMutation.isPending} className="flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5" /> Save Configuration
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
