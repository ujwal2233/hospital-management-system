import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi, patientsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Input, Select, Card, Spinner, Alert, Badge } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus, Calendar, CheckCircle, Ban, Hourglass, Activity, AlertTriangle, Clock
} from 'lucide-react';
import { Appointment } from '../../types/api';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Returns an ISO datetime-local string for now (rounded down to current minute). */
const nowLocalMin = (): string => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};

// ─── validation ─────────────────────────────────────────────────────────────

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  durationMinutes: z.preprocess((v) => Number(v), z.number().min(5, 'Min 5 minutes').max(240)).default(15),
  type: z.enum(['OPD', 'FOLLOW_UP', 'EMERGENCY']),
  reason: z.string().optional(),
});

type AppFormValues = z.infer<typeof appointmentSchema>;

// ─── badge ──────────────────────────────────────────────────────────────────

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'SCHEDULED':   return <Badge variant="primary">Scheduled</Badge>;
    case 'POSTPONED':   return <Badge variant="warning">Postponed</Badge>;
    case 'CHECKED_IN':  return <Badge variant="warning">Checked In</Badge>;
    case 'IN_PROGRESS': return <Badge variant="info">In Progress</Badge>;
    case 'COMPLETED':   return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED':   return <Badge variant="danger">Cancelled</Badge>;
    case 'NO_SHOW':     return <Badge variant="gray">No Show</Badge>;
    default:            return <Badge variant="gray">{status}</Badge>;
  }
};

// ─── component ──────────────────────────────────────────────────────────────

