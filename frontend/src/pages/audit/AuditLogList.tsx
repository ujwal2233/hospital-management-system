import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api';
import { usePagination } from '../../hooks/usePagination';
import { Card, Spinner, Alert } from '../../components/ui';
import { FolderLock } from 'lucide-react';
import { AuditLog } from '../../types/api';

const AuditLogList: React.FC = () => {
  const { page, limit } = usePagination(20); // show 20 log entries by default

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, limit],
    queryFn: () => auditApi.findAll({ page, limit }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500 font-semibold font-sans">Chronological security records of all database mutations and actions</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert variant="danger">Failed to load audit logs: {error.message}</Alert>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-gray-700">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-150 font-bold uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Resource Scope</th>
                  <th className="px-6 py-4">Network IP</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold">
                {data?.data?.map((log: AuditLog) => (
                  <tr key={log._id} className="hover:bg-gray-50/30">
                    <td className="px-6 py-3.5 font-mono text-gray-450">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System Kernel'}
                      <span className="block text-[10px] text-gray-400 font-medium font-mono">{log.userId?.email}</span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-primary-700 font-mono">{log.action}</td>
                    <td className="px-6 py-3.5 font-mono text-gray-500">
                      {log.resource} {log.resourceId && <span className="text-[10px] text-gray-300">({log.resourceId})</span>}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-gray-400">{log.ip || '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={log.statusCode >= 200 && log.statusCode < 300 ? 'text-green-600 font-bold' : 'text-red-650 font-bold'}>
                        {log.statusCode}
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 font-semibold">
                      No security audit records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AuditLogList;
