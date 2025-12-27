"use client"


import React, { useState } from 'react';
import { Settings as SettingsIcon, Clock, Timer, Image as ImageIcon, Save, CheckCircle, RefreshCcw } from 'lucide-react';

const Settings: React.FC = () => {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = () => {
    setSaveState('saving');
    setTimeout(() => setSaveState('saved'), 1500);
    setTimeout(() => setSaveState('idle'), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Platform Settings</h1>
        <p className="text-slate-500">Global system parameters and branding configuration.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Security Parameters */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center space-x-3 mb-8">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Access Token Lifecycle</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">QR Code Expiry</label>
              <div className="relative">
                <input type="number" defaultValue={15} className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Minutes</span>
              </div>
              <p className="text-xs text-slate-400">Time until a generated guest QR code becomes invalid.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">OTP Validity Duration</label>
              <div className="relative">
                <input type="number" defaultValue={60} className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Seconds</span>
              </div>
              <p className="text-xs text-slate-400">Wait time allowed for SMS/Email OTP verification.</p>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center space-x-3 mb-8">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Whitelabel & Branding</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center group hover:border-blue-300 transition-all cursor-pointer">
              <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-blue-400 mb-2" />
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase">Upload Logo</span>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="font-bold text-slate-800">Primary Platform Identity</h4>
                <p className="text-sm text-slate-500 mt-1">This logo will appear on all admin consoles and guest digital passes worldwide.</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">Replace Branding</button>
                <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50">Reset to Default</button>
              </div>
            </div>
          </div>
        </section>

        {/* Persistence Actions */}
        <div className="flex items-center justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={`
              flex items-center space-x-3 px-8 py-4 rounded-3xl font-bold transition-all shadow-xl
              ${saveState === 'saved' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}
              ${saveState === 'saving' ? 'opacity-70 cursor-wait' : ''}
            `}
          >
            {saveState === 'idle' && (
              <>
                <Save className="w-5 h-5" />
                <span>Save Global Settings</span>
              </>
            )}
            {saveState === 'saving' && (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            )}
            {saveState === 'saved' && (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Changes Applied Globally</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
