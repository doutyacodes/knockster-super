'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, ShieldCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

interface RecipientStats {
  totalUsers: number;
  totalTokens: number;
}

interface NotificationResult {
  success: boolean;
  message: string;
  sentCount?: number;
  failedCount?: number;
  totalTokens?: number;
}

export default function NotificationsPage() {
  const [recipientType, setRecipientType] = useState<'guest' | 'security'>('guest');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState<'general' | 'alert' | 'system' | 'invitation' | 'scan'>('general');
  const [stats, setStats] = useState<RecipientStats>({ totalUsers: 0, totalTokens: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);

  // Fetch recipient stats when recipient type changes
  useEffect(() => {
    fetchStats();
  }, [recipientType]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get<RecipientStats>(
        `/api/superadmin/notifications/recipients?type=${recipientType}`
      );
      setStats(response || { totalUsers: 0, totalTokens: 0 });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ totalUsers: 0, totalTokens: 0 });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ success: false, message: 'Please fill in both title and message' });
      return;
    }

    if (stats.totalTokens === 0) {
      setResult({ success: false, message: `No ${recipientType} users with notification tokens found` });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post<NotificationResult>(
        '/api/superadmin/notifications/send',
        {
          recipientType,
          title,
          body,
          type: notificationType,
        }
      );

      setResult(response);

      // Clear form on success
      if (response.success) {
        setTitle('');
        setBody('');
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to send notification',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Bell className="w-7 h-7 mr-3 text-blue-600" />
            Broadcast Notifications
          </h1>
          <p className="text-slate-500 mt-1">Send push notifications to all guests or all security personnel</p>
        </div>
      </div>

      {/* Result Alert */}
      {result && (
        <div className={`p-4 rounded-xl border ${
          result.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <div>
              <p className="font-medium">{result.message}</p>
              {result.sentCount !== undefined && (
                <p className="text-sm mt-1">
                  Sent: {result.sentCount} | Failed: {result.failedCount || 0} | Total: {result.totalTokens || 0}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Type Selection */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Select Recipient Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRecipientType('guest')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  recipientType === 'guest'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">All Guest Users</p>
                <p className="text-xs mt-1 opacity-75">
                  {loadingStats ? 'Loading...' : `${stats.totalUsers} users, ${stats.totalTokens} devices`}
                </p>
              </button>
              <button
                onClick={() => setRecipientType('security')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  recipientType === 'security'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">All Security Personnel</p>
                <p className="text-xs mt-1 opacity-75">
                  {loadingStats ? 'Loading...' : `${stats.totalUsers} users, ${stats.totalTokens} devices`}
                </p>
              </button>
            </div>
          </div>

          {/* Notification Content */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Notification Content</h2>
            <div className="space-y-4">
              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notification Type
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="alert">Alert</option>
                  <option value="system">System</option>
                  {recipientType === 'guest' && <option value="invitation">Invitation</option>}
                  <option value="scan">Scan Event</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">{title.length}/100 characters</p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter notification message..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">{body.length}/500 characters</p>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendNotification}
            disabled={loading || stats.totalTokens === 0 || !title.trim() || !body.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send to All {recipientType === 'guest' ? 'Guests' : 'Security'} ({stats.totalTokens} devices)
              </>
            )}
          </button>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 sticky top-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Broadcast Info</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="font-semibold text-blue-700 mb-1">Current Target:</p>
                <p className="capitalize">{recipientType === 'guest' ? 'All Guest Users' : 'All Security Personnel'}</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3">
                <p className="font-semibold text-blue-700 mb-1">Recipients:</p>
                <p>{stats.totalUsers} {recipientType === 'guest' ? 'guests' : 'security staff'}</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3">
                <p className="font-semibold text-blue-700 mb-1">Devices:</p>
                <p>{stats.totalTokens} registered devices</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3 text-xs">
                <p className="font-semibold text-blue-700 mb-1">Note:</p>
                <p className="text-slate-600">This will send the notification to all registered devices for the selected user type.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
