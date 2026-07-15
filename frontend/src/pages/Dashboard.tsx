import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api';
import { Card, Spinner, Alert } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Stethoscope, Users, IndianRupee, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  });
  const metrics = (data as any)?.data ?? data ?? {};

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Failed to load system reports: {error.message}</Alert>;
  }

  const kpis = [
    {
      name: "Today's Consultations",
      value: metrics.todaysAppointments ?? 0,
      icon: Activity,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
    {
      name: 'On-Duty Clinicians',
      value: metrics.activeDoctors ?? 0,
      icon: Stethoscope,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      name: 'Registered Cohort',
      value: metrics.activePatients ?? 0,
      icon: Users,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
    },
    {
      name: 'Revenue Flow (Month)',
      value: `₹${data?.monthlyRevenue?.toLocaleString() ?? 0}`,
      icon: IndianRupee,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  // Map appointment statuses to chart items
  const statusData = Object.entries(metrics.appointmentStatus || {}).map(([key, val]) => ({
    status: key.replaceAll('_', ' '),
    count: val,
  }));

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Performance Monitor</h1>
        <p className="text-gray-500 font-semibold mt-1">Real-time indicators across clinical and financial systems</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.name} className="p-6 flex items-center justify-between border border-gray-150 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-gray-500">{kpi.name}</span>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{kpi.value}</p>
            </div>
            <div className={`p-4 border rounded-2xl ${kpi.color}`}>
              <kpi.icon className="h-6 w-6" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            <h3 className="font-bold text-gray-800 text-lg">Today's Appointment Load</h3>
          </div>
          {statusData.length > 0 ? (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="status" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 550 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <p className="text-gray-400 font-semibold text-sm">No appointments scheduled for today</p>
            </div>
          )}
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Hospital Operations Summary</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-semibold">
              The metrics show current day activity. Please coordinate with clinical leads for schedules and receptionist shifts if registration traffic is high.
            </p>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6 space-y-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-500">Database Connection</span>
              <span className="text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-gray-500">Core API Status</span>
              <span className="text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Operational
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
