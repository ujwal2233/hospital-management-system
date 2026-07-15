import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { prescriptionsApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Card, Spinner, Alert } from '../../components/ui';
import { ClipboardList } from 'lucide-react';
import { Prescription } from '../../types/api';

const PrescriptionList: React.FC = () => {
  const { page, limit } = usePagination();

  const { data, isLoading, error } = useQuery({
    queryKey: ['prescriptions-all', page, limit],
    queryFn: () => prescriptionsApi.findAll({ page, limit }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prescription Register</h1>
        <p className="text-sm text-gray-500 font-semibold">Active pharmaceutical instructions and patient scripts</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load prescriptions: {error.message}</Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.data?.map((pres: Prescription) => (
            <Card key={pres._id} className="p-6 border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-3 mb-4 font-semibold">
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <ClipboardList className="h-4.5 w-4.5 text-primary-500" />
                    Rx script
                  </span>
                  <span>{new Date(pres.createdAt).toLocaleString()}</span>
                </div>
                <div className="space-y-3">
                  {pres.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs border-b border-gray-50 pb-2">
                      <div>
                        <span className="font-bold text-gray-900 block text-sm">{item.medicine}</span>
                        {item.instructions && <span className="text-gray-400 font-medium">{item.instructions}</span>}
                      </div>
                      <div className="text-right font-semibold text-gray-600">
                        <span>{item.dosage}</span> • <span>{item.frequency}</span>
                        <span className="block text-[10px] text-gray-400 font-bold">{item.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
          {data?.data?.length === 0 && (
            <div className="col-span-2 text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <p className="text-gray-400 font-semibold text-sm">No pharmaceutical scripts have been issued yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;
