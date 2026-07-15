import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, medicalRecordsApi, prescriptionsApi, billingApi, appointmentsApi, doctorsApi, laboratoryApi, pharmacyApi } from '../../api';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { ArrowLeft, Plus, ClipboardList, Stethoscope, CalendarClock, FlaskConical } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'records' | 'prescriptions' | 'diagnostics' | 'appointments' | 'billing'>('records');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPrescModalOpen, setIsPrescModalOpen] = useState(false);

  // Fetch patient profile (API returns an envelope { data }, so unwrap it)
  const { data: patient, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.findOne(id!).then((r: any) => r.data),
    enabled: !!id,
  });

  // Doctors list — needed to attribute records/prescriptions to a clinician
  const { data: doctorsResp } = useQuery({
    queryKey: ['doctors-for-workspace'],
    queryFn: () => doctorsApi.findAll({ limit: 100 }),
  });
  const doctorOptions = [
    { value: '', label: 'Select Consulting Doctor' },
    ...((doctorsResp as any)?.data || []).map((d: any) => ({
      value: d._id,
      label: `${d.name} (${d.specialization})`,
    })),
  ];

  // Fetch patient medical records
  const { data: records, isLoading: isRecordsLoading } = useQuery({
    queryKey: ['patient-records', id],
    queryFn: () => medicalRecordsApi.findAll({ limit: 50, patientId: id }),
    enabled: !!id && activeTab === 'records',
  });

  // Fetch patient prescriptions
  const { data: prescriptions, isLoading: isPrescriptionsLoading } = useQuery({
    queryKey: ['patient-prescriptions', id],
    queryFn: () => prescriptionsApi.findAll({ limit: 50, patientId: id }),
    enabled: !!id && activeTab === 'prescriptions',
  });

  // Fetch patient appointments
  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => appointmentsApi.findAll({ limit: 50, patientId: id }),
    enabled: !!id && activeTab === 'appointments',
  });

  // Fetch patient lab orders / results
  const { data: labOrders, isLoading: isLabLoading } = useQuery({
    queryKey: ['patient-lab-orders', id],
    queryFn: () => laboratoryApi.findAll({ limit: 50, patientId: id }),
    enabled: !!id && activeTab === 'diagnostics',
  });

  // Fetch patient invoices
  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: () => billingApi.findAllInvoices({ limit: 50, patientId: id }),
    enabled: !!id && activeTab === 'billing',
  });

  const { data: medicineCharges, isLoading: isMedicineChargesLoading } = useQuery({
    queryKey: ['patient-medicine-charges', id],
    queryFn: () => pharmacyApi.findDispensing({ limit: 50, patientId: id }),
    enabled: !!id && activeTab === 'billing',
  });

  // Create record mutation
  const { register: recordReg, handleSubmit: recordSubmit, reset: recordReset } = useForm({
    defaultValues: {
      doctorId: '',
      vitals: { temperatureC: 37, bpSystolic: 120, bpDiastolic: 80, pulse: 72, spo2: 98 },
      notes: '',
      diagnoses: '',
    },
  });
  const createRecordMutation = useMutation({
    mutationFn: medicalRecordsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-records', id] });
      setIsRecordModalOpen(false);
      recordReset();
    },
  });

  const cleanVitals = (v: any) => {
    const out: Record<string, number> = {};
    Object.entries(v || {}).forEach(([k, val]) => {
      if (typeof val === 'number' && !Number.isNaN(val)) out[k] = val;
    });
    return out;
  };

  const onRecordSubmit = (values: any) => {
    const payload = {
      patientId: id,
      doctorId: values.doctorId,
      vitals: cleanVitals(values.vitals),
      notes: values.notes || undefined,
      diagnoses: (values.diagnoses || '')
        .split(',')
        .map((d: string) => d.trim())
        .filter(Boolean)
        .map((description: string) => ({ description })),
    };
    createRecordMutation.mutate(payload);
  };

  // Create prescription mutation
  const { register: prescReg, control: prescControl, handleSubmit: prescSubmit, reset: prescReset } = useForm({
    defaultValues: {
      doctorId: '',
      items: [{ medicine: '', dosage: '', frequency: '', durationDays: 5, instructions: '' }],
    },
  });
  const { fields: prescFields, append: prescAppend, remove: prescRemove } = useFieldArray({
    control: prescControl,
    name: 'items',
  });
  const createPrescMutation = useMutation({
    mutationFn: prescriptionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', id] });
      setIsPrescModalOpen(false);
      prescReset();
    },
  });

  const onPrescSubmit = (values: any) => {
    const payload = {
      patientId: id,
      doctorId: values.doctorId,
      items: (values.items || []).map((it: any) => ({
        medicine: it.medicine,
        dosage: it.dosage,
        frequency: it.frequency,
        durationDays: Number(it.durationDays),
        ...(it.instructions ? { instructions: it.instructions } : {}),
      })),
    };
    createPrescMutation.mutate(payload);
  };

  const getApptStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Badge variant="primary">Scheduled</Badge>;
      case 'CHECKED_IN': return <Badge variant="warning">Checked In</Badge>;
      case 'IN_PROGRESS': return <Badge variant="info">In Progress</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  if (isPatientLoading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  if (patientError || !patient) return <Alert variant="danger">Failed to load patient: {(patientError as Error)?.message || 'Not found'}</Alert>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/patients')} className="font-bold flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
          <p className="text-xs text-gray-500 font-bold mt-0.5">MRN: <span className="font-mono bg-gray-150 px-1 py-0.5 rounded text-gray-700">{patient.mrn}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Short Profile Info Panel */}
        <Card className="p-6 h-fit space-y-4 border border-gray-200">
          <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Profile Overview</h3>
          <div className="space-y-2.5 text-xs font-semibold text-gray-700">
            <div>
              <span className="text-gray-400 block font-medium">Gender / DoB</span>
              <span>{patient.gender} • {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Mobile Contact</span>
              <span>{patient.phone}</span>
            </div>
            {patient.email && (
              <div>
                <span className="text-gray-400 block font-medium">Email Address</span>
                <span>{patient.email}</span>
              </div>
            )}
            {patient.bloodGroup && (
              <div>
                <span className="text-gray-400 block font-medium">Blood Group</span>
                <Badge variant="danger">{patient.bloodGroup}</Badge>
              </div>
            )}
            {patient.abhaId && (
              <div>
                <span className="text-gray-400 block font-medium">ABHA ID</span>
                <span className="font-mono text-gray-900 bg-gray-100 px-1 py-0.5 rounded">{patient.abhaId}</span>
              </div>
            )}
            {patient.address && (
              <div>
                <span className="text-gray-400 block font-medium">Address</span>
                <span>{patient.address}</span>
              </div>
            )}
            {patient.allergies?.length > 0 && (
              <div>
                <span className="text-gray-400 block font-medium">Allergies & Contraindications</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.allergies.map((alg: string) => (
                    <span key={alg} className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] border border-red-200">{alg}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Dynamic Detail Sections */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 border-b border-gray-250 pb-px">
            {(['records', 'prescriptions', 'diagnostics', 'appointments', 'billing'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors focus:outline-none ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600 font-bold'
                    : 'border-transparent text-gray-450 hover:text-gray-700'
                }`}
              >
                {tab === 'records' && 'Medical Records'}
                {tab === 'prescriptions' && 'Prescriptions'}
                {tab === 'diagnostics' && 'Lab Results'}
                {tab === 'appointments' && 'Appointments'}
                {tab === 'billing' && 'Billing Invoices'}
              </button>
            ))}
          </div>

          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Consultations & Vitals History</h2>
                <Button size="sm" className="flex items-center gap-1" onClick={() => setIsRecordModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Vitals / Consult Note
                </Button>
              </div>

              {isRecordsLoading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : records?.data?.length > 0 ? (
                <div className="space-y-4">
                  {records.data.map((rec: any) => (
                    <Card key={rec._id} className="p-5 space-y-3 border border-gray-150">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold border-b pb-2">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="h-4 w-4 text-primary-500" />
                          Consulted by Dr. {rec.doctorId?.name || 'On-Duty Clinician'}
                        </span>
                        <span>{new Date(rec.createdAt).toLocaleString()}</span>
                      </div>

                      {rec.vitals && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs font-semibold text-gray-600">
                          <div>Temp: <span className="font-bold text-gray-900">{rec.vitals.temperatureC ?? '-'} C</span></div>
                          <div>Pulse: <span className="font-bold text-gray-900">{rec.vitals.pulse ?? '—'} bpm</span></div>
                          <div>BP: <span className="font-bold text-gray-900">{rec.vitals.bpSystolic ?? '—'}/{rec.vitals.bpDiastolic ?? '—'}</span></div>
                          <div>SpO2: <span className="font-bold text-gray-900">{rec.vitals.spo2 ?? '—'}%</span></div>
                        </div>
                      )}

                      {rec.diagnoses?.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-xs items-center">
                          <span className="font-bold text-gray-700">Diagnosis:</span>
                          {rec.diagnoses.map((d: any, i: number) => (
                            <Badge key={i} variant="info">{typeof d === 'string' ? d : d.description}</Badge>
                          ))}
                        </div>
                      )}

                      {rec.notes && (
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">Clinical notes:</span>
                          <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{rec.notes}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold text-sm">No medical records written for this patient yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Written Prescriptions</h2>
                <Button size="sm" className="flex items-center gap-1" onClick={() => setIsPrescModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Issue Prescription
                </Button>
              </div>

              {isPrescriptionsLoading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : prescriptions?.data?.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.data.map((pres: any) => (
                    <Card key={pres._id} className="p-5 border border-gray-150">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold border-b pb-3 mb-3">
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4 text-primary-500" />
                          Prescribed by Dr. {pres.doctorId?.name || 'On-Duty Clinician'}
                        </span>
                        <span>{new Date(pres.createdAt).toLocaleString()}</span>
                      </div>
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="text-gray-400 border-b pb-1">
                            <th className="pb-2">Medicine</th>
                            <th className="pb-2">Dosage</th>
                            <th className="pb-2">Frequency</th>
                            <th className="pb-2">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {pres.items?.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2.5 font-bold text-gray-900">{item.medicine}</td>
                              <td className="py-2.5">{item.dosage}</td>
                              <td className="py-2.5">{item.frequency}</td>
                              <td className="py-2.5">{item.durationDays} days</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold text-sm">No prescriptions written for this patient yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 text-lg">Laboratory Orders & Results</h2>
              {isLabLoading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : labOrders?.data?.length > 0 ? (
                <div className="space-y-4">
                  {labOrders.data.map((order: any) => (
                    <Card key={order._id} className="p-5 space-y-3 border border-gray-150">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                          <FlaskConical className="h-4 w-4 text-primary-500" />
                          {order.testName}
                          {order.testCode && <span className="text-[10px] text-gray-400 font-mono font-bold">({order.testCode})</span>}
                        </span>
                        <div className="flex items-center gap-3">
                          {order.resultDate && (
                            <span className="text-xs text-gray-400 font-semibold">
                              {new Date(order.resultDate).toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'primary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>

                      {order.results?.length > 0 ? (
                        <table className="w-full text-left text-xs font-semibold">
                          <thead>
                            <tr className="text-gray-400 border-b">
                              <th className="pb-2">Parameter</th>
                              <th className="pb-2">Value</th>
                              <th className="pb-2">Unit</th>
                              <th className="pb-2">Reference Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {order.results.map((r: any, idx: number) => (
                              <tr key={idx}>
                                <td className="py-2 font-bold text-gray-900">{r.parameter}</td>
                                <td className="py-2">{r.value} {r.flag && <span className="text-red-600 font-bold">({r.flag})</span>}</td>
                                <td className="py-2">{r.unit || '—'}</td>
                                <td className="py-2 text-gray-500">{r.referenceRange || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-gray-400 font-semibold italic">Results pending — sample not yet processed.</p>
                      )}

                      {order.notes && (
                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Clinical note:</span> {order.notes}</p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold text-sm">No lab orders recorded for this patient yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 text-lg">Appointment History</h2>
              {isAppointmentsLoading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : appointments?.data?.length > 0 ? (
                <div className="space-y-3">
                  {appointments.data.map((app: any) => (
                    <Card key={app._id} className="p-4 flex items-center justify-between border border-gray-150">
                      <div className="flex items-center gap-3">
                        <CalendarClock className="h-5 w-5 text-primary-500" />
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-gray-900">
                            {new Date(app.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            {typeof app.doctorId === 'object' ? `Dr. ${app.doctorId?.name}` : 'Clinician'}
                            {app.type ? ` • ${app.type}` : ''}
                            {app.reason ? ` • ${app.reason}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {app.tokenNumber !== undefined && app.tokenNumber !== null && (
                          <span className="font-mono text-xs font-bold text-gray-500">Token #{app.tokenNumber}</span>
                        )}
                        {getApptStatusBadge(app.status)}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold text-sm">No appointments booked for this patient yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 text-lg">Patient Ledger / Invoices</h2>
              <Card className="p-5 border border-gray-150">
                <div className="flex items-center justify-between border-b pb-3 mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Medicine Cost Section</h3>
                  <span className="text-xs font-semibold text-gray-400">Dispensed medicines billed separately from the patient file</span>
                </div>
                {isMedicineChargesLoading ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : medicineCharges?.data?.length > 0 ? (
                  <div className="space-y-3">
                    {medicineCharges.data.map((record: any) => {
                      const total = (record.items || []).reduce((sum: number, item: any) => sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0);
                      return (
                        <div key={record._id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{new Date(record.createdAt).toLocaleDateString()}</div>
                              <div className="text-xs font-semibold text-gray-500">
                                {record.invoiceId?.invoiceNumber ? `Billed in ${record.invoiceId.invoiceNumber}` : 'Not yet billed'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400 font-medium">Medicine Total</div>
                              <div className="text-sm font-bold text-gray-900">Rs {total.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            {(record.items || []).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{item.itemId?.name || 'Medicine'} x {item.quantity}</span>
                                <span>Rs {((item.unitPrice || 0) * (item.quantity || 0)).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 font-semibold">No medicine dispensing charges found for this patient.</div>
                )}
              </Card>

              {isInvoicesLoading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : invoices?.data?.length > 0 ? (
                <div className="space-y-4">
                  {invoices.data.map((inv: any) => (
                    <Card key={inv._id} className="p-5 flex items-center justify-between border border-gray-150 hover:shadow-sm transition-shadow">
                      <div className="space-y-1">
                        <span className="font-mono text-sm font-bold text-primary-700">{inv.invoiceNumber}</span>
                        <div className="text-xs font-semibold text-gray-500">
                          Issued on {new Date(inv.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block font-medium">Invoice Total</span>
                          <span className="font-bold text-gray-900 text-sm">₹{inv.total?.toLocaleString()}</span>
                        </div>
                        <Badge variant={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'gray'}>
                          {inv.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <p className="text-gray-400 font-semibold text-sm">No billing records found for this patient.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Record Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          recordReset();
        }}
        title="Record Vitals & Consult Note"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsRecordModalOpen(false);
                recordReset();
              }}
            >
              Cancel
            </Button>
            <Button onClick={recordSubmit(onRecordSubmit)} loading={createRecordMutation.isPending}>
              Save Consultation Note
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {createRecordMutation.isError && (
            <Alert variant="danger">{(createRecordMutation.error as Error).message}</Alert>
          )}
          <Select label="Consulting Doctor" required options={doctorOptions} {...recordReg('doctorId')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Temperature (C)" type="number" step="0.1" {...recordReg('vitals.temperatureC', { valueAsNumber: true })} />
            <Input label="Pulse Rate (bpm)" type="number" {...recordReg('vitals.pulse', { valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Systolic BP" type="number" {...recordReg('vitals.bpSystolic', { valueAsNumber: true })} />
            <Input label="Diastolic BP" type="number" {...recordReg('vitals.bpDiastolic', { valueAsNumber: true })} />
          </div>
          <Input label="SpO2 (%)" type="number" {...recordReg('vitals.spo2', { valueAsNumber: true })} />
          <Input label="Diagnoses (comma separated)" placeholder="e.g. Asthma, Type 2 Diabetes" {...recordReg('diagnoses')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Clinical Consultation Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[120px] resize-none"
              placeholder="Clinical examination findings, symptoms, recommendations..."
              {...recordReg('notes')}
            />
          </div>
        </form>
      </Modal>

      {/* Prescription Modal */}
      <Modal
        isOpen={isPrescModalOpen}
        onClose={() => {
          setIsPrescModalOpen(false);
          prescReset();
        }}
        title="Issue Patient Prescription"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsPrescModalOpen(false);
                prescReset();
              }}
            >
              Cancel
            </Button>
            <Button onClick={prescSubmit(onPrescSubmit)} loading={createPrescMutation.isPending}>
              Issue Prescription
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {createPrescMutation.isError && (
            <Alert variant="danger">{(createPrescMutation.error as Error).message}</Alert>
          )}
          <Select label="Prescribing Doctor" required options={doctorOptions} {...prescReg('doctorId')} />
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {prescFields.map((field, index) => (
              <div key={field.id} className="p-3 border border-gray-150 rounded-lg space-y-2 relative bg-gray-50">
                {prescFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => prescRemove(index)}
                    className="absolute top-2 right-2 text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
                <Input label="Medicine Name" required {...prescReg(`items.${index}.medicine` as const)} />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Dosage" placeholder="e.g. 500mg" {...prescReg(`items.${index}.dosage` as const)} />
                  <Input label="Frequency" placeholder="e.g. 1-0-1" {...prescReg(`items.${index}.frequency` as const)} />
                  <Input label="Duration (days)" type="number" {...prescReg(`items.${index}.durationDays` as const, { valueAsNumber: true })} />
                </div>
                <Input label="Instructions" placeholder="e.g. After food" {...prescReg(`items.${index}.instructions` as const)} />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => prescAppend({ medicine: '', dosage: '', frequency: '', durationDays: 5, instructions: '' })}
            className="w-full font-bold"
          >
            + Add Another Medicine
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default PatientDetail;

