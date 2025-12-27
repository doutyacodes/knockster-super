"use client"


import React, { useState } from 'react';
import { PlugZap, CheckCircle2, MessageSquare, Mail, Bell, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('messaging');

  const categories = [
    { id: 'messaging', name: 'Messaging & SMS', icon: MessageSquare },
    { id: 'email', name: 'Email SMTP', icon: Mail },
    { id: 'notifications', name: 'Push Notifications', icon: Bell },
    { id: 'enterprise', name: 'Enterprise API', icon: Globe },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Integrations</h1>
        <p className="text-slate-500">Connect external providers to power SMS, Email, and Push services.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all
                ${activeTab === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}
              `}
            >
              <cat.icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  {categories.find(c => c.id === activeTab)?.icon && React.createElement(categories.find(c => c.id === activeTab)!.icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{categories.find(c => c.id === activeTab)?.name} Config</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-xs text-emerald-600 font-bold uppercase">System Connected</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold text-sm">
                <span>View API Documentation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {activeTab === 'messaging' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800">Primary SMS Provider (Twilio)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Account SID</label>
                        <input type="password" value="ACxxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Auth Token</label>
                        <input type="password" value="••••••••••••••••••••••••••••" readOnly className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800">Global Routing Rules</h4>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Enable Backup Provider</span>
                        <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">US-Region Failover</span>
                        <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'messaging' && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Standard Configuration Active</h4>
                  <p className="text-sm text-slate-500 max-w-sm mt-2">The default enterprise settings are currently managing this integration module. Select "Modify" to use custom provider credentials.</p>
                  <button className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all">Modify Custom Settings</button>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Settings synchronized across all nodes</span>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100">Save Configuration</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
