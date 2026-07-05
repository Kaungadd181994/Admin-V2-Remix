import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, StatusBadge, Badge, TableToolbar, TablePagination, Drawer } from '../components/UI';
import { fmt, mmk } from '../types';

export default function Transactions() {
  const { data, updateData, pushAudit, addToast } = useData();
  const [tab, setTab] = useState<'disbursement' | 'repayment' | 'budget'>('disbursement');
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const toggleRow = (id: string) => setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) => setSelectedRows(prev => prev.length === ids.length ? [] : ids);

  const [activeDisbId, setActiveDisbId] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Manual payment recording form values
  const [manualPayAmount, setManualPayAmount] = useState('');
  const [manualPayRef, setManualPayRef] = useState('');

  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');

  const filteredDisbursements = data.disbursements.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      d.id.toLowerCase().includes(q) || 
      d.emp.toLowerCase().includes(q) || 
      d.channel.toLowerCase().includes(q) || 
      d.ref.toLowerCase().includes(q) || 
      d.status.toLowerCase().includes(q);
      
    const matchMin = !minAmount || d.requested >= Number(minAmount);
    const matchMax = !maxAmount || d.requested <= Number(maxAmount);
    const matchStatus = !filterStatus || d.status === filterStatus;
    const matchDate = !startDate || d.ts.includes(startDate);

    return matchSearch && matchMin && matchMax && matchStatus && matchDate;
  });

  const filteredBatches = data.batches.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      b.id.toLowerCase().includes(q) || 
      b.corp.toLowerCase().includes(q) || 
      b.cycle.toLowerCase().includes(q) || 
      b.status.toLowerCase().includes(q);

    const matchMin = !minAmount || b.expected >= Number(minAmount);
    const matchMax = !maxAmount || b.expected <= Number(maxAmount);
    const matchStatus = !filterStatus || b.status === filterStatus;

    return matchSearch && matchMin && matchMax && matchStatus;
  });

  const filteredBudgetRequests = data.budgetRequests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      r.id.toLowerCase().includes(q) || 
      r.corp.toLowerCase().includes(q) || 
      r.reason.toLowerCase().includes(q) || 
      r.status.toLowerCase().includes(q);

    const matchMin = !minAmount || r.requested >= Number(minAmount);
    const matchMax = !maxAmount || r.requested <= Number(maxAmount);
    const matchStatus = !filterStatus || r.status === filterStatus;

    return matchSearch && matchMin && matchMax && matchStatus;
  });

  const handleBulkDisbursementAction = (status: string) => {
    if (selectedRows.length === 0) return;
    const updated = data.disbursements.map(d => {
      if (selectedRows.includes(d.id)) {
        return { ...d, status };
      }
      return d;
    });
    updateData({ disbursements: updated });
    selectedRows.forEach(id => pushAudit('DISBURSEMENT_BULK_UPDATE', id, `Status set to ${status}`));
    addToast('Disbursements updated', `Set status of ${selectedRows.length} requests to ${status}.`, 'ok');
    setSelectedRows([]);
  };

  const handleBulkBatchAction = (status: string) => {
    if (selectedRows.length === 0) return;
    const updated = data.batches.map(b => {
      if (selectedRows.includes(b.id)) {
        return { ...b, status };
      }
      return b;
    });
    updateData({ batches: updated });
    selectedRows.forEach(id => pushAudit('BATCH_BULK_UPDATE', id, `Status set to ${status}`));
    addToast('Repayment Batches updated', `Set status of ${selectedRows.length} batches to ${status}.`, 'ok');
    setSelectedRows([]);
  };

  const handleBulkBudgetAction = (approve: boolean) => {
    if (selectedRows.length === 0) return;
    const newStatus = approve ? 'APPROVED' : 'REJECTED';
    const updated = data.budgetRequests.map(r => {
      if (selectedRows.includes(r.id)) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    updateData({ budgetRequests: updated });
    selectedRows.forEach(id => pushAudit('BUDGET_BULK_UPDATE', id, `Status set to ${newStatus}`));
    addToast('Budget requests processed', `Batch ${newStatus.toLowerCase()}d ${selectedRows.length} requests.`, approve ? 'ok' : 'warn');
    setSelectedRows([]);
  };

  const handleBulkExport = () => {
    if (selectedRows.length === 0) return;
    let csvHeader = "";
    let csvRows = [];
    if (tab === 'disbursement') {
      csvHeader = "ID,Employee,Timestamp,Accrued,Requested,Fee,Debit,Net,Channel,Ref,Status";
      const selected = data.disbursements.filter(d => selectedRows.includes(d.id));
      csvRows = selected.map(d => `${d.id},"${d.emp}",${d.ts},${d.accrued},${d.requested},${d.fee},${d.debit},${d.net},${d.channel},${d.ref},${d.status}`);
    } else if (tab === 'repayment') {
      csvHeader = "ID,Corporate,Cycle,Expected,LateFees,Invoice,Received,Coverage,Suspense,Status";
      const selected = data.batches.filter(b => selectedRows.includes(b.id));
      csvRows = selected.map(b => `${b.id},"${b.corp}",${b.cycle},${b.expected},${b.lateFees},${b.invoice},${b.received},${b.coverage},${b.suspense},${b.status}`);
    } else {
      csvHeader = "ID,Corporate,Current,Requested,Reason,Risk,Status,Submitted";
      const selected = data.budgetRequests.filter(r => selectedRows.includes(r.id));
      csvRows = selected.map(r => `${r.id},"${r.corp}",${r.current},${r.requested},"${r.reason.replace(/"/g, '""')}",${r.risk},${r.status},${r.submitted}`);
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\n" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ewa_transactions_${tab}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Export complete', `Downloaded CSV report of ${selectedRows.length} items.`, 'ok');
    setSelectedRows([]);
  };

  const handleBudgetAction = (id: string, action: string) => {
    const r = data.budgetRequests.find(x => x.id === id);
    if (!r) return;
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const newList = data.budgetRequests.map(x => x.id === id ? { ...x, status: newStatus } : x);
    updateData({ budgetRequests: newList });
    pushAudit(`BUDGET_REQUEST_${newStatus}`, r.id, r.corp);
    addToast(`Budget request ${newStatus.toLowerCase()}`, r.corp);
  };

  return (
    <div className="space-y-4">
      <div className="view-head">
        <h1 className="font-heading font-bold text-[19px] m-0">Transactions</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 pb-2">
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'disbursement' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('disbursement'); setSelectedRows([]); }}>Disbursement</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'repayment' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('repayment'); setSelectedRows([]); }}>Repayment Batches</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'budget' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('budget'); setSelectedRows([]); }}>Budget Requests</button>
      </div>

      <TableToolbar 
        search={search} 
        setSearch={setSearch} 
        placeholder={
          tab === 'disbursement' 
            ? "Search by ID, Employee name, Channel, Ref, Status..." 
            : tab === 'repayment' 
              ? "Search by Batch ID, Corporate, Cycle, Status..." 
              : "Search by ID, Corporate, Reason, Status..."
        }
        searchFields={
          tab === 'disbursement'
            ? ['ID', 'Employee', 'Channel', 'Ref', 'Status']
            : tab === 'repayment'
              ? ['Batch ID', 'Corporate', 'Cycle', 'Status']
              : ['Request ID', 'Corporate', 'Reason', 'Status']
        }
        count={tab === 'disbursement' ? filteredDisbursements.length : tab === 'repayment' ? filteredBatches.length : filteredBudgetRequests.length}
        onExport={handleBulkExport}
        onAdvancedFilter={() => setAdvancedFilterOpen(true)}
        filters={
          <>
            {tab === 'disbursement' && (
              <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="PENDING_SETTLE">PENDING_SETTLE</option>
                <option value="SETTLED">SETTLED</option>
                <option value="FAILED">FAILED</option>
              </select>
            )}
            {tab === 'repayment' && (
              <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="LATE">LATE</option>
                <option value="PARTIAL_PAID">PARTIAL_PAID</option>
              </select>
            )}
            {tab === 'budget' && (
              <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="PENDING_RISK">PENDING_RISK</option>
              </select>
            )}
          </>
        }
      />

      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selectedRows.length}</span>
            <span className="text-[12.5px] font-semibold text-blue-800">
              Selected {tab === 'disbursement' ? 'Disbursements' : tab === 'repayment' ? 'Repayments' : 'Budget Requests'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tab === 'disbursement' && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs">
                <span className="text-slate-500 font-medium px-1">Set Status:</span>
                <select 
                  className="bg-transparent border-none text-[11px] font-bold outline-none cursor-pointer text-slate-700"
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      handleBulkDisbursementAction(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>Select...</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="SETTLED">SETTLED</option>
                  <option value="PENDING_SETTLE">PENDING_SETTLE</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            )}

            {tab === 'repayment' && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs">
                <span className="text-slate-500 font-medium px-1">Set Status:</span>
                <select 
                  className="bg-transparent border-none text-[11px] font-bold outline-none cursor-pointer text-slate-700"
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) {
                      handleBulkBatchAction(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>Select...</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="LATE">LATE</option>
                  <option value="PARTIAL_PAID">PARTIAL_PAID</option>
                </select>
              </div>
            )}

            {tab === 'budget' && (
              <>
                <Button size="sm" variant="success" onClick={() => handleBulkBudgetAction(true)}>
                  ✓ Bulk Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleBulkBudgetAction(false)}>
                  ✕ Bulk Reject
                </Button>
              </>
            )}

            <Button size="sm" variant="default" onClick={handleBulkExport}>
              📥 Export Selected ({selectedRows.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedRows([])} className="!text-slate-500 hover:!bg-slate-200">
              Deselect All
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
        {tab === 'disbursement' && (
          <>
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedRows.length === filteredDisbursements.length && filteredDisbursements.length > 0} onChange={() => toggleAll(filteredDisbursements.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Request ID</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3 text-right">Accrued</th><th className="px-4 py-3 text-right">Requested</th><th className="px-4 py-3 text-right">Fee</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Net</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Error/Audit Logs</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredDisbursements.map(d => (
                  <tr key={d.id} className={selectedRows.includes(d.id) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4"><input type="checkbox" checked={selectedRows.includes(d.id)} onChange={() => toggleRow(d.id)} /></td>
                    <td className="font-mono text-[12px] text-text-dim">{d.id}</td><td>{d.emp}</td><td className="font-mono text-[12px] text-text-dim">{d.ts}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(d.accrued)}</td><td className="text-right font-mono text-[12px] text-text-dim">{fmt(d.requested)}</td><td className="text-right font-mono text-[12px] text-text-dim">{fmt(d.fee)}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(d.debit)}</td><td className="text-right font-mono text-[12px] text-text-dim">{fmt(d.net)}</td>
                    <td>{d.channel}</td><td className="font-mono text-[12px] text-text-dim">{d.ref}</td>
                    <td>
                      {d.error !== 'None' ? (
                        <span className="text-[10.5px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded">
                          {d.error}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic">No errors</span>
                      )}
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="text-right pr-4"><Button size="sm" onClick={() => setActiveDisbId(d.id)}>Details</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination total={filteredDisbursements.length} maxPerPage={100} />
          </>
        )}
        
        {tab === 'repayment' && (
          <>
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedRows.length === filteredBatches.length && filteredBatches.length > 0} onChange={() => toggleAll(filteredBatches.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Batch ID</th><th className="px-4 py-3">Corporate</th><th className="px-4 py-3">Cycle</th><th className="px-4 py-3 text-right">Expected</th><th className="px-4 py-3 text-right">Late Fees</th><th className="px-4 py-3 text-right">Invoice</th><th className="px-4 py-3 text-right">Received</th><th className="px-4 py-3">Coverage</th><th className="px-4 py-3 text-right">Suspense</th><th className="px-4 py-3">GL Clearing Acc</th><th className="px-4 py-3">Delay / Overdue</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredBatches.map(b => (
                  <tr key={b.id} className={selectedRows.includes(b.id) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4"><input type="checkbox" checked={selectedRows.includes(b.id)} onChange={() => toggleRow(b.id)} /></td>
                    <td className="font-mono text-[12px] text-text-dim">{b.id}</td><td>{b.corp}</td><td className="font-mono text-[12px] text-text-dim">{b.cycle}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(b.expected)}</td><td className="text-right font-mono text-[12px] text-text-dim">{fmt(b.lateFees)}</td><td className="text-right font-mono text-[12px] text-text-dim">{fmt(b.invoice)}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(b.received)}</td><td className="font-mono text-[12px] text-text-dim"><strong>{b.coverage.toFixed(2)}%</strong></td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(b.suspense)}</td>
                    <td className="font-mono text-[12px] text-slate-500">{b.gl}</td>
                    <td>
                      {b.status === 'OVERDUE' ? (
                        <Badge color="red">5 Days Overdue</Badge>
                      ) : b.status === 'LATE' ? (
                        <Badge color="amber">3 Days Late</Badge>
                      ) : b.status === 'PARTIAL' ? (
                        <Badge color="amber">1 Day Overdue</Badge>
                      ) : (
                        <span className="text-[11.5px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">On Time</span>
                      )}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="text-right pr-4"><Button size="sm" onClick={() => setActiveBatchId(b.id)}>Review</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination total={filteredBatches.length} maxPerPage={100} />
          </>
        )}
        
        {tab === 'budget' && (
          <>
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedRows.length === filteredBudgetRequests.length && filteredBudgetRequests.length > 0} onChange={() => toggleAll(filteredBudgetRequests.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Request</th><th className="px-4 py-3">Corporate</th><th className="px-4 py-3 text-right">Current</th><th className="px-4 py-3 text-right">Requested</th><th className="px-4 py-3 text-right text-blue-700">Requested Increase</th><th className="px-4 py-3 text-right">Multiplier Factor</th><th className="px-4 py-3">Justification</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredBudgetRequests.map(r => (
                  <tr key={r.id} className={selectedRows.includes(r.id) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4"><input type="checkbox" checked={selectedRows.includes(r.id)} onChange={() => toggleRow(r.id)} /></td>
                    <td className="font-mono text-[12px] text-text-dim">{r.id}</td><td>{r.corp}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(r.current)}</td><td className="text-right font-mono text-[12px] text-text-dim">{fmt(r.requested)}</td>
                    <td className="text-right font-mono text-[12px] font-bold text-blue-600 bg-blue-50/40 px-2">+{fmt(r.requested - r.current)} MMK</td>
                    <td className="text-right font-mono text-[12px] text-slate-500">{(r.requested / r.current).toFixed(2)}x</td>
                    <td className="text-[11px] text-text-mute">{r.reason}</td><td className="font-mono text-[12px] text-text-dim">{r.risk}</td><td><StatusBadge status={r.status} /></td><td className="font-mono text-[12px] text-text-dim">{r.submitted}</td>
                    <td className="flex gap-1.5 justify-end pr-4">
                      {r.status === 'PENDING_RISK' ? (
                        <>
                          <Button size="sm" variant="success" onClick={() => handleBudgetAction(r.id, 'approve')}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => handleBudgetAction(r.id, 'reject')}>Reject</Button>
                        </>
                      ) : <Button size="sm" onClick={() => addToast('View Budget Request', `ID: ${r.id}`, 'ok')}>View</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination total={filteredBudgetRequests.length} maxPerPage={100} />
          </>
        )}
      </div>

      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine transaction registers</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Min Amount</label>
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
                placeholder="0" 
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Max Amount</label>
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
                placeholder="Any" 
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Filter by Status</label>
            <select 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {tab === 'disbursement' && (
                <>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="SETTLED">SETTLED</option>
                  <option value="PENDING_SETTLE">PENDING_SETTLE</option>
                  <option value="FAILED">FAILED</option>
                </>
              )}
              {tab === 'repayment' && (
                <>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="LATE">LATE</option>
                  <option value="PARTIAL_PAID">PARTIAL_PAID</option>
                </>
              )}
              {tab === 'budget' && (
                <>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="PENDING_RISK">PENDING_RISK</option>
                </>
              )}
            </select>
          </div>

          {tab === 'disbursement' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Filter by Month/Date</label>
              <input 
                type="text" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono"
                placeholder="e.g. 2026-07"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)} className="flex-1">Apply Filters</Button>
            <Button variant="ghost" onClick={() => {
              setMinAmount('');
              setMaxAmount('');
              setFilterStatus('');
              setStartDate('');
              setAdvancedFilterOpen(false);
            }}>Reset All</Button>
          </div>
        </div>
      </Drawer>

      {/* Disbursement Details Drawer */}
      <Drawer isOpen={!!activeDisbId} onClose={() => setActiveDisbId(null)} mode="right">
        {(() => {
          const d = data.disbursements.find(x => x.id === activeDisbId);
          if (!d) return null;
          
          const handleUpdateDisbStatus = (newStatus: string, manualRef?: string) => {
            const updated = data.disbursements.map(x => {
              if (x.id === d.id) {
                return { ...x, status: newStatus, ref: manualRef || x.ref };
              }
              return x;
            });
            updateData({ disbursements: updated });
            pushAudit('DISBURSEMENT_STATUS_UPDATE', d.id, `Status updated to ${newStatus}${manualRef ? ' with ref ' + manualRef : ''}`);
            addToast('Disbursement Updated', `Request ${d.id} status changed to ${newStatus}.`, 'ok');
            setActiveDisbId(null);
          };

          return (
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between p-4.5 px-5 border-b border-slate-200 sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Disbursement Details</h2>
                    <div className="text-[11.5px] text-slate-500">{d.id} · Employee Request</div>
                  </div>
                  <button type="button" className="w-[30px] h-[30px] border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer shrink-0" onClick={() => setActiveDisbId(null)}>✕</button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 font-sans text-xs">
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Employee</span>
                      <strong className="text-slate-700 font-mono text-[12px]">{d.emp}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Timestamp</span>
                      <strong className="text-slate-700 font-mono text-[12px]">{d.ts}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Payout Channel</span>
                      <strong className="text-slate-700 text-[12px]">{d.channel}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Channel Reference</span>
                      <strong className="text-slate-700 font-mono text-[12px]">{d.ref}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Accounting Amounts</span>
                    <div className="space-y-1.5 text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-[12px] font-sans">
                      <div className="flex justify-between"><span>Accrued Salary:</span><span className="font-mono font-medium">{fmt(d.accrued)} MMK</span></div>
                      <div className="flex justify-between"><span>Requested Advance:</span><span className="font-mono font-medium">{fmt(d.requested)} MMK</span></div>
                      <div className="flex justify-between"><span>EWA Transaction Fee:</span><span className="font-mono font-medium">{fmt(d.fee)} MMK</span></div>
                      <hr className="border-slate-200" />
                      <div className="flex justify-between font-semibold text-slate-900"><span>Net Disbursed to Wallet:</span><span className="font-mono">{fmt(d.net)} MMK</span></div>
                      <div className="flex justify-between text-slate-500 text-[11px]"><span>Debit Balance Impact:</span><span className="font-mono">{fmt(d.debit)} MMK</span></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Processing Status &amp; Logs</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      {d.error !== 'None' && <span className="text-xs font-semibold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{d.error}</span>}
                    </div>
                  </div>

                  {/* Manual administrative intervention */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <h4 className="m-0 text-blue-900 font-bold text-[12.5px] flex items-center gap-1">🛡 Platform Admin Intervention</h4>
                    <p className="m-0 text-slate-600 text-[11.5px] leading-normal">Manually update status, overwrite transfer reference codes, or handle routing errors for this EWA request.</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {d.status !== 'SUCCESS' && d.status !== 'SETTLED' && (
                        <Button size="sm" variant="success" onClick={() => {
                          const refCode = 'M-TXN-' + Math.floor(10000 + Math.random() * 90000);
                          handleUpdateDisbStatus('SUCCESS', refCode);
                        }}>
                          Mark SUCCESS (Generate Ref)
                        </Button>
                      )}
                      {d.status === 'PROCESSING' && (
                        <Button size="sm" variant="danger" onClick={() => handleUpdateDisbStatus('FAILED')}>
                          Force Fail
                        </Button>
                      )}
                      {(d.status === 'FAILED' || d.status === 'SUCCESS') && d.status !== 'SETTLED' && (
                        <Button size="sm" variant="primary" onClick={() => handleUpdateDisbStatus('SETTLED')}>
                          Mark Settled &amp; Reconciled
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-2">
                <Button variant="default" className="w-full" onClick={() => setActiveDisbId(null)}>
                  Dismiss Details
                </Button>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* Repayment Batch Details Drawer */}
      <Drawer isOpen={!!activeBatchId} onClose={() => setActiveBatchId(null)} mode="right">
        {(() => {
          const b = data.batches.find(x => x.id === activeBatchId);
          if (!b) return null;

          const handleRecordPayment = (e: React.FormEvent) => {
            e.preventDefault();
            const payAmt = Number(manualPayAmount);
            if (isNaN(payAmt) || payAmt <= 0) {
              addToast('Validation Error', 'Payment amount must be a positive number.', 'error');
              return;
            }

            const updatedBatches = data.batches.map(x => {
              if (x.id === b.id) {
                const newRecv = x.received + payAmt;
                const newCov = Math.min(100, (newRecv / x.invoice) * 100);
                const newStatus = newCov >= 100 ? 'MATCHED' : 'PARTIAL';
                return {
                  ...x,
                  received: newRecv,
                  coverage: newCov,
                  status: newStatus,
                  ref: manualPayRef || x.ref,
                  ts: new Date().toISOString().slice(0, 16).replace('T', ' ')
                };
              }
              return x;
            });

            updateData({ batches: updatedBatches });
            pushAudit('REPAYMENT_MANUAL_RECORD', b.id, `Recorded cash payment of ${mmk(payAmt)}. Ref: ${manualPayRef}`);
            addToast('Payment Recorded', `Successfully added ${mmk(payAmt)} payment to batch ${b.id}.`, 'ok');
            setManualPayAmount('');
            setManualPayRef('');
            setActiveBatchId(null);
          };

          const handleUpdateBatchStatus = (newStatus: string) => {
            const updatedBatches = data.batches.map(x => {
              if (x.id === b.id) {
                return { ...x, status: newStatus };
              }
              return x;
            });
            updateData({ batches: updatedBatches });
            pushAudit('REPAYMENT_BATCH_UPDATE', b.id, `Status set to ${newStatus}`);
            addToast('Batch Status Updated', `Set batch ${b.id} status to ${newStatus}.`, 'ok');
            setActiveBatchId(null);
          };

          return (
            <div className="h-full flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-start justify-between p-4.5 px-5 border-b border-slate-200 sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Repayment Batch</h2>
                    <div className="text-[11.5px] text-slate-500">{b.id} · {b.corp}</div>
                  </div>
                  <button type="button" className="w-[30px] h-[30px] border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer shrink-0" onClick={() => setActiveBatchId(null)}>✕</button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 font-sans text-xs">
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Payroll Cycle</span>
                      <strong className="text-slate-700 font-mono text-[12px]">{b.cycle}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Timestamp</span>
                      <strong className="text-slate-700 font-mono text-[12px]">{b.ts}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Circle Account / GL Code</span>
                      <strong className="text-slate-700 font-mono text-[12px]">{b.gl}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Deposit Reference Doc</span>
                      <strong className="text-blue-600 hover:underline cursor-pointer font-mono text-[12px]" onClick={() => addToast('Opening document', b.ref, 'ok')}>{b.ref}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Invoicing &amp; Coverage Summary</span>
                    <div className="space-y-1.5 text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-[12px] font-sans">
                      <div className="flex justify-between"><span>Expected Advances:</span><span className="font-mono font-medium">{fmt(b.expected)} MMK</span></div>
                      <div className="flex justify-between"><span>Late Fees / Interest:</span><span className="font-mono font-medium">{fmt(b.lateFees)} MMK</span></div>
                      <hr className="border-slate-200" />
                      <div className="flex justify-between font-bold text-slate-900"><span>Total Due (Invoice):</span><span className="font-mono">{fmt(b.invoice)} MMK</span></div>
                      <div className="flex justify-between text-emerald-600 font-semibold"><span>Total Cash Received:</span><span className="font-mono">{fmt(b.received)} MMK</span></div>
                      <div className="flex justify-between font-medium"><span>Repayment Coverage Ratio:</span><span className="font-mono font-bold text-blue-700">{b.coverage.toFixed(2)}%</span></div>
                      {b.suspense > 0 && (
                        <div className="flex justify-between text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 mt-1 font-mono text-[11px]">
                          <span>Suspense (Unmatched Over-allocation):</span>
                          <span>{fmt(b.suspense)} MMK</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Repayment Match Status</span>
                    <div><StatusBadge status={b.status} /></div>
                  </div>

                  {/* Manual payment recording form */}
                  {b.status !== 'MATCHED' && (
                    <form onSubmit={handleRecordPayment} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3.5">
                      <div className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">✍ Record Inbound Bank Transfer</div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-semibold uppercase">Amount Received</label>
                          <input 
                            required
                            type="number" 
                            className="h-8.5 bg-slate-50 border border-slate-200 rounded text-xs px-2 font-mono outline-none focus:border-blue-500" 
                            placeholder="e.g. 500000"
                            value={manualPayAmount}
                            onChange={e => setManualPayAmount(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-semibold uppercase">Document Reference</label>
                          <input 
                            type="text" 
                            className="h-8.5 bg-slate-50 border border-slate-200 rounded text-xs px-2 font-mono outline-none focus:border-blue-500" 
                            placeholder="e.g. M-REF-2029"
                            value={manualPayRef}
                            onChange={e => setManualPayRef(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button type="submit" size="sm" variant="primary" className="w-full">
                        ✓ Apply Payment &amp; Recalculate Coverage
                      </Button>
                    </form>
                  )}

                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Adjust Batch Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" onClick={() => handleUpdateBatchStatus('MATCHED')}>Set MATCHED</Button>
                      <Button size="sm" onClick={() => handleUpdateBatchStatus('PARTIAL')}>Set PARTIAL</Button>
                      <Button size="sm" onClick={() => handleUpdateBatchStatus('SUSPENSE')}>Set SUSPENSE</Button>
                      <Button size="sm" onClick={() => handleUpdateBatchStatus('MISSING')}>Set MISSING</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-2">
                <Button variant="default" className="w-full" onClick={() => setActiveBatchId(null)}>
                  Dismiss Details
                </Button>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
