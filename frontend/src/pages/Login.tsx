import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Input } from '../components/ui';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, tenantCode || undefined);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-800 via-emerald-950 to-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-400 font-black text-2xl text-emerald-950 shadow-md">
            H
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-950">
            HMS Console
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-semibold">
            Enterprise Healthcare Administration Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@hms.local"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Hospital Code{' '}
                <span className="font-normal text-gray-400">(optional for Super Admin)</span>
              </label>
              <input
                type="text"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                placeholder="e.g. CGH — leave blank for Super Admin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              />
              <p className="text-xs text-gray-400">
                Leave blank when logging in as <span className="font-semibold text-gray-500">Super Admin</span>.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>

          {/* Quick-fill hints */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick fill</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Super Admin', email: 'superadmin@hms.local', password: 'Admin@123', code: '' },
                { label: 'Hospital Admin', email: 'admin@cgh.local', password: 'Admin@123', code: 'CGH' },
                { label: 'Doctor', email: 'dr.asha@cgh.local', password: 'Doctor@123', code: 'CGH' },
                { label: 'Receptionist', email: 'reception@cgh.local', password: 'Front@123', code: 'CGH' },
              ].map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.password); setTenantCode(u.code); setError(null); }}
                  className="text-left px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-gray-600 transition-colors"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
