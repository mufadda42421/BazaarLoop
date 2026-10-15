import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { api } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Package,
  MessageSquare,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';

interface AdminViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports()
      ]);
      setStats(statsRes.stats);
      setReports(reportsRes.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await api.updateAdminReport(reportId, status);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update report');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Administrator privileges are strictly enforced on the server.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* Header */}
      <section className="bg-white border-b border-slate-200/60 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest font-['Space_Grotesk']">
              Moderation & Platform Health
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] mt-1">
              Admin Trust & Safety Console
            </h1>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" /> Exit Console
          </button>
        </div>

        {/* Real Platform Statistics */}
        {stats && (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Registered Users</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {stats.totalUsers}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Active Listings</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {stats.activeProducts} / {stats.totalProducts}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Total Conversations</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-['Space_Grotesk']">
                {stats.totalConversations}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500">Pending Reports</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1 font-['Space_Grotesk']">
                {stats.pendingReports}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Reports Queue */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
            Trust & Safety Reports Queue ({filteredReports.length})
          </h2>

          <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            {(['all', 'pending', 'resolved', 'dismissed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setReportFilter(tab)}
                className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px] ${
                  reportFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No reports in this category. All clear!
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Report: {r.targetType.toUpperCase()} — "{r.targetTitleOrName}"
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'pending'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : r.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium mt-1">
                    Reason: <strong className="text-rose-600">{r.reason}</strong>
                  </p>

                  {r.details && (
                    <p className="text-xs text-slate-500 italic mt-0.5">
                      "{r.details}"
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 mt-1">
                    Reported by {r.reporterName} on {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateReportStatus(r.id, 'resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve & Action
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(r.id, 'dismissed')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
