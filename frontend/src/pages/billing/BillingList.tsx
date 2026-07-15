import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, patientsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Eye, CheckCircle, Ban, CreditCard } from 'lucide-react';
import { Invoice } from '../../types/api';

const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Required'),
  taxRate: z.number().min(0).max(28).default(18),
  discount: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

type InvFormValues = z.infer<typeof invoiceSchema>;

const BillingList: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit } = usePagination();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER'>('CASH');

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, limit],
    queryFn: () => billingApi.findAllInvoices({ page, limit }),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-all-billing'],
    queryFn: () => patientsApi.findAll({ limit: 100 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { patientId: '', taxRate: 18, discount: 0, notes: '' },
  });

  const createMutation = useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateModalOpen(false);
      reset();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, method }: { id: string; amount: number; method: string }) =>
      billingApi.addPayment(id, { amount, method }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsPaymentModalOpen(false);
      const updatedInvoice = res?.data ?? res;
      setSelectedInvoice(updatedInvoice);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => billingApi.cancelInvoice(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const updatedInvoice = res?.data ?? res;
      setSelectedInvoice(updatedInvoice);
    },
  });

  const onSubmit = (values: any) => {
    createMutation.mutate(values);
  };

  const patientOptions = (patients?.data || []).map((p: any) => ({
    value: p._id,
    label: `${p.firstName} ${p.lastName} (${p.mrn})`,
  }));
  patientOptions.unshift({ value: '', label: 'Select Patient' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED': return <Badge variant="primary">Issued</Badge>;
      case 'PARTIALLY_PAID': return <Badge variant="warning">Partially Paid</Badge>;
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 font-semibold">Generate one invoice automatically from consultation fees and dispensed medicines</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate Invoice
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load billing: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data?.data?.map((inv: Invoice) => (
                  <tr key={inv._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-primary-700">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold">
                      {typeof inv.patientId === 'object' ? `${inv.patientId.firstName} ${inv.patientId.lastName}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">Rs {inv.total?.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-emerald-600">Rs {inv.amountPaid?.toLocaleString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {['ISSUED', 'PARTIALLY_PAID'].includes(inv.status) && Math.round((inv.amountPaid || 0) * 100) < Math.round((inv.total || 0) * 100) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(Math.round(((inv.total || 0) - (inv.amountPaid || 0)) * 100) / 100);
                            setIsPaymentModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Pay
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsDetailModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 font-bold"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Ledger
                      </Button>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 font-semibold">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        title="Generate Patient Invoice"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>Generate Invoice</Button>
          </>
        }
      >
        <form className="space-y-4">
          {createMutation.isError && (
            <Alert variant="danger">{(createMutation.error as Error).message}</Alert>
          )}
          <Select label="Select Patient File" required options={patientOptions} {...register('patientId')} error={errors.patientId?.message} />
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This invoice will automatically include all pending consultation fees and dispensed medicine charges for the selected patient.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="GST %" type="number" {...register('taxRate', { valueAsNumber: true })} error={errors.taxRate?.message} />
            <Input label="Discount (Rs)" type="number" {...register('discount', { valueAsNumber: true })} error={errors.discount?.message} />
          </div>
          <Input label="Billing Note" placeholder="Optional note for the invoice" {...register('notes')} error={errors.notes?.message} />
        </form>
      </Modal>

      {selectedInvoice && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInvoice(null);
          }}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          footer={
            <>
              {(() => {
                const invStatus = (selectedInvoice as any).data?.status ?? selectedInvoice.status;
                const invPaid = (selectedInvoice as any).data?.amountPaid ?? selectedInvoice.amountPaid ?? 0;
                const invTotal = (selectedInvoice as any).data?.total ?? selectedInvoice.total ?? 0;
                const isPayable = ['ISSUED', 'PARTIALLY_PAID'].includes(invStatus) && Math.round(invPaid * 100) < Math.round(invTotal * 100);
                return isPayable ? (
                  <>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1 font-bold"
                      onClick={() => cancelMutation.mutate((selectedInvoice as any).data?._id || selectedInvoice._id)}
                      loading={cancelMutation.isPending}
                    >
                      <Ban className="h-4 w-4" /> Cancel Invoice
                    </Button>
                    <Button
                      onClick={() => {
                        setPaymentAmount(Math.round((invTotal - invPaid) * 100) / 100);
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex items-center gap-1 font-bold"
                    >
                      <CreditCard className="h-4 w-4" /> Add Payment
                    </Button>
                  </>
                ) : null;
              })()}
              <Button variant="secondary" onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedInvoice(null);
              }}>
                Close
              </Button>
            </>
          }
        >
          <div className="space-y-6 text-xs font-semibold text-gray-700">
            <div className="flex justify-between border-b pb-3 items-end">
              <div>
                <span className="text-gray-400 block font-medium">Billed To</span>
                <span className="font-bold text-gray-900 text-sm">
                  {typeof selectedInvoice.patientId === 'object'
                    ? `${selectedInvoice.patientId.firstName} ${selectedInvoice.patientId.lastName}`
                    : '-'}
                </span>
                <span className="block text-gray-500 font-medium">
                  MRN: {typeof selectedInvoice.patientId === 'object' ? selectedInvoice.patientId.mrn : '-'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block font-medium">Status</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-gray-400 block font-medium border-b pb-1">Items Summary</span>
              {selectedInvoice.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1">
                  <div>
                    <span className="font-bold text-gray-800">{item.description}</span>
                    <span className="block text-[10px] text-gray-400 font-medium">
                      {item.quantity} x Rs {item.unitPrice}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">Rs {item.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-right">
              <div>Subtotal: <span className="font-bold text-gray-900">Rs {selectedInvoice.subtotal?.toLocaleString()}</span></div>
              {selectedInvoice.discount > 0 && (
                <div className="text-red-600">Discount: <span className="font-bold">-Rs {selectedInvoice.discount}</span></div>
              )}
              <div>GST Tax: <span className="font-bold text-gray-900">Rs {selectedInvoice.taxAmount?.toLocaleString()}</span></div>
              <div className="text-sm font-bold text-gray-900">Total Billed: Rs {selectedInvoice.total?.toLocaleString()}</div>
              <div className="text-sm font-bold text-emerald-600">Total Paid: Rs {selectedInvoice.amountPaid?.toLocaleString()}</div>
            </div>

            {selectedInvoice.payments?.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <span className="text-gray-400 block font-medium pb-1">Payments Applied</span>
                {selectedInvoice.payments.map((payment, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1.5 bg-gray-50 border px-3 rounded-lg border-gray-100 items-center">
                    <div>
                      <span className="font-bold text-gray-800">Rs {payment.amount?.toLocaleString()}</span>
                      <span className="block text-[10px] text-gray-400 font-medium">Via {payment.method} on {new Date(payment.paidAt).toLocaleDateString()}</span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {selectedInvoice && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Apply Payment"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button
                onClick={() => paymentMutation.mutate({ id: (selectedInvoice as any).data?._id || selectedInvoice._id, amount: paymentAmount, method: paymentMethod })}
                loading={paymentMutation.isPending}
                disabled={(() => {
                  const invPaid = (selectedInvoice as any).data?.amountPaid ?? selectedInvoice.amountPaid ?? 0;
                  const invTotal = (selectedInvoice as any).data?.total ?? selectedInvoice.total ?? 0;
                  const remaining = Math.round((invTotal - invPaid) * 100) / 100;
                  return paymentAmount <= 0 || paymentAmount > remaining;
                })()}
              >
                Record Payment
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {paymentMutation.isError && (
              <Alert variant="danger">{(paymentMutation.error as Error).message || 'Failed to apply payment'}</Alert>
            )}
            <Input
              label="Payment Amount (Rs)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              max={(() => {
                const invPaid = (selectedInvoice as any).data?.amountPaid ?? selectedInvoice.amountPaid ?? 0;
                const invTotal = (selectedInvoice as any).data?.total ?? selectedInvoice.total ?? 0;
                return Math.round((invTotal - invPaid) * 100) / 100;
              })()}
            />
            <Select
              label="Method"
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'CARD', label: 'Credit/Debit Card' },
                { value: 'UPI', label: 'UPI / QR Code' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer / IMPS' },
              ]}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER')}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BillingList;
