import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { fmt, mmk } from '../types';
import { Badge, TableToolbar, TablePagination, Button, Drawer } from '../components/UI';

export default function Risk() {
  const { data, addToast, pushAudit } = useData();
  const tierColor = (t: string) => ({A:'green',B:'blue',C:'grey',D:'amber',E:'red'}[t]||'grey');
  
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  
  // Filter states
  const [filterTier, setFilterTier] = useState('');
  const [minUtilization, setMinUtilization] = useState('');

  // Drilldown state
  const [detailCorp, setDetailCorp] = useState<any>(null);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) => setSelected(prev => prev.length === ids.length ? [] : ids);
  
  const filtered = data.riskExposure.filter((r: any) => {
    const q = search.toLowerCase();
    const matchSearch = r.corp.toLowerCase().includes(q) || r.tier.toLowerCase().includes(q);
    const matchTier = !filterTier || r.tier === filterTier;
    const matchUtil = !minUtilization || r.util >= Number(minUtilization);

    return matchSearch && matchTier && matchUtil;
  });

  const handleBulkExport = () => {
    const targets = selected.length > 0 
      ? data.riskExposure.filter((r: any) => selected.includes(r.corp))
      : filtered;

    if (targets.length === 0) {
      addToast('No records', 'Nothing matches the selected or filtered query.', 'warn');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Corporate Name,Risk Tier,Allowable Limit (MMK),Current Utilized (MMK),Employees count,Utilization percentage"].join(",") + "\n"
      + targets.map(r => `"${r.corp}",${r.tier},${r.allowable},${r.current},${r.count},${r.util}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ewa_risk_exposure_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Risk report exported', `Downloaded credit exposure metrics for ${targets.length} companies.`, 'ok');
    setSelected([]);
  };

  const handleBulkAssess = () => {
    if (selected.length === 0) return;
    addToast('Re-assessment triggered', `Initiated automated risk review workflow for ${selected.length} companies.`, 'ok');
    selected.forEach(corp => pushAudit('RISK_REASSESSMENT_QUEUE', corp, 'Queued corporate for credit assessment and tier update.'));
    setSelected([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0 mb-1">Corporate Credit Risk &amp; Exposure</h1>
          <div className="text-xs text-slate-500 font-medium font-sans">Real-time credit limit enforcement and utilization monitoring of multi-tenant escrow accounts.</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500 cursor-pointer">
            <option>July 2026 (current cycle)</option>
            <option>June 2026</option>
            <option>May 2026</option>
          </select>
        </div>
      </div>

      <TableToolbar 
        search={search} 
        setSearch={setSearch} 
        placeholder="Search corporates or risk tiers..."
        searchFields={['Corporate Name', 'Risk Tier']}
        count={filtered.length}
        onExport={handleBulkExport}
        onAdvancedFilter={() => setAdvancedFilterOpen(true)}
        filters={
          <select 
            className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500 cursor-pointer"
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
          >
            <option value="">All Risk Tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
            <option value="D">Tier D</option>
            <option value="E">Tier E</option>
          </select>
        }
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selected.length}</span>
            <span className="text-[12.5px] font-semibold text-blue-800">Corporates selected for credit review</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="success" onClick={handleBulkAssess}>
              ⚡ Request Risk Audit Re-Assessment
            </Button>
            <Button size="sm" variant="default" onClick={handleBulkExport}>
              📥 Export Selected ({selected.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])} className="!text-slate-500 hover:!bg-slate-200">
              Deselect All
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
        <table className="dt min-w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={() => toggleAll(filtered.map((x: any)=>x.corp))} /></th>
              <th className="px-4 py-3">Corporate</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3 text-right">Allowable Amount</th><th className="px-4 py-3 text-right">Current Utilized</th><th className="px-4 py-3 text-right">Active Onboarded Employees</th><th className="px-4 py-3">Utilization</th><th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] text-slate-700">
            {filtered.map((r: any) => (
              <tr key={r.corp} className={selected.includes(r.corp) ? 'bg-blue-50/50' : ''}>
                <td className="px-4"><input type="checkbox" checked={selected.includes(r.corp)} onChange={() => toggle(r.corp)} /></td>
                <td className="font-semibold text-slate-900">{r.corp}</td>
                <td><Badge color={tierColor(r.tier)}>Tier {r.tier}</Badge></td>
                <td className="text-right font-mono text-[12px] text-text-dim">{fmt(r.allowable)}</td>
                <td className="text-right font-mono text-[12px] text-text-dim">{fmt(r.current)}</td>
                <td className="text-right font-mono text-[12px] text-text-dim">{r.count}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 bg-slate-100 border border-slate-200 rounded-full relative w-24 overflow-hidden shadow-inner">
                      <i className={`absolute left-0 top-0 bottom-0 rounded-full ${r.util>=90?'bg-rose-500':r.util>=70?'bg-amber-500':'bg-emerald-500'}`} style={{ width: `${Math.min(r.util,100)}%` }}></i>
                    </div>
                    <span className="text-slate-700 text-[11.5px] font-mono font-bold">{r.util}%</span>
                  </div>
                </td>
                <td className="text-right pr-4">
                  <Button size="sm" variant="ghost" onClick={() => setDetailCorp(r)}>Details</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-slate-400 py-10 italic">No companies match your current credit filter parameters.</td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination total={filtered.length} maxPerPage={100} />
      </div>

      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine corporate risk constraints</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Risk Rating Tier</label>
            <select 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500"
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option value="A">Tier A (Lowest Risk)</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
              <option value="D">Tier D</option>
              <option value="E">Tier E (Highest Risk)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Min Utilization (%)</label>
            <input 
              type="number"
              placeholder="e.g. 70"
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono"
              value={minUtilization}
              onChange={e => setMinUtilization(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)} className="flex-1">Apply Filters</Button>
            <Button variant="ghost" onClick={() => {
              setFilterTier('');
              setMinUtilization('');
              setAdvancedFilterOpen(false);
            }}>Reset All</Button>
          </div>
        </div>
      </Drawer>

      {/* Credit Risk Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-5">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="m-0 text-sm font-bold text-slate-700">Risk Tier Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="dt min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Multiplier</th><th className="px-4 py-3">Per-Employee Cap</th><th className="px-4 py-3">Review Cycle</th></tr>
            </thead>
            <tbody className="text-[12.5px] text-slate-700">
              <tr><td><Badge color="green">A</Badge></td><td className="font-mono text-[12px] text-text-dim">85–100</td><td className="font-mono text-[12px] text-text-dim">1.5x</td><td className="font-mono text-[12px] text-text-dim">80% of salary</td><td>Annually</td></tr>
              <tr><td><Badge color="blue">B</Badge></td><td className="font-mono text-[12px] text-text-dim">70–84</td><td className="font-mono text-[12px] text-text-dim">1.2x</td><td className="font-mono text-[12px] text-text-dim">65% of salary</td><td>Bi-annually</td></tr>
              <tr><td><Badge color="grey">C</Badge></td><td className="font-mono text-[12px] text-text-dim">55–69</td><td className="font-mono text-[12px] text-text-dim">1.0x</td><td className="font-mono text-[12px] text-text-dim">50% of salary</td><td>Quarterly</td></tr>
              <tr><td><Badge color="amber">D</Badge></td><td className="font-mono text-[12px] text-text-dim">40–54</td><td className="font-mono text-[12px] text-text-dim">0.7x</td><td className="font-mono text-[12px] text-text-dim">35% of salary</td><td>Monthly</td></tr>
              <tr><td><Badge color="red">E</Badge></td><td className="font-mono text-[12px] text-text-dim">&lt;40</td><td className="font-mono text-[12px] text-text-dim">0.5x</td><td className="font-mono text-[12px] text-text-dim">20% of salary</td><td>Weekly + Freeze risk</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Details Drawer */}
      <Drawer isOpen={!!detailCorp} onClose={() => setDetailCorp(null)} mode="right">
        {detailCorp && (
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
                <div>
                  <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Corporate Exposure Breakdown</h2>
                  <div className="text-[11.5px] text-text-mute">{detailCorp.corp}</div>
                </div>
                <button type="button" className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setDetailCorp(null)}>✕</button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9px] mb-0.5">Assigned Risk Grade</span>
                    <Badge color={tierColor(detailCorp.tier)}>Tier {detailCorp.tier}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9px] mb-0.5">Active Employee Count</span>
                    <strong className="text-slate-800 font-mono text-[12.5px]">{detailCorp.count} Onboarded</strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Escrow Exposure Allocation</span>
                  <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-sans">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Pre-Approved Allowable Pool</span>
                      <strong className="text-slate-800 font-mono text-[12.5px]">{mmk(detailCorp.allowable)}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Currently Disbursed (Drawn)</span>
                      <strong className="text-slate-800 font-mono text-[12.5px]">{mmk(detailCorp.current)}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-100 font-bold">
                      <span className="text-blue-700">Remaining Available Liquidity</span>
                      <strong className="text-blue-800 font-mono text-[12.5px]">{mmk(detailCorp.allowable - detailCorp.current)}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Utilization Ratio Indicator</span>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Exposure utilized</span>
                      <span className={`text-xs font-bold font-mono ${detailCorp.util>=90?'text-rose-600':detailCorp.util>=70?'text-amber-600':'text-emerald-600'}`}>
                        {detailCorp.util}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full relative overflow-hidden shadow-inner">
                      <i className={`absolute left-0 top-0 bottom-0 rounded-full ${detailCorp.util>=90?'bg-rose-500':detailCorp.util>=70?'bg-amber-500':'bg-emerald-500'}`} style={{ width: `${Math.min(detailCorp.util,100)}%` }}></i>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      {detailCorp.util >= 90 
                        ? "⚠️ CRITICAL EXPOSURE: This corporate has utilized over 90% of their allocated credit limit. Automatic onboarding of new employees and further EWA disbursements are restricted until a payment reconciliation or limit upgrade is approved."
                        : "✓ SAFE OPERATION: Credit utilization is within normal operating ranges. Velocity policies and automatic triggers are active."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-line bg-slate-50">
              <Button variant="default" className="w-full" onClick={() => setDetailCorp(null)}>
                Close Exposure Breakdowns
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
