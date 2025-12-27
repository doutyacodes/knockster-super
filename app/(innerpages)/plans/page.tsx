"use client"

import React, { useState, useEffect } from 'react';
import { Shield, Check, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

interface Plan {
  id: string;
  name: string;
  allowL1: boolean;
  allowL2: boolean;
  allowL3: boolean;
  allowL4: boolean;
  maxGuards: number;
  maxGuestPasses: number;
  price: string;
}

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    allowL1: true,
    allowL2: false,
    allowL3: false,
    allowL4: false,
    maxGuards: 10,
    maxGuestPasses: 100,
    price: '99.00',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await api.get<Plan[]>('/api/superadmin/plans');
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/api/superadmin/plans', createForm);
      setSuccess('Plan created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        allowL1: true,
        allowL2: false,
        allowL3: false,
        allowL4: false,
        maxGuards: 10,
        maxGuestPasses: 100,
        price: '99.00',
      });
      fetchPlans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSecurityLevels = (plan: Plan) => {
    const levels = [];
    if (plan.allowL1) levels.push('L1');
    if (plan.allowL2) levels.push('L2');
    if (plan.allowL3) levels.push('L3');
    if (plan.allowL4) levels.push('L4');
    return levels.join(', ') || 'None';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plans & Security Levels</h1>
          <p className="text-slate-500">Define subscription tiers and enforce authentication levels.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Create Plan</span>
        </button>
      </header>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={`bg-white rounded-3xl border ${
              index === plans.length - 1 ? 'border-violet-200 ring-1 ring-violet-200' : 'border-slate-200'
            } shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all`}
          >
            {index === plans.length - 1 && (
              <div className="bg-violet-600 text-white py-1.5 text-center text-[10px] font-black uppercase tracking-widest">
                Recommended for Enterprise
              </div>
            )}
            <div className="p-8 flex-1">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  index === 0
                    ? 'bg-slate-100 text-slate-600'
                    : index === 1
                    ? 'bg-blue-100 text-blue-600'
                    : index === 2
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-violet-100 text-violet-600'
                }`}
              >
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {plan.name}{' '}
                <span className="text-sm font-normal text-slate-400">
                  ({getSecurityLevels(plan)})
                </span>
              </h3>
              <p className="text-2xl font-bold text-slate-900 mb-6">
                ${plan.price}
                <span className="text-sm font-normal text-slate-400">/month</span>
              </p>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Max Guards</span>
                  <span className="text-sm font-bold text-slate-700">{plan.maxGuards}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Monthly Passes</span>
                  <span className="text-sm font-bold text-slate-700">{plan.maxGuestPasses.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {plan.allowL1 && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm text-slate-600">L1 - QR Code Access</span>
                  </div>
                )}
                {plan.allowL2 && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm text-slate-600">L2 - QR + OTP</span>
                  </div>
                )}
                {plan.allowL3 && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm text-slate-600">L3 - App Scanning</span>
                  </div>
                )}
                {plan.allowL4 && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-sm text-slate-600">L4 - Multi-Factor Auth</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Create New Plan</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreatePlan}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., Enterprise Plus"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Guards</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.maxGuards}
                    onChange={(e) => setCreateForm({ ...createForm, maxGuards: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Passes</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.maxGuestPasses}
                    onChange={(e) => setCreateForm({ ...createForm, maxGuestPasses: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Price (USD/month)</label>
                <input
                  type="text"
                  required
                  pattern="^\d+(\.\d{1,2})?$"
                  value={createForm.price}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="99.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Security Levels</label>
                <div className="space-y-2">
                  {['L1', 'L2', 'L3', 'L4'].map((level) => (
                    <label key={level} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm[`allow${level}` as keyof typeof createForm] as boolean}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, [`allow${level}`]: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700">Allow {level}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
