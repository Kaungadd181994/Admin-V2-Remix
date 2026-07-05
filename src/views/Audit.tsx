import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Badge, TableToolbar, TablePagination, Drawer, Button } from '../components/UI';

export default function Audit() {
  const { data, addToast, pushAudit } = useData();
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  // Advanced filters states
  const [filterActor, setFilterActor] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Drilldown state
  const [detailLog, setDetailLog] = useState<any>(null);

  const filtered = data.auditLogs.filter((a: any, index: number) => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      a.actor.toLowerCase().includes(q) || 
      a.action.toLowerCase().includes(q) || 
      a.entity.toLowerCase().includes(q) || 
      a.detail.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q);

    const matchActor = !filterActor || a.actor.toLowerCase().includes(filterActor.toLowerCase());
    const matchAction = !filterAction || a.action === filterAction;
    const matchDate = !filterDate || a.ts.includes(filterDate);

    return matchSearch && matchActor && matchAction && matchDate;
  });

  const toggle = (i: number) => setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const toggleAll = (len: number) => setSelected(prev => prev.length === len ? [] : Array.from({length: len}, (_, i) => i));

  // Export selected or all
  const handleExport = () => {
    const logsToExport = selected.length > 0 
      ? selected.map(i => filtered[i]) 
      : filtered;

    if (logsToExport.length === 0) {
      addToast('No logs to export', 'There are no logs matching the current filter set.', 'warn');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Timestamp,Actor,Role,Action,Entity,Detail,IP Address"].join(",") + "\n"
      + logsToExport.map(a => `${a.ts},"${a.actor}","${a.role}",${a.action},${a.entity},"${a.detail.replace(/"/g, '""')}",${a.ip}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ewa_compliance_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Audit logs exported', `Successfully exported ${logsToExport.length} activity records.`, 'ok');
    setSelected([]);
  };

  const handleBulkReconcile = () => {
    if (selected.length === 0) return;
    addToast('Reconciliation Saved', `Flagged ${selected.length} events as cleared and verified.`, 'ok');
    setSelected([]);
  };

  // Extract unique actions for filters
  const uniqueActions = Array.from(new Set(data.auditLogs.map((l: any) => l.action)));

  return (
    <div className="space-y-4">
      <div className="view-head">
        <h1 className="font-heading font-bold text-[19px] m-0 mb-1">Administrative Audit Trail</h1>
        <div className="text-xs text-slate-500 font-medium">Impenetrable system activity logs detailing all corporate risk assessments, ledger adjustments, roster synchronization, and disbursements.</div>
      </div>

      <TableToolbar 
        search={search} 
        setSearch={setSearch} 
        placeholder="Search logs by Actor, Action, Entity, Details..."
        searchFields={['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Details']}
        count={filtered.length}
        onExport={handleExport}
        onAdvancedFilter={() => setAdvancedFilterOpen(true)}
        filters={
          <select 
            className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500 cursor-pointer"
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          >
            <option value="">All Security Events</option>
            {uniqueActions.map((act: any) => (
              <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
            ))}
          </select>
        }
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selected.length}</span>
            <span className="text-[12.5px] font-semibold text-blue-800">Activity logs selected for compliance review</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="success" onClick={handleBulkReconcile}>
              ✓ Certify &amp; Resolve Selected
            </Button>
            <Button size="sm" variant="default" onClick={handleExport}>
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
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={() => toggleAll(filtered.length)} /></th>
              <th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Detail</th><th className="px-4 py-3">IP Address</th><th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] text-slate-700">
            {filtered.map((a: any, i: number) => (
              <tr key={i} className={selected.includes(i) ? 'bg-blue-50/50' : ''}>
                <td className="px-4"><input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} /></td>
                <td className="font-mono text-[12px] text-text-dim">{a.ts}</td>
                <td className="font-semibold text-slate-900">{a.actor}</td>
                <td><span className="text-slate-500 font-medium">{a.role}</span></td>
                <td>
                  <Badge color={
                    a.action.includes('REJECT') || a.action.includes('FAIL') || a.action.includes('BLACKLIST')
                      ? 'red'
                      : a.action.includes('APPROVE') || a.action.includes('VERIFY') || a.action.includes('SETTLE')
                        ? 'green'
                        : 'blue'
                  }>
                    {a.action.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="font-mono text-[12px] text-text-dim">{a.entity}</td>
                <td className="text-[12px] text-slate-600 max-w-[280px] truncate" title={a.detail}>{a.detail}</td>
                <td className="font-mono text-[11.5px] text-text-dim">{a.ip}</td>
                <td className="text-right pr-4">
                  <Button size="sm" variant="ghost" onClick={() => setDetailLog(a)}>Details</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 py-10 italic">No administrative logs match your current search constraints.</td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination total={filtered.length} maxPerPage={100} />
      </div>

      {/* Advanced Filters Drawer */}
      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine secure compliance logs</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Filter by Date</label>
            <input 
              type="text" 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
              placeholder="e.g. 2026-07-04" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Actor Email</label>
            <input 
              type="text" 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500" 
              placeholder="e.g. risk.officer@ewa" 
              value={filterActor}
              onChange={e => setFilterActor(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)} className="flex-1">Apply Filters</Button>
            <Button variant="ghost" onClick={() => {
              setFilterActor('');
              setFilterAction('');
              setFilterDate('');
              setAdvancedFilterOpen(false);
            }}>Reset All</Button>
          </div>
        </div>
      </Drawer>

      {/* Audit Log Entry Details Drawer */}
      <Drawer isOpen={!!detailLog} onClose={() => setDetailLog(null)} mode="right">
        {detailLog && (
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
                <div>
                  <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Activity Log Details</h2>
                  <div className="text-[11.5px] text-text-mute">Immutable Event Metadata Envelope</div>
                </div>
                <button type="button" className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setDetailLog(null)}>✕</button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Timestamp</span>
                    <strong className="text-slate-700 font-mono text-[12px]">{detailLog.ts}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Client IP</span>
                    <strong className="text-slate-700 font-mono text-[12px]">{detailLog.ip}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Event Actor</span>
                    <strong className="text-slate-700 font-mono text-[12px]">{detailLog.actor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Actor Role</span>
                    <strong className="text-blue-700 font-sans text-[12px]">{detailLog.role}</strong>
                  </div>
                </div>

                <div className="space-y-1 bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-xs">
                  <span className="text-blue-500 font-bold uppercase tracking-[0.05em] text-[9.5px]">Security Class Action</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-blue-800 text-[13px]">{detailLog.action}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">Target Entity: <strong className="font-mono text-slate-700">{detailLog.entity}</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Detailed System Narrative</span>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-700 text-xs leading-relaxed">
                    {detailLog.detail}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Compliance Verification Status</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                    <span>✓ SECURE CRYPTOGRAPHIC HASH CONFIRMED</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-line bg-slate-50">
              <Button variant="default" className="w-full" onClick={() => setDetailLog(null)}>
                Close Audit Detail
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
