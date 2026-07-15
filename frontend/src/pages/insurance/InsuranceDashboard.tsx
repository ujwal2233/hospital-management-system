import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insuranceApi, patientsApi, billingApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Eye, HeartHandshake, CheckCircle } from 'lucide-react';
import { InsuranceClaim, InsuranceProvider } from '../../types/api';

const providerSchema = z.object({
  name: z.string().min(2, 'Required'),
  tpaCode: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});

const claimSchema = z.object({
  patientId: z.string().min(1, 'Required'),
  invoiceId: z.string().min(1, 'Required'),
  providerId: z.string().min(1, 'Required'),
  policyNumber: z.string().min(2, 'Required'),
  claimedAmount: z.number().min(0),
  remarks: z.string().optional(),
});

const claimUpdateSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID']),
  approvedAmount: z.number().min(0).default(0),
  remarks: z.string().optional(),
});

type ProviderFormValues = z.infer<typeof providerSchema>;
type ClaimFormValues = z.infer<typeof claimSchema>;
type ClaimUpdateFormValues = z.infer<typeof claimUpdateSchema>;

const InsuranceDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'claims' | 'providers'>('claims');
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isUpdateClaimOpen, setIsUpdateClaimOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);

  const { page, limit } = usePagination();

  // Load claims
  const { data: claims, isLoading: isClaimsLoading, error: claimsError } = useQuery({
    queryKey: ['insurance-claims', page, limit],
    queryFn: () => insuranceApi.findAllClaims({ page, limit }),
  });

  // Load providers
  const { data: providers, isLoading: isProvidersLoading } = useQuery({
    queryKey: ['insurance-providers', page, limit],
    queryFn: () => insuranceApi.findAllProviders({ page, limit }),
  });

  // Load patients for claim select
  const { data: patients } = useQuery({
    queryKey: ['patients-all-insurance'],
    queryFn: () => patientsApi.findAll({ limit: 100 }),
  });

  // Load invoices for claim select
  const { data: invoices } = useQuery({
    queryKey: ['invoices-all-insurance'],
    queryFn: () => billingApi.findAllInvoices({ limit: 100 }),
  });

  // Add Provider form
  const { register: provReg, handleSubmit: provSubmit, reset: provReset, formState: { errors: provErrors } } = useForm<any>({
    resolver: zodResolver(providerSchema),
  });

  const addProviderMutation = useMutation({
    mutationFn: insuranceApi.createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-providers'] });
      setIsProviderOpen(false);
      provReset();
    },
  });

  const onProvSubmit = (values: any) => {
    addProviderMutation.mutate({
      ...values,
      contactEmail: values.contactEmail || undefined,
    });
  };

  // Create Claim form
  const { register: claimReg, handleSubmit: claimSubmit, reset: claimReset, formState: { errors: claimErrors } } = useForm<any>({
    resolver: zodResolver(claimSchema),
  });

  const createClaimMutation = useMutation({
    mutationFn: insuranceApi.createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      setIsClaimOpen(false);
      claimReset();
    },
  });

  const onClaimSubmit = (values: any) => {
    createClaimMutation.mutate(values);
  };

  // Update Claim form
  const { register: updReg, handleSubmit: updSubmit, reset: updReset } = useForm<any>({
    resolver: zodResolver(claimUpdateSchema),
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => insuranceApi.updateClaim(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      setIsUpdateClaimOpen(false);
      updReset();
      setSelectedClaim(null);
    },
  });

  const onUpdSubmit = (values: any) => {
    if (selectedClaim) {
      updateClaimMutation.mutate({ id: selectedClaim._id, payload: values });
    }
  };

  const handleOpenUpdate = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setIsUpdateClaimOpen(true);
  };

  const patientOptions = (patients?.data || []).map((p: any) => ({ value: p._id, label: `${p.firstName} ${p.lastName} (${p.mrn})` }));
  patientOptions.unshift({ value: '', label: 'Select Patient' });

  const providerOptions = (providers?.data || []).map((p: any) => ({ value: p._id, label: p.name }));
  providerOptions.unshift({ value: '', label: 'Select Provider / TPA' });

  const invoiceOptions = (invoices?.data || []).map((i: any) => ({ value: i._id, label: `${i.invoiceNumber} (₹${i.total})` }));
  invoiceOptions.unshift({ value: '', label: 'Select Billed Invoice' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <Badge variant="primary">Submitted</Badge>;
      case 'UNDER_REVIEW': return <Badge variant="warning">Under Review</Badge>;
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'PARTIALLY_APPROVED': return <Badge variant="info">Partially Approved</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      case 'PAID': return <Badge variant="success">Paid / Disbursed</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance & TPA Claims</h1>
          <p className="text-sm text-gray-500 font-semibold font-sans">Manage third party insurance providers, track claims, and verify coverage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsProviderOpen(true)} className="flex items-center gap-1.5 font-bold border-teal-300 text-teal-700 hover:bg-teal-50">
            <HeartHandshake className="h-4 w-4" /> Add Provider
          </Button>
          <Button onClick={() => setIsClaimOpen(true)} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> File Insurance Claim
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-px">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
            activeTab === 'claims'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Active Claims
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
            activeTab === 'providers'
              ? 'border-primary-500 text-primary-600 font-bold'
              : 'border-transparent text-gray-450 hover:text-gray-700'
          }`}
        >
          Insurance Partners
        </button>
      </div>

      {activeTab === 'claims' && (
        <>
          {isClaimsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : claimsError ? (
            <Alert variant="danger">Failed to load claims: {claimsError.message}</Alert>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-gray-700">
                  <thead>
                    <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                      <th className="px-6 py-4">Policy / Claim</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">TPA / Provider</th>
                      <th className="px-6 py-4">Claimed Amt</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold">
                    {claims?.data?.map((claim: InsuranceClaim) => (
                      <tr key={claim._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 block">{claim.policyNumber}</span>
                          <span className="text-[10px] text-gray-400 font-mono font-bold block">
                            Invoice: {claim.invoiceId?.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {claim.patientId?.firstName} {claim.patientId?.lastName}
                          <span className="block text-xs text-gray-500">MRN: {claim.patientId?.mrn}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-655">
                          {claim.providerId?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">₹{claim.claimedAmount?.toLocaleString()}</span>
                          {claim.approvedAmount > 0 && (
                            <span className="block text-[10px] text-emerald-600">Approved: ₹{claim.approvedAmount?.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(claim.status)}</td>
                        <td className="px-6 py-4 text-right">
                          {claim.status !== 'PAID' && claim.status !== 'REJECTED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenUpdate(claim)}
                              className="inline-flex items-center gap-1.5 font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> Process Claim
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="h-4 w-4 text-emerald-500" /> Settled
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
        </>
      )}

      {activeTab === 'providers' && (
        <>
          {isProvidersLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4">Provider Name</th>
                    <th className="px-6 py-4">TPA Identifier</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold">
                  {providers?.data?.map((p: InsuranceProvider) => (
                    <tr key={p._id}>
                      <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{p.tpaCode || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-655">{p.contactPerson || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-600">{p.contactPhone || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-450">{p.contactEmail || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {/* Add Provider Modal */}
      <Modal
        isOpen={isProviderOpen}
        onClose={() => {
          setIsProviderOpen(false);
          provReset();
        }}
        title="Add Insurance Provider"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsProviderOpen(false)}>Cancel</Button>
            <Button onClick={provSubmit(onProvSubmit)} loading={addProviderMutation.isPending}>Add Provider</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Insurance Company / Provider Name" required placeholder="e.g. Star Health Insurance" {...provReg('name')} error={provErrors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="TPA Identification Code" placeholder="e.g. TPA-STAR-01" {...provReg('tpaCode')} />
            <Input label="Contact Representative" placeholder="e.g. Sales Lead" {...provReg('contactPerson')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Phone" {...provReg('contactPhone')} />
            <Input label="Contact Email" {...provReg('contactEmail')} error={provErrors.contactEmail?.message} />
          </div>
        </form>
      </Modal>

      {/* File Claim Modal */}
      <Modal
        isOpen={isClaimOpen}
        onClose={() => {
          setIsClaimOpen(false);
          claimReset();
        }}
        title="File Insurance Claim"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsClaimOpen(false)}>Cancel</Button>
            <Button onClick={claimSubmit(onClaimSubmit)} loading={createClaimMutation.isPending}>Submit Claim</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select label="Select Patient File" required options={patientOptions} {...claimReg('patientId')} error={claimErrors.patientId?.message} />
          <Select label="Select Billed Invoice" required options={invoiceOptions} {...claimReg('invoiceId')} error={claimErrors.invoiceId?.message} />
          <Select label="Select Insurance Provider" required options={providerOptions} {...claimReg('providerId')} error={claimErrors.providerId?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Policy / Card Number" required placeholder="e.g. POL-99221" {...claimReg('policyNumber')} error={claimErrors.policyNumber?.message} />
            <Input label="Claimed Amount (₹)" type="number" required {...claimReg('claimedAmount', { valueAsNumber: true })} error={claimErrors.claimedAmount?.message} />
          </div>
          <Input label="Filing Remarks" placeholder="Pre-authorization approval reference, TPA notes" {...claimReg('remarks')} />
        </form>
      </Modal>

      {/* Process Claim Modal */}
      {selectedClaim && (
        <Modal
          isOpen={isUpdateClaimOpen}
          onClose={() => {
            setIsUpdateClaimOpen(false);
            updReset();
            setSelectedClaim(null);
          }}
          title={`Process Claim: ${selectedClaim.policyNumber}`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUpdateClaimOpen(false);
                  updReset();
                  setSelectedClaim(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={updSubmit(onUpdSubmit)} loading={updateClaimMutation.isPending}>Update Claim status</Button>
            </>
          }
        >
          <form className="space-y-4">
            <div className="bg-gray-50 border p-4 rounded-xl space-y-1 mb-4 text-xs font-semibold text-gray-600">
              <div>Provider: <span className="font-bold text-gray-900">{selectedClaim.providerId?.name}</span></div>
              <div>Invoice Total: <span className="font-bold text-gray-900">₹{selectedClaim.invoiceId?.total?.toLocaleString()}</span></div>
              <div>Filing Claimed: <span className="font-bold text-gray-900">₹{selectedClaim.claimedAmount?.toLocaleString()}</span></div>
            </div>
            <Select
              label="Review Status Decision"
              required
              options={[
                { value: 'UNDER_REVIEW', label: 'Under Review / Pending info' },
                { value: 'APPROVED', label: 'APPROVED (Ready for payment)' },
                { value: 'PARTIALLY_APPROVED', label: 'Partially Approved (Adjusted)' },
                { value: 'REJECTED', label: 'REJECTED (Denial)' },
                { value: 'PAID', label: 'PAID (Disbursement completed)' },
              ]}
              {...updReg('status')}
            />
            <Input label="Approved Amount (₹)" type="number" {...updReg('approvedAmount', { valueAsNumber: true })} />
            <Input label="Denial / Settlement Remarks" placeholder="e.g. Deductibles applied" {...updReg('remarks')} />
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InsuranceDashboard;
