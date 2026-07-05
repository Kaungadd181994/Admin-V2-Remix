import React from 'react';
import { useData } from '../context/DataContext';
import { mmk, fmt } from '../types';
import { StatusBadge, Button } from '../components/UI';

export default function Dashboard() {
  const { data, addToast } = useData();
  
  const totalOutstanding = data.employees.reduce((s,e) => s + e.outstanding, 0) + data.disbursements.filter(d => d.status !== 'DISBURSED').reduce((s,d) => s + d.debit, 0);
  const activeCompanies = data.companies.filter(c => c.status === 'ACTIVE' || c.status === 'RISK_WARNING').length;
  const activeCustomers = data.employees.filter(e => e.status === 'ACTIVE').length;
  const monthDisb = data.disbursements.filter(d => d.status === 'DISBURSED').reduce((s,d) => s + d.net, 0);
  const lateFeeTotal = data.batches.reduce((s,b) => s + b.lateFees, 0);
  const companiesAtRisk = data.companies.filter(c => c.status === 'RISK_WARNING').length;

  const handleExport = () => {
    addToast('Export queued', 'Summary report will appear in Notifications.');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0">Platform Overview</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={handleExport}>⤓ Export Summary</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Outstanding</div>
          <div className="font-heading text-[21px] font-bold tracking-tight text-slate-800">{mmk(totalOutstanding)}</div>
          <div className="text-[11px] mt-1.5 text-red-500 font-medium">▼ across {data.companies.length} companies</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Active Companies</div>
          <div className="font-heading text-[21px] font-bold tracking-tight text-slate-800">{activeCompanies}</div>
          <div className="text-[11px] mt-1.5 text-green-500 font-medium">▲ +2 this quarter</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Active Employees</div>
          <div className="font-heading text-[21px] font-bold tracking-tight text-slate-800">{fmt(activeCustomers)}</div>
          <div className="text-[11px] mt-1.5 text-green-500 font-medium">▲ of {data.employees.length} tracked</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Disbursed — MTD</div>
          <div className="font-heading text-[21px] font-bold tracking-tight text-slate-800">{mmk(monthDisb)}</div>
          <div className="text-[11px] mt-1.5 text-green-500 font-medium">▲ 8.4% vs last month</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Late Fee Accrued</div>
          <div className="font-heading text-[21px] font-bold tracking-tight text-slate-800">{mmk(lateFeeTotal)}</div>
          <div className="text-[11px] mt-1.5 text-red-500 font-medium">▼ 2 companies overdue</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Companies at Risk</div>
          <div className="font-heading text-[21px] font-bold tracking-tight text-slate-800">{companiesAtRisk}</div>
          <div className="text-[11px] mt-1.5 text-red-500 font-medium">▼ Utilization &gt; 90%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="m-0 text-sm font-bold text-slate-700">Disbursement Volume</h3>
            <span className="text-slate-400 text-xs font-medium">MMK, millions</span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-3 h-[130px] pt-2">
              {[
                {m:'May',a:62,b:58},{m:'Jun',a:74,b:69},{m:'Jul',a:81,b:60}
              ].map((x, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex gap-1.5 items-end h-[110px] w-full">
                    <div className="w-full bg-gradient-to-b from-blue-500 to-blue-700 min-h-[2px] rounded-t-sm relative" style={{ height: `${(x.a/90)*100}%` }}></div>
                    <div className="w-full bg-gradient-to-b from-slate-400 to-slate-600 min-h-[2px] rounded-t-sm relative" style={{ height: `${(x.b/90)*100}%` }}></div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{x.m}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-xs font-medium text-slate-500 px-4 pb-4">
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500"></span>Disbursed</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400"></span>Repaid</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="m-0 text-sm font-bold text-slate-700">Active Customers (Last 3 Mo)</h3>
            <span className="text-slate-400 text-xs font-medium">Headcount</span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-3 h-[130px] pt-2">
              {[
                {m:'May',a:1200},{m:'Jun',a:1450},{m:'Jul',a:1820}
              ].map((x, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex gap-1.5 items-end h-[110px] w-full justify-center">
                    <div className="w-10 bg-gradient-to-b from-green-500 to-green-700 min-h-[2px] rounded-t-sm relative flex items-end justify-center pb-2 text-white text-[10px] font-bold" style={{ height: `${(x.a/2000)*100}%` }}>
                      {fmt(x.a)}
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{x.m}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-xs font-medium text-slate-500 px-4 pb-4">
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500"></span>Active KYC Verified</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="m-0 text-sm font-bold text-slate-700">Repayment Dashboard</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matched</div><div className="text-lg font-bold text-green-600">{data.batches.filter(b=>b.status==='MATCHED').length}</div></div>
              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partial</div><div className="text-lg font-bold text-yellow-600">{data.batches.filter(b=>b.status==='PARTIAL').length}</div></div>
              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missing</div><div className="text-lg font-bold text-red-600">{data.batches.filter(b=>b.status==='MISSING').length}</div></div>
              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suspense</div><div className="text-lg font-bold text-red-600">{data.batches.filter(b=>b.status==='SUSPENSE').length}</div></div>
            </div>
            <div className="text-[11px] text-slate-500 mt-3 leading-relaxed font-medium">Reconciliation runs nightly against expected deduction files. Go to Transactions → Journal for GL detail.</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="m-0 text-sm font-bold text-slate-700">Companies Requiring Attention</h3>
          <span className="text-slate-400 text-xs font-medium">Utilization &gt; 85% or in review</span>
        </div>
        <div className="overflow-x-auto">
          <table className="dt min-w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th>Company</th>
                <th>Type</th>
                <th>Tier</th>
                <th className="text-right font-mono">Limit</th>
                <th className="text-right font-mono">Utilized</th>
                <th>Utilization</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.companies.filter(c=>c.status==='RISK_WARNING'||c.status.startsWith('PENDING')).map(c => {
                const pct = c.limit ? Math.round((c.utilized/c.limit)*100) : 0;
                return (
                <tr key={c.id}>
                  <td>
                    <span className="text-text-main font-semibold">{c.name}</span>
                    <div className="text-text-mute text-[11px]">{c.id}</div>
                  </td>
                  <td><span className={`badge ${c.type==='CORPORATE'?'blue':'grey'}`}>{c.type}</span></td>
                  <td>{c.tier}</td>
                  <td className="text-right font-mono text-[12px] text-text-dim">{c.limit?fmt(c.limit):'—'}</td>
                  <td className="text-right font-mono text-[12px] text-text-dim">{c.utilized?fmt(c.utilized):'—'}</td>
                  <td>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-[100px] mb-1">
                      <div className={`h-full rounded-full ${pct>=90?'bg-red-500':pct>=70?'bg-yellow-500':'bg-blue-500'}`} style={{ width: `${Math.min(pct,100)}%` }}></div>
                    </div>
                    <span className="text-slate-500 text-[11px] font-medium">{pct}%</span>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><Button size="sm">Manage</Button></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
