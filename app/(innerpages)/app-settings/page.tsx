'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

interface AppConfig {
  id: string;
  guestAppMaintenance: boolean;
  guestAppMaintenanceMessage: string | null;
  securityAppMaintenance: boolean;
  securityAppMaintenanceMessage: string | null;
  guestAppForceUpdate: boolean;
  guestAppMinVersion: string | null;
  securityAppForceUpdate: boolean;
  securityAppMinVersion: string | null;
  updatedAt: string;
}

export default function AppSettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Local state for form inputs
  const [guestMaintenance, setGuestMaintenance] = useState(false);
  const [guestMaintenanceMsg, setGuestMaintenanceMsg] = useState('');
  const [securityMaintenance, setSecurityMaintenance] = useState(false);
  const [securityMaintenanceMsg, setSecurityMaintenanceMsg] = useState('');
  const [guestForceUpdate, setGuestForceUpdate] = useState(false);
  const [guestMinVersion, setGuestMinVersion] = useState('');
  const [securityForceUpdate, setSecurityForceUpdate] = useState(false);
  const [securityMinVersion, setSecurityMinVersion] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.get<AppConfig>('/api/superadmin/app-config');
      setConfig(data);

      // Initialize form state
      setGuestMaintenance(data.guestAppMaintenance);
      setGuestMaintenanceMsg(data.guestAppMaintenanceMessage || '');
      setSecurityMaintenance(data.securityAppMaintenance);
      setSecurityMaintenanceMsg(data.securityAppMaintenanceMessage || '');
      setGuestForceUpdate(data.guestAppForceUpdate);
      setGuestMinVersion(data.guestAppMinVersion || '');
      setSecurityForceUpdate(data.securityAppForceUpdate);
      setSecurityMinVersion(data.securityAppMinVersion || '');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedConfig = await api.patch<AppConfig>('/api/superadmin/app-config', {
        guestAppMaintenance: guestMaintenance,
        guestAppMaintenanceMessage: guestMaintenanceMsg || null,
        securityAppMaintenance: securityMaintenance,
        securityAppMaintenanceMessage: securityMaintenanceMsg || null,
        guestAppForceUpdate: guestForceUpdate,
        guestAppMinVersion: guestMinVersion || null,
        securityAppForceUpdate: securityForceUpdate,
        securityAppMinVersion: securityMinVersion || null,
      });

      setConfig(updatedConfig);
      showNotification('success', 'Configuration saved successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">App Settings</h1>
          <p className="text-slate-500 mt-1">Manage maintenance mode and force update settings for mobile apps</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Guest App Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Guest App Configuration</h2>
              <p className="text-sm text-slate-600">Settings for the guest mobile application</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-slate-800">Maintenance Mode</h3>
                {guestMaintenance && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                When enabled, guest app users will see a maintenance message and cannot use the app
              </p>
              {guestMaintenance && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={guestMaintenanceMsg}
                    onChange={(e) => setGuestMaintenanceMsg(e.target.value)}
                    placeholder="Enter the message to display to users during maintenance..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={guestMaintenance}
                onChange={(e) => setGuestMaintenance(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Force Update */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-slate-800">Force Update</h3>
                {guestForceUpdate && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Force users to update to a minimum version before using the app
              </p>
              {guestForceUpdate && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Required Version
                  </label>
                  <input
                    type="text"
                    value={guestMinVersion}
                    onChange={(e) => setGuestMinVersion(e.target.value)}
                    placeholder="e.g., 1.2.0"
                    className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={guestForceUpdate}
                onChange={(e) => setGuestForceUpdate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security App Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Security App Configuration</h2>
              <p className="text-sm text-slate-600">Settings for the security personnel mobile application</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-slate-800">Maintenance Mode</h3>
                {securityMaintenance && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                When enabled, security app users will see a maintenance message and cannot use the app
              </p>
              {securityMaintenance && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={securityMaintenanceMsg}
                    onChange={(e) => setSecurityMaintenanceMsg(e.target.value)}
                    placeholder="Enter the message to display to security personnel during maintenance..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={securityMaintenance}
                onChange={(e) => setSecurityMaintenance(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Force Update */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-slate-800">Force Update</h3>
                {securityForceUpdate && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Force security personnel to update to a minimum version before using the app
              </p>
              {securityForceUpdate && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Required Version
                  </label>
                  <input
                    type="text"
                    value={securityMinVersion}
                    onChange={(e) => setSecurityMinVersion(e.target.value)}
                    placeholder="e.g., 1.2.0"
                    className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={securityForceUpdate}
                onChange={(e) => setSecurityForceUpdate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {config && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center space-x-2 text-sm text-slate-600">
          <AlertTriangle className="w-4 h-4" />
          <span>
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
