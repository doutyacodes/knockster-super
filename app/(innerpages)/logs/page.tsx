"use client"


import React from 'react';
import { ClipboardList, Search, Calendar, Filter, Download, ExternalLink } from 'lucide-react';
import { AUDIT_LOGS } from '@/constants';

const AuditLogs: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-slate-500">Immutable trail of all security events and administrative actions.</p>
        </div>
        <button className="flex items-center justify-center space-x-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm">
          <Download className="w-5 h-5" />
          <span>Export Logs</span>
        </button>
      </header>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by user, action, or location..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom Range</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
            <option>All Statuses</option>
            <option>Success Only</option>
            <option>Denied/Failed</option>
            <option>Flagged</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Initiator</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action Description</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {AUDIT_LOGS.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">{log.timestamp.split(' ')[1]}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{log.timestamp.split(' ')[0]}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                      {log.user.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{log.user}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{log.action}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500 font-medium">{log.location}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                    log.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-blue-600 transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {/* Repeat logs to simulate a longer list */}
            {AUDIT_LOGS.map((log) => (
              <tr key={log.id + '_2'} className="hover:bg-slate-50/50 transition-all opacity-70">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">{log.timestamp.split(' ')[1]}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{log.timestamp.split(' ')[0]}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="text-sm font-medium text-slate-700">{log.user}</span></td>
                <td className="px-6 py-4"><span className="text-sm text-slate-600">{log.action}</span></td>
                <td className="px-6 py-4"><span className="text-sm text-slate-500">{log.location}</span></td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                    log.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
