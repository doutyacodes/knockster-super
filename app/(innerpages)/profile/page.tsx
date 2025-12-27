"use client"



import React from 'react';
import { UserCircle, Shield, Key, LogOut, Mail, Globe, AlertCircle } from 'lucide-react';

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Account Profile</h1>
        <p className="text-slate-500">Manage your administrative credentials and security settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Account Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCircle className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Root Super Admin</h3>
            <p className="text-sm text-slate-500 mb-6">admin@knockster.io</p>
            <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
              Full System Authority
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Account Details</h4>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-slate-500">
                <Mail className="w-4 h-4 mr-3 text-slate-400" />
                <span>admin@knockster.io</span>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <Globe className="w-4 h-4 mr-3 text-slate-400" />
                <span>Timezone: UTC +0</span>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <Shield className="w-4 h-4 mr-3 text-slate-400" />
                <span>MFA Status: Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Security Forms */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center space-x-3">
              <Key className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Security Credentials</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all">Update Security Access</button>
              </div>
            </div>
          </section>

          <section className="bg-red-50/30 rounded-3xl border border-red-100 shadow-sm p-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                <p className="text-sm text-red-700/70 mt-1 mb-6">Ending your session will require a full re-authentication including 2FA if enabled. All current active console tabs will be revoked.</p>
                <button 
                  onClick={onLogout}
                  className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out of All Devices
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
