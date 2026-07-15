import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { medicalRecordsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Card, Spinner, Alert } from '../../components/ui';
import { Stethoscope } from 'lucide-react';
import { MedicalRecord } from '../../types/api';

const MedicalRecordList: React.FC = () => {
  const { page, limit, setPage } = usePagination();
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc'|'desc'>('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['medical-records-all', page, limit, debouncedSearch, sortBy, sortOrder],
    queryFn: () => medicalRecordsApi.findAll({ page, limit, search: debouncedSearch, sortBy, sortOrder }),
  });

  const formatPatient = (patient: MedicalRecord['patientId']) => {
    if (typeof patient === 'object' && patient) {
      return `${patient.firstName} ${patient.lastName} (${patient.mrn})`;
    }
    return 'Patient';
  };

  const formatDoctor = (doctor: MedicalRecord['doctorId']) => {
    if (typeof doctor === 'object' && doctor) {
      return `Dr. ${doctor.name}`;
    }
    return 'On-Duty Clinician';
  };

  const formatDiagnoses = (diagnoses: MedicalRecord['diagnoses']) =>
    diagnoses
      ?.map((diagnosis) => (typeof diagnosis === 'string' ? diagnosis : diagnosis.description))
      .filter(Boolean)
      .join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clinical Documentation</h1>
        <p className="text-sm text-gray-500 font-semibold">Central registry of EMR consult records and vitals</p>
      </div>

      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by patient, doctor, diagnosis..."
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
            <option value="createdAt">Newest</option>
            <option value="patientId">Patient</option>
            <option value="doctorId">Doctor</option>
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
        <Alert variant="danger">Failed to load medical records: {error.message}</Alert>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((rec: MedicalRecord) => {
            const diagnoses = formatDiagnoses(rec.diagnoses);

            return (
              <Card key={rec._id} className="p-6 border border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-3 mb-3 font-semibold">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <Stethoscope className="h-4.5 w-4.5 text-primary-500" />
                    {formatPatient(rec.patientId)} - {formatDoctor(rec.doctorId)}
                  </span>
                  <span>{new Date(rec.createdAt).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-150 text-xs font-semibold text-gray-600 mb-3">
                  <div>Temp: <span className="font-bold text-gray-900">{rec.vitals?.temperatureC ?? '-'} C</span></div>
                  <div>Pulse: <span className="font-bold text-gray-900">{rec.vitals?.pulse ?? '-'} bpm</span></div>
                  <div>BP: <span className="font-bold text-gray-900">{rec.vitals?.bpSystolic ?? '-'}/{rec.vitals?.bpDiastolic ?? '-'}</span></div>
                  <div>SpO2: <span className="font-bold text-gray-900">{rec.vitals?.spo2 ?? '-'}%</span></div>
                </div>

                <div className="space-y-2">
                  {diagnoses && (
                    <p className="text-xs font-semibold text-gray-700">
                      Diagnoses: <span className="font-mono text-primary-700 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded">{diagnoses}</span>
                    </p>
                  )}
                  {rec.chiefComplaint && (
                    <p className="text-xs font-semibold text-gray-700">
                      Chief complaint: <span className="font-medium text-gray-600">{rec.chiefComplaint}</span>
                    </p>
                  )}
                  {rec.notes && (
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{rec.notes}</p>
                  )}
                </div>
              </Card>
            );
          })}
          {data?.data?.length === 0 && (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <p className="text-gray-400 font-semibold text-sm">No clinical documentation has been captured yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordList;
