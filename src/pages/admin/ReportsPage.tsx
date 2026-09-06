import { useState } from 'react';
import { FileText, Download, TrendingUp, Users, Target, ShieldCheck } from 'lucide-react';
import { useToast } from '../../lib/toast';

export const ReportsPage = () => {
  const { success } = useToast();

  const handleDownloadReport = (type: string) => {
    success(`Generated ${type} report. Downloading CSV...`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand font-bold text-xs uppercase tracking-widest">Platform Telemetry</span>
        </div>
        <h1 className="text-3xl font-black uppercase text-white tracking-tight">Executive & Compliance Reports</h1>
        <p className="text-sm text-slate-400">
          Generate structured exports of talent acquisition metrics, trial attendance, and statutory safeguarding compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Child Safeguarding & FA Audit Report',
            description: 'Comprehensive export of youth player registrations, linked guardians, and immutable consent events.',
            icon: ShieldCheck,
            type: 'Safeguarding_Compliance_Q1',
          },
          {
            title: 'Recruitment Funnel & Trials Report',
            description: 'Listing conversion rates, application response times by clubs, and trial completion figures.',
            icon: Target,
            type: 'Recruitment_Conversion_Metrics',
          },
          {
            title: 'Club Verification Status Ledger',
            description: 'Audit log of authorized clubs, DBS certification expiration dates, and pending applications.',
            icon: Users,
            type: 'Club_Verification_Ledger',
          },
        ].map((rep) => (
          <div key={rep.title} className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="p-3 bg-brand/10 text-brand rounded-2xl w-fit mb-3">
                <rep.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">{rep.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rep.description}</p>
            </div>

            <button
              onClick={() => handleDownloadReport(rep.type)}
              className="bg-brand hover:bg-brand-hover text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