const AppointmentList: React.FC = () => {
  const queryClient = useQueryClient();
  const { page, limit, setPage } = usePagination();

  // ── modal state ─────────────────────────────────────────────────────────
  const [isBookOpen,       setIsBookOpen]       = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen,     setIsCancelOpen]     = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newScheduledAt,      setNewScheduledAt]      = useState('');
  const [postponeReason,      setPostponeReason]      = useState('');
  const [cancelReason,        setCancelReason]        = useState('');
  const [rescheduleMode,      setRescheduleMode]      = useState<'reschedule' | 'postpone'>('reschedule');
  const [rescheduleError,     setRescheduleError]     = useState('');

  // ── search / sort ────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState('');
  const [sortBy,    setSortBy]    = useState('scheduledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const debouncedSearch = useDebounce(search, 300);

  // ── queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', page, limit, debouncedSearch, sortBy, sortOrder],
    queryFn: () => appointmentsApi.findAll({ page, limit, search: debouncedSearch, sortBy, sortOrder }),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-all-select'],
    queryFn: () => doctorsApi.findAll({ limit: 100 }),
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-all-select'],
    queryFn: () => patientsApi.findAll({ limit: 100 }),
  });

  // ── form ─────────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { durationMinutes: 15, type: 'OPD' as const },
  });

  // ── mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => { invalidate(); setIsBookOpen(false); reset(); },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: invalidate,
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt, postponeReason }: {
      id: string; scheduledAt: string; postponeReason?: string;
    }) => appointmentsApi.update(id, {
      scheduledAt: new Date(scheduledAt),
      ...(postponeReason ? { postponeReason } : {}),
    }),
    onSuccess: () => { invalidate(); closeReschedule(); },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason?: string }) =>
      appointmentsApi.cancel(id, cancelReason),
    onSuccess: () => { invalidate(); closeCancelModal(); },
  });

  // ── handlers ─────────────────────────────────────────────────────────────
  const onSubmit = (values: any) => {
    createMutation.mutate({
      ...values,
      scheduledAt: new Date(values.scheduledAt as string),
    });
  };

  const openReschedule = (appointment: Appointment, mode: 'reschedule' | 'postpone') => {
    setSelectedAppointment(appointment);
    setRescheduleMode(mode);
    setNewScheduledAt(new Date(appointment.scheduledAt).toISOString().slice(0, 16));
    setPostponeReason('');
    setRescheduleError('');
    setIsRescheduleOpen(true);
  };

  const closeReschedule = () => {
    setIsRescheduleOpen(false);
    setSelectedAppointment(null);
    setNewScheduledAt('');
    setPostponeReason('');
    setRescheduleError('');
  };

  const handleReschedule = () => {
    if (!selectedAppointment) return;

    const newTime = new Date(newScheduledAt).getTime();
    const now = Date.now();

    // Must not be in the past (with 60s grace matching the backend)
    if (newTime < now - 60_000) {
      setRescheduleError('New time cannot be in the past.');
      return;
    }

    // Postpone must be later than the current scheduled time
    if (rescheduleMode === 'postpone') {
      const currentTime = new Date(selectedAppointment.scheduledAt).getTime();
      if (newTime <= currentTime) {
        setRescheduleError('Postponed time must be later than the current appointment time.');
        return;
      }
    }

    setRescheduleError('');
    rescheduleMutation.mutate({
      id: selectedAppointment._id,
      scheduledAt: newScheduledAt,
      ...(rescheduleMode === 'postpone' && postponeReason ? { postponeReason } : {}),
    });

    // If postponing, also update the status to POSTPONED
    if (rescheduleMode === 'postpone' &&
        (selectedAppointment.status === 'SCHEDULED' || selectedAppointment.status === 'POSTPONED')) {
      // status update is fire-and-forget after the reschedule
      setTimeout(() => {
        appointmentsApi.updateStatus(selectedAppointment._id, 'POSTPONED').catch(() => {});
        invalidate();
      }, 500);
    }
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setIsCancelOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelOpen(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const handleCancel = () => {
    if (!selectedAppointment) return;
    cancelMutation.mutate({ id: selectedAppointment._id, cancelReason });
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const doctorOptions = [
    { value: '', label: 'Select Doctor' },
    ...(doctors?.data || []).map((d: any) => ({ value: d._id, label: `${d.name} (${d.specialization})` })),
  ];

  const patientOptions = [
    { value: '', label: 'Select Patient' },
    ...(patients?.data || []).map((p: any) => ({ value: p._id, label: `${p.firstName} ${p.lastName} (${p.mrn})` })),
  ];

  const minDateTime = nowLocalMin();

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments &amp; Queue</h1>
          <p className="text-sm text-gray-500 font-semibold">Manage clinical schedules, patient check-ins, and tokens</p>
        </div>
        <Button onClick={() => setIsBookOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {/* Global mutation errors */}
      {createMutation.isError && (
        <Alert variant="danger">Booking failed: {(createMutation.error as Error)?.message}</Alert>
      )}
      {transitionMutation.isError && (
        <Alert variant="danger">Status update failed: {(transitionMutation.error as Error)?.message}</Alert>
      )}
      {cancelMutation.isError && (
        <Alert variant="danger">Cancel failed: {(cancelMutation.error as Error)?.message}</Alert>
      )}
      {rescheduleMutation.isError && (
        <Alert variant="danger">Reschedule failed: {(rescheduleMutation.error as Error)?.message}</Alert>
      )}

      {/* Search / Sort bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by patient, clinician, MRN or token..."
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
            <option value="scheduledAt">Time</option>
            <option value="tokenNumber">Token</option>
            <option value="status">Status</option>
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

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load appointments: {(error as Error).message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Token</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Clinician</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {data?.data?.map((app: Appointment) => (
                  <tr key={app._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {new Date(app.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      {app.postponeReason && (
                        <p className="text-xs text-amber-600 mt-0.5 font-normal">↩ {app.postponeReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-650">
                      {app.tokenNumber !== undefined && app.tokenNumber !== null ? `#${app.tokenNumber}` : '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {typeof app.patientId === 'object'
                        ? `${app.patientId?.firstName} ${app.patientId?.lastName}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {typeof app.doctorId === 'object' ? app.doctorId?.name : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-primary-700">{app.type}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                      {app.cancelReason && (
                        <p className="text-xs text-red-500 mt-0.5">"{app.cancelReason}"</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {app.status === 'SCHEDULED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => transitionMutation.mutate({ id: app._id, status: 'CHECKED_IN' })}
                            className="inline-flex items-center gap-1 text-xs font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <Hourglass className="h-3 w-3" /> Check In
                          </Button>
                        )}
                        {app.status === 'POSTPONED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => transitionMutation.mutate({ id: app._id, status: 'CHECKED_IN' })}
                            className="inline-flex items-center gap-1 text-xs font-bold border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <Hourglass className="h-3 w-3" /> Check In
                          </Button>
                        )}
                        {app.status === 'CHECKED_IN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => transitionMutation.mutate({ id: app._id, status: 'IN_PROGRESS' })}
                            className="inline-flex items-center gap-1 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Activity className="h-3 w-3" /> Consult
                          </Button>
                        )}
                        {app.status === 'IN_PROGRESS' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => transitionMutation.mutate({ id: app._id, status: 'COMPLETED' })}
                            className="inline-flex items-center gap-1 text-xs font-bold border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3 w-3" /> Complete
                          </Button>
                        )}
                        {['SCHEDULED', 'POSTPONED', 'CHECKED_IN'].includes(app.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReschedule(app, 'reschedule')}
                              className="inline-flex items-center gap-1 text-xs font-bold border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <Calendar className="h-3 w-3" /> Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReschedule(app, 'postpone')}
                              className="inline-flex items-center gap-1 text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              <Clock className="h-3 w-3" /> Postpone
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCancelModal(app)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50"
                            >
                              <Ban className="h-3 w-3" /> Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 font-semibold">
                      No appointments booked yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Book Appointment Modal ──────────────────────────────────── */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => { setIsBookOpen(false); reset(); }}
        title="Book Appointment"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsBookOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending}>
              Schedule Slot
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select
            label="Select Patient File"
            required
            options={patientOptions}
            {...register('patientId')}
            error={errors.patientId?.message}
          />
          <Select
            label="Select Clinician"
            required
            options={doctorOptions}
            {...register('doctorId')}
            error={errors.doctorId?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">
                Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                min={minDateTime}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...register('scheduledAt')}
              />
              {errors.scheduledAt && (
                <p className="text-xs text-red-500">{errors.scheduledAt.message}</p>
              )}
            </div>
            <Select
              label="Appointment Type"
              required
              options={[
                { value: 'OPD',       label: 'OPD Consultation' },
                { value: 'FOLLOW_UP', label: 'Follow Up' },
                { value: 'EMERGENCY', label: 'Emergency' },
              ]}
              {...register('type')}
            />
          </div>
          <Input label="Reason for Visit" {...register('reason')} />
        </form>
      </Modal>

      {/* ── Reschedule / Postpone Modal ─────────────────────────────── */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={closeReschedule}
        title={rescheduleMode === 'postpone' ? 'Postpone Appointment' : 'Reschedule Appointment'}
        footer={
          <>
            <Button variant="outline" onClick={closeReschedule}>
              Discard
            </Button>
            <Button
              onClick={handleReschedule}
              loading={rescheduleMutation.isPending}
              variant={rescheduleMode === 'postpone' ? 'secondary' : 'primary'}
            >
              {rescheduleMode === 'postpone' ? 'Confirm Postpone' : 'Confirm Reschedule'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {rescheduleMode === 'postpone'
              ? 'Pick a later date and time to postpone this appointment. The status will be marked Postponed.'
              : 'Choose a new date and time to reschedule this appointment.'}
          </p>

          {selectedAppointment && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200">
              <span className="font-semibold">Current slot:</span>{' '}
              {new Date(selectedAppointment.scheduledAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">
              New date &amp; time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              min={minDateTime}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={newScheduledAt}
              onChange={(e) => { setNewScheduledAt(e.target.value); setRescheduleError(''); }}
            />
          </div>

          {rescheduleMode === 'postpone' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">
                Reason for postponing <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="e.g. Doctor unavailable, patient request..."
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
              />
            </div>
          )}

          {rescheduleError && (
            <Alert variant="danger">{rescheduleError}</Alert>
          )}
        </div>
      </Modal>

      {/* ── Cancel Confirmation Modal ───────────────────────────────── */}
      <Modal
        isOpen={isCancelOpen}
        onClose={closeCancelModal}
        title="Cancel Appointment"
        footer={
          <>
            <Button variant="outline" onClick={closeCancelModal}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              loading={cancelMutation.isPending}
            >
              Yes, Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              This action is <strong>irreversible</strong>. The appointment will be marked as Cancelled and cannot be restored.
            </p>
          </div>

          {selectedAppointment && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200 space-y-1">
              <p>
                <span className="font-semibold">Patient:</span>{' '}
                {typeof selectedAppointment.patientId === 'object'
                  ? `${selectedAppointment.patientId.firstName} ${selectedAppointment.patientId.lastName}`
                  : selectedAppointment.patientId}
              </p>
              <p>
                <span className="font-semibold">Scheduled:</span>{' '}
                {new Date(selectedAppointment.scheduledAt).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">
              Reason for cancellation <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="e.g. Patient no-call, duplicate booking, doctor leave..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentList;
