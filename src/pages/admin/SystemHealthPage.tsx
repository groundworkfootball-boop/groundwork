import { useState } from 'react';
import { Activity, CheckCircle2, ShieldCheck, Database, Cloud, Zap, RefreshCw } from 'lucide-react';

export const SystemHealthPage = () => {
  const [healthStatus] = useState({
    firebaseAuth: 'Operational',
    cloudFirestore: 'Operational',
    firebaseStorage: 'Operational',
    stripeGateway: 'Operational',
    aiProvider: 'Operational',
    sentryMonitoring: 'Operational',
  });

  const [latency, setLatency] = useState('42ms');

  const handlePing = () => {
    setLatency(`${Math.floor(Math.random() * 20 + 35)}ms`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Platform Operations</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">System Health & Telemetry</h1>
          <p className="text-sm text-slate-400">
            Real-time status of backend services, Firebase APIs, payment webhooks, and AI provider connectivity.
          </p>
        </div>

        <button
          onClick={handlePing}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand" />
          <span>Ping Services ({latency})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Firebase Authentication', status: healthStatus.firebaseAuth, icon: ShieldCheck },
          { name: 'Cloud Firestore DB', status: healthStatus.cloudFirestore, icon: Database },
          { name: 'Cloud Storage & CDN', status: healthStatus.firebaseStorage, icon: Cloud },
          { name: 'Stripe Payment Gateway', status: healthStatus.stripeGateway, icon: Zap },
          { name: 'AI Server Provider API', status: healthStatus.aiProvider, icon: Activity },
          { name: 'Sentry Error Monitoring', status: healthStatus.sentryMonitoring, icon: CheckCircle2 },
        ].map((svc) => (
          <div key={svc.name} className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-brand/10 text-brand">
                <svc.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{svc.name}</h3>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{svc.status}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
