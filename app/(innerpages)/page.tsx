
import React from 'react';
import { Network, Users, UserCheck, Shield, ChevronRight, Activity, Clock } from 'lucide-react';
import { AUDIT_LOGS } from '@/constants';
import StatCard from '@/components/StatCard';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">System Overview</h1>
        <p className="text-slate-500">Global security heartbeat and organizational metrics.</p>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Organizations" 
          value="42" 
          trend="12%" 
          trendUp={true} 
          icon={Network} 
          color="bg-blue-600" 
        />
        <StatCard 
          label="Organization Admins" 
          value="156" 
          trend="8%" 
          trendUp={true} 
          icon={Users} 
          color="bg-indigo-600" 
        />
        <StatCard 
          label="Active Guest Passes" 
          value="1,240" 
          trend="3%" 
          trendUp={false} 
          icon={UserCheck} 
          color="bg-emerald-600" 
        />
        <StatCard 
          label="Security Events Today" 
          value="4,832" 
          trend="24%" 
          trendUp={true} 
          icon={Shield} 
          color="bg-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Security Tier Usage */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Security Tier Adoption</h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-6">
            {[
              { tier: 'L1', name: 'Basic (QR)', count: 12, percentage: 28, color: 'bg-slate-400' },
              { tier: 'L2', name: 'OTP Verified', count: 18, percentage: 42, color: 'bg-blue-400' },
              { tier: 'L3', name: 'App Secure', count: 8, percentage: 19, color: 'bg-indigo-500' },
              { tier: 'L4', name: 'Elite MFA', count: 4, percentage: 11, color: 'bg-violet-600' },
            ].map((item) => (
              <div key={item.tier}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${item.color}`}>{item.tier}</span>
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">{item.count} orgs</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`${item.color} h-full transition-all duration-1000`} 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Global Activity Stream</h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {AUDIT_LOGS.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-all flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                    log.status === 'denied' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.location} • {log.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                    log.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
