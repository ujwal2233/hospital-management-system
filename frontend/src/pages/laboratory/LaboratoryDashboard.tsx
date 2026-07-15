import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { laboratoryApi, patientsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, FlaskConical, CheckCircle } from 'lucide-react';
import { LabOrder } from '../../types/api';

const orderSchema = z.object({
  patientId: z.string().min(1, 'Required'),
  testName: z.string().min(2, 'Required'),
  testCode: z.string().optional(),
  notes: z.string().optional(),
});

const resultSchema = z.object({
  results: z.array(z.object({
    parameter: z.string().min(1, 'Required'),
    value: z.string().min(1, 'Required'),
    unit: z.string().optional(),
    referenceRange: z.string().optional(),
  })).min(1, 'At least 1 result parameter required'),
});

type OrderFormValues = z.infer<typeof orderSchema>;
type ResultFormValues = z.infer<typeof resultSchema>;

const LaboratoryDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit } = usePagination();
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  // Fetch lab orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['lab-orders', page, limit],
    queryFn: () => laboratoryApi.findAll({ page, limit }),
  });

  // Fetch patients list
  const { data: patients } = useQuery({
    queryKey: ['patients-all-lab'],
    queryFn: () => patientsApi.findAll({ limit: 100 }),
  });

  // Create order form
  const { register: orderReg, handleSubmit: orderSubmit, reset: orderReset, formState: { errors: orderErrors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
  });

  const createOrderMutation = useMutation({
    mutationFn: laboratoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      setIsOrderOpen(false);
      orderReset();
    },
  });

  // Record Results Form
  const { register: resReg, control: resControl, handleSubmit: resSubmit, reset: resReset, formState: { errors: resErrors } } = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: { results: [{ parameter: '', value: '', unit: '', referenceRange: '' }] }
  });

  const { fields, append, remove } = useFieldArray({
    control: resControl,
    name: 'results'
  });

  const recordResultsMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResultFormValues }) => laboratoryApi.addResults(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      setIsResultOpen(false);
      resReset();
      setSelectedOrder(null);
    },
  });

  const onOrderSubmit = (values: OrderFormValues) => {
    createOrderMutation.mutate({
      ...values,
      testCode: values.testCode || undefined,
      notes: values.notes || undefined,
    });
  };

  const onResultSubmit = (values: ResultFormValues) => {
    if (selectedOrder) {
      recordResultsMutation.mutate({ id: selectedOrder._id, payload: values });
    }
  };

  const handleOpenResults = (order: LabOrder) => {
    setSelectedOrder(order);
    setIsResultOpen(true);
  };

  const patientOptions = (patients?.data || []).map((p: any) => ({ value: p._id, label: `${p.firstName} ${p.lastName} (${p.mrn})` }));
  patientOptions.unshift({ value: '', label: 'Select Patient' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ORDERED': return <Badge variant="primary">Ordered</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratory Dashboard</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Manage clinical diagnostic tests, record results, and check order queues</p>
        </div>
        <Button onClick={() => setIsOrderOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Request Lab Test
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load lab orders: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Test Request</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Ordered By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold">
                {data?.data?.map((order: LabOrder) => (
                  <tr key={order._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 block">{order.testName}</span>
                      {order.testCode && <span className="text-[10px] text-gray-400 font-mono font-bold block">{order.testCode}</span>}
                    </td>
                    <td className="px-6 py-4">
                      {order.patientId?.firstName} {order.patientId?.lastName}
                      <span className="block text-xs text-gray-500">MRN: {order.patientId?.mrn}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">
                      Dr. {order.orderedBy?.firstName} {order.orderedBy?.lastName}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'ORDERED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResults(order)}
                          className="inline-flex items-center gap-1.5 font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        >
                          <FlaskConical className="h-3.5 w-3.5" /> Record Results
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle className="h-4 w-4 text-emerald-500" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={isOrderOpen}
        onClose={() => {
          setIsOrderOpen(false);
          orderReset();
        }}
        title="Request Lab Test"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOrderOpen(false)}>Cancel</Button>
            <Button onClick={orderSubmit(onOrderSubmit)} loading={createOrderMutation.isPending}>Submit Order</Button>
          </>
        }
      >
        <form className="space-y-4">
          {createOrderMutation.isError && (
            <Alert variant="danger">{(createOrderMutation.error as Error).message}</Alert>
          )}
          <Select label="Select Patient File" required options={patientOptions} {...orderReg('patientId')} error={orderErrors.patientId?.message} />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input label="Diagnostic Test Name" required placeholder="e.g. Complete Blood Count (CBC)" {...orderReg('testName')} error={orderErrors.testName?.message} />
            </div>
            <Input label="Billing Code" placeholder="e.g. LAB-001" {...orderReg('testCode')} />
          </div>
          <Input label="Clinical Indications / Notes" {...orderReg('notes')} />
        </form>
      </Modal>

      {/* Record Results Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isResultOpen}
          onClose={() => {
            setIsResultOpen(false);
            resReset();
            setSelectedOrder(null);
          }}
          title={`Lab Test Results: ${selectedOrder.testName}`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsResultOpen(false);
                  resReset();
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={resSubmit(onResultSubmit)} loading={recordResultsMutation.isPending}>Submit Results</Button>
            </>
          }
        >
          <form className="space-y-4">
            {recordResultsMutation.isError && (
              <Alert variant="danger">{(recordResultsMutation.error as Error).message}</Alert>
            )}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              <label className="text-sm font-semibold text-gray-700 block">Structured Parameter Values</label>
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 border border-gray-150 rounded-lg grid grid-cols-12 gap-2 bg-gray-50 items-end relative">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute -top-1 right-2 text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                  <div className="col-span-4">
                    <Input label="Parameter" required placeholder="e.g. Hemoglobin" {...resReg(`results.${index}.parameter` as const)} error={resErrors.results?.[index]?.parameter?.message} />
                  </div>
                  <div className="col-span-3">
                    <Input label="Value" required placeholder="e.g. 14.2" {...resReg(`results.${index}.value` as const)} error={resErrors.results?.[index]?.value?.message} />
                  </div>
                  <div className="col-span-2">
                    <Input label="Unit" placeholder="g/dL" {...resReg(`results.${index}.unit` as const)} />
                  </div>
                  <div className="col-span-3">
                    <Input label="Ref Range" placeholder="12.0 - 16.0" {...resReg(`results.${index}.referenceRange` as const)} />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ parameter: '', value: '', unit: '', referenceRange: '' })}
              className="w-full font-bold"
            >
              + Add Parameter Row
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LaboratoryDashboard;
