import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { radiologyApi, patientsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Scan, CheckCircle, FileText } from 'lucide-react';
import { RadiologyOrder } from '../../types/api';

const orderSchema = z.object({
  patientId: z.string().min(1, 'Required'),
  modality: z.string().min(2, 'Required'),
  bodyPart: z.string().min(2, 'Required'),
  clinicalIndication: z.string().optional(),
});

const reportSchema = z.object({
  findings: z.string().min(5, 'Required'),
  impression: z.string().min(2, 'Required'),
  imageUrl: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;
type ReportFormValues = z.infer<typeof reportSchema>;

const RadiologyDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit } = usePagination();
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrder | null>(null);

  // Fetch radiology orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['radiology-orders', page, limit],
    queryFn: () => radiologyApi.findAll({ page, limit }),
  });

  // Fetch patients list
  const { data: patients } = useQuery({
    queryKey: ['patients-all-radiology'],
    queryFn: () => patientsApi.findAll({ limit: 100 }),
  });

  // Create order form
  const { register: orderReg, handleSubmit: orderSubmit, reset: orderReset, formState: { errors: orderErrors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
  });

  const createOrderMutation = useMutation({
    mutationFn: radiologyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-orders'] });
      setIsOrderOpen(false);
      orderReset();
    },
  });

  // Record Report Form
  const { register: repReg, handleSubmit: repSubmit, reset: repReset, formState: { errors: repErrors } } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const addReportMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReportFormValues }) => radiologyApi.addReport(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiology-orders'] });
      setIsReportOpen(false);
      repReset();
      setSelectedOrder(null);
    },
  });

  const onOrderSubmit = (values: OrderFormValues) => {
    createOrderMutation.mutate(values);
  };

  const onReportSubmit = (values: ReportFormValues) => {
    if (selectedOrder) {
      addReportMutation.mutate({ id: selectedOrder._id, payload: values });
    }
  };

  const handleOpenReport = (order: RadiologyOrder) => {
    setSelectedOrder(order);
    setIsReportOpen(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Radiology Imaging</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Track X-Ray, CT scan, MRI, and ultrasound scan reports</p>
        </div>
        <Button onClick={() => setIsOrderOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Request Radiology Scan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load radiology orders: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Modality / Scan</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Ordered By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold">
                {data?.data?.map((order: RadiologyOrder) => (
                  <tr key={order._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 block">{order.modality}</span>
                      <span className="text-xs text-gray-500 font-medium">{order.bodyPart}</span>
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
                          onClick={() => handleOpenReport(order)}
                          className="inline-flex items-center gap-1.5 font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        >
                          <Scan className="h-3.5 w-3.5" /> Transcribe Report
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle className="h-4 w-4 text-emerald-500" /> Reported
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
        title="Request Radiology Scan"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOrderOpen(false)}>Cancel</Button>
            <Button onClick={orderSubmit(onOrderSubmit)} loading={createOrderMutation.isPending}>Submit Order</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select label="Select Patient File" required options={patientOptions} {...orderReg('patientId')} error={orderErrors.patientId?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Modality"
              required
              options={[
                { value: 'X-Ray', label: 'X-Ray' },
                { value: 'CT Scan', label: 'CT Scan' },
                { value: 'MRI', label: 'MRI' },
                { value: 'Ultrasound', label: 'Ultrasound' },
                { value: 'PET Scan', label: 'PET Scan' },
              ]}
              {...orderReg('modality')}
              error={orderErrors.modality?.message}
            />
            <Input label="Target Body Part" required placeholder="e.g. Chest, Left Knee" {...orderReg('bodyPart')} error={orderErrors.bodyPart?.message} />
          </div>
          <Input label="Clinical Indications" {...orderReg('clinicalIndication')} />
        </form>
      </Modal>

      {/* Record Report Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            repReset();
            setSelectedOrder(null);
          }}
          title={`Radiology Report: ${selectedOrder.modality} of ${selectedOrder.bodyPart}`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsReportOpen(false);
                  repReset();
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={repSubmit(onReportSubmit)} loading={addReportMutation.isPending}>Save Scan Report</Button>
            </>
          }
        >
          <form className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Detailed Findings</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[100px] resize-none"
                placeholder="Describe physiological observations, lesions, bone structures..."
                required
                {...repReg('findings')}
              />
              {repErrors.findings && <span className="text-xs text-red-650 font-bold">{repErrors.findings.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Final Diagnostic Impression</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[60px] resize-none"
                placeholder="Concluding summary diagnosis..."
                required
                {...repReg('impression')}
              />
              {repErrors.impression && <span className="text-xs text-red-650 font-bold">{repErrors.impression.message}</span>}
            </div>
            <Input label="PACS Scan Image Link (Optional)" placeholder="https://pacs-server.local/images/scan-123.dcm" {...repReg('imageUrl')} />
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RadiologyDashboard;
