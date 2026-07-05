import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Button, StatusBadge, Badge, Toggle, TableToolbar, TablePagination, Drawer } from '../components/UI';
import { fmt } from '../types';

export default function Employees({ params }: { params?: { employeeId?: string } }) {
  const { data, updateData, pushAudit, addToast, openTab } = useData();
  const [tab, setTab] = useState<'directory' | 'verify'>('directory');
  const [search, setSearch] = useState('');
  const [filterCo, setFilterCo] = useState('');
  
  const [drawerEmpId, setDrawerEmpId] = useState<string | null>(null);
  const [newEmpComment, setNewEmpComment] = useState('');
  
  useEffect(() => {
    if (params?.employeeId) {
      setDrawerEmpId(params.employeeId);
    }
  }, [params]);
  
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const toggleEmp = (id: string) => setSelectedEmps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllEmps = (ids: string[]) => setSelectedEmps(prev => prev.length === ids.length ? [] : ids);
  
  const [selectedVerify, setSelectedVerify] = useState<string[]>([]);
  const toggleVerify = (id: string) => setSelectedVerify(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllVerify = (ids: string[]) => setSelectedVerify(prev => prev.length === ids.length ? [] : ids);

  const [filterKyc, setFilterKyc] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [filterWhitelist, setFilterWhitelist] = useState('');

  const handleBulkWhitelist = (whitelistStatus: boolean) => {
    if (selectedEmps.length === 0) return;
    const updated = data.employees.map(e => {
      if (selectedEmps.includes(e.id)) {
        return { ...e, whitelist: whitelistStatus };
      }
      return e;
    });
    updateData({ employees: updated });
    selectedEmps.forEach(id => pushAudit('EMPLOYEE_BULK_WHITELIST', id, `Whitelist set to ${whitelistStatus}`));
    addToast('Bulk action complete', `Updated whitelist status of ${selectedEmps.length} employees to ${whitelistStatus ? 'ENABLED' : 'DISABLED'}.`, 'ok');
    setSelectedEmps([]);
  };

  const handleBulkKyc = (kyc: string) => {
    if (selectedEmps.length === 0 || !kyc) return;
    const updated = data.employees.map(e => {
      if (selectedEmps.includes(e.id)) {
        return { ...e, kyc };
      }
      return e;
    });
    updateData({ employees: updated });
    selectedEmps.forEach(id => pushAudit('EMPLOYEE_BULK_KYC', id, `KYC status set to ${kyc}`));
    addToast('Bulk KYC complete', `Updated ${selectedEmps.length} employees to KYC Level ${kyc}.`, 'ok');
    setSelectedEmps([]);
  };

  const handleBulkStatus = (status: string) => {
    if (selectedEmps.length === 0 || !status) return;
    const updated = data.employees.map(e => {
      if (selectedEmps.includes(e.id)) {
        return { ...e, status };
      }
      return e;
    });
    updateData({ employees: updated });
    selectedEmps.forEach(id => pushAudit('EMPLOYEE_BULK_STATUS', id, `Status set to ${status}`));
    addToast('Bulk status complete', `Updated status of ${selectedEmps.length} employees to ${status}.`, 'ok');
    setSelectedEmps([]);
  };

  const handleBulkExport = () => {
    if (selectedEmps.length === 0) return;
    const selectedData = data.employees.filter(e => selectedEmps.includes(e.id));
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Name,Company,Department,Salary,KYC,Whitelist,Outstanding,Cap,Status"].join(",") + "\n"
      + selectedData.map(e => `${e.id},"${e.name}",${e.company},${e.dept},${e.salary},${e.kyc},${e.whitelist},${e.outstanding},${e.cap},${e.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ewa_selected_employees_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Export Successful', `Exported data of ${selectedEmps.length} selected employees.`, 'ok');
    setSelectedEmps([]);
  };

  const handleBulkVerifyQueue = (action: 'approve' | 'reject') => {
    if (selectedVerify.length === 0) return;
    const itemsToProcess = data.verifyQueue.filter(v => selectedVerify.includes(v.id));
    
    // Move approved employees to employee directory
    let currentEmployees = [...data.employees];
    if (action === 'approve') {
      itemsToProcess.forEach(item => {
        const isExist = currentEmployees.some(x => x.name === item.name && x.company === item.company);
        if (!isExist) {
          const newEmpId = 'EMP-0' + (currentEmployees.length + 10).toString().padStart(3, '0');
          currentEmployees.push({
            id: newEmpId,
            name: item.name,
            company: item.company,
            dept: 'Staff',
            salary: 800000,
            kyc: 'VERIFIED',
            whitelist: true,
            outstanding: 0,
            cap: 400000,
            status: 'ACTIVE',
            reason: 'Batch verified via queue',
            bank: 'Pending Setup',
            lastSync: 'Just now'
          });
          pushAudit('VERIFICATION_APPROVED', item.id, `Approved and onboarded ${item.name}`);
        }
      });
    } else {
      itemsToProcess.forEach(item => {
        pushAudit('VERIFICATION_REJECTED', item.id, `Rejected roster verification for ${item.name}`);
      });
    }

    const remainingQueue = data.verifyQueue.filter(v => !selectedVerify.includes(v.id));
    updateData({ 
      employees: currentEmployees,
      verifyQueue: remainingQueue
    });

    addToast(`Bulk verification complete`, `Batch ${action}d ${selectedVerify.length} pending items.`, action === 'reject' ? 'warn' : 'ok');
    setSelectedVerify([]);
  };

  const toggleWhitelist = (id: string) => {
    const e = data.employees.find(x => x.id === id);
    if (!e) return;
    if (['PENDING_SETTLE', 'BLACKLISTED', 'FROZEN', 'KYC_RETURNED'].includes(e.status)) {
      addToast('Cannot whitelist', `${e.name} must resolve status "${e.status}" first.`, 'warn');
      return;
    }
    const newList = data.employees.map(x => x.id === id ? { ...x, whitelist: !x.whitelist } : x);
    updateData({ employees: newList });
    pushAudit('WHITELIST_TOGGLE', id, `Set to ${!e.whitelist ? 'ON' : 'OFF'}`);
    addToast('Whitelist updated', `${e.name} EWA access is now ${!e.whitelist ? 'ENABLED' : 'DISABLED'}. Budget recalculated.`);
  };

  const handleVerifyAction = (id: string, action: string) => {
    const item = data.verifyQueue.find(v => v.id === id);
    if (!item) return;
    pushAudit(`VERIFICATION_${action.toUpperCase()}`, id, item.name);
    updateData({ verifyQueue: data.verifyQueue.filter(v => v.id !== id) });
    addToast('Queue updated', `${item.name} request ${action}d.`, action === 'reject' ? 'warn' : 'ok');
  };

  const filteredEmps = data.employees.filter(e => {
    const query = search.toLowerCase();
    const matchSearch = !query || 
      e.name.toLowerCase().includes(query) || 
      e.id.toLowerCase().includes(query) || 
      e.dept.toLowerCase().includes(query) || 
      (e.bank && e.bank.toLowerCase().includes(query)) ||
      e.status.toLowerCase().includes(query);

    const matchCo = !filterCo || e.company === filterCo;
    const matchKyc = !filterKyc || e.kyc === filterKyc;
    const matchStatus = !filterStatus || e.status === filterStatus;
    const matchSalaryMin = !minSalary || e.salary >= Number(minSalary);
    const matchSalaryMax = !maxSalary || e.salary <= Number(maxSalary);
    const matchWhitelist = !filterWhitelist || (filterWhitelist === 'yes' ? e.whitelist : !e.whitelist);

    return matchSearch && matchCo && matchKyc && matchStatus && matchSalaryMin && matchSalaryMax && matchWhitelist;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0">Employees</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button>⤓ Download Template</Button>
          <Button variant="primary">⬆ Upload Roster</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 pb-2">
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'directory' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('directory')}>Employee Directory ({data.employees.length})</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'verify' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('verify')}>Verification Queue ({data.verifyQueue.length})</button>
      </div>

      {tab === 'directory' ? (
        <>
          <TableToolbar 
            search={search} 
            setSearch={setSearch} 
            placeholder="Search by ID, Name, Department, Bank Account, Status..."
            searchFields={['ID', 'Name', 'Department', 'Bank Account', 'Status']}
            count={filteredEmps.length}
            onExport={() => addToast('Exporting Data', 'Downloading CSV...', 'ok')}
            onAdvancedFilter={() => setAdvancedFilterOpen(true)}
            filters={
              <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterCo} onChange={e=>setFilterCo(e.target.value)}>
                <option value="">All companies</option>
                {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            }
          />

          {selectedEmps.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selectedEmps.length}</span>
                <span className="text-[12.5px] font-semibold text-blue-800">Employees selected for bulk operations</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                  <span className="text-slate-500 font-medium">Whitelist:</span>
                  <button type="button" onClick={() => handleBulkWhitelist(true)} className="text-emerald-600 font-bold hover:underline px-1">Enable</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => handleBulkWhitelist(false)} className="text-rose-600 font-bold hover:underline px-1">Disable</button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                  <span className="text-slate-500 font-medium">Set KYC:</span>
                  <select 
                    className="bg-transparent border-none text-[11px] font-bold outline-none cursor-pointer text-slate-700"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleBulkKyc(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Select...</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <select 
                    className="bg-transparent border-none text-[11px] font-bold outline-none cursor-pointer text-slate-700"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleBulkStatus(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Select...</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="FROZEN">FROZEN</option>
                    <option value="BLACKLISTED">BLACKLISTED</option>
                    <option value="KYC_RETURNED">KYC_RETURNED</option>
                  </select>
                </div>

                <Button size="sm" variant="default" onClick={handleBulkExport}>
                  📥 Export Selected ({selectedEmps.length})
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedEmps([])} className="!text-slate-500 hover:!bg-slate-200">
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedEmps.length === filteredEmps.length && filteredEmps.length > 0} onChange={() => toggleAllEmps(filteredEmps.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Dept</th><th className="px-4 py-3 text-right">Salary</th><th className="px-4 py-3">KYC (L1)</th><th className="px-4 py-3">Whitelist (L2)</th><th className="px-4 py-3 text-right">Outstanding</th><th className="px-4 py-3 text-right">Cap</th><th className="px-4 py-3 text-right text-emerald-700">Available Bal</th><th className="px-4 py-3">Bank Account</th><th className="px-4 py-3">Last Sync</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredEmps.map(e => {
                  const company = data.companies.find(c => c.id === e.company);
                  const availableBal = e.cap - e.outstanding;
                  return (
                    <tr key={e.id} className={selectedEmps.includes(e.id) ? 'bg-blue-50/50' : ''}>
                      <td className="px-4"><input type="checkbox" checked={selectedEmps.includes(e.id)} onChange={() => toggleEmp(e.id)} /></td>
                      <td><span className="font-semibold text-text-main">{e.id}</span> {e.name}</td>
                      <td>{company ? company.name : e.company}</td>
                      <td>{e.dept}</td>
                      <td className="text-right font-mono text-[12px] text-text-dim">{fmt(e.salary)}</td>
                      <td><StatusBadge status={e.kyc} /></td>
                      <td><Toggle isOn={e.whitelist} onToggle={() => toggleWhitelist(e.id)} /></td>
                      <td className="text-right font-mono text-[12px] text-text-dim">{fmt(e.outstanding)}</td>
                      <td className="text-right font-mono text-[12px] text-text-dim">{fmt(e.cap)}</td>
                      <td className="text-right font-mono text-[12px] font-semibold text-emerald-600 bg-emerald-50/30 px-2">{fmt(availableBal)}</td>
                      <td className="font-medium text-slate-600">{e.bank}</td>
                      <td className="text-slate-400 text-xs font-mono">{e.lastSync}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td className="text-[11px] text-text-mute">{e.reason}</td>
                      <td className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" onClick={() => setDrawerEmpId(e.id)}>Manage</Button>
                          <Button size="sm" variant="ghost" title="Open in Parallel Tab" onClick={() => openTab('employees', 'employee-' + e.id, '👤 ' + e.name, { employeeId: e.id })}>
                            ↗
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination total={filteredEmps.length} maxPerPage={100} />
          </div>
        </>
      ) : (
        <>
          <div className="text-xs text-slate-500 mb-3 font-medium">These employees requested employer linking via the app but were <strong>not found</strong> (Scenario C) or matched but <strong>not yet trusted</strong> (Scenario B). HR or Admin must action each request.</div>
          
          {selectedVerify.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selectedVerify.length}</span>
                <span className="text-[12.5px] font-semibold text-blue-800">Verification items selected for bulk actions</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="success" onClick={() => handleBulkVerifyQueue('approve')}>
                  ✓ Bulk Approve &amp; Onboard Selected
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleBulkVerifyQueue('reject')}>
                  ✕ Bulk Reject Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedVerify([])} className="!text-slate-500 hover:!bg-slate-200">
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedVerify.length === data.verifyQueue.length && data.verifyQueue.length > 0} onChange={() => toggleAllVerify(data.verifyQueue.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Request</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Scenario</th><th className="px-4 py-3">Confidence</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {data.verifyQueue.map(v => {
                  const company = data.companies.find(c => c.id === v.company);
                  return (
                    <tr key={v.id} className={selectedVerify.includes(v.id) ? 'bg-blue-50/50' : ''}>
                      <td className="px-4"><input type="checkbox" checked={selectedVerify.includes(v.id)} onChange={() => toggleVerify(v.id)} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{v.name}</td>
                      <td className="px-4 py-3">{company ? company.name : v.company}</td>
                      <td className="px-4 py-3"><Badge color={v.scenario.startsWith('C') ? 'red' : 'amber'}>{v.scenario}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.confidence}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.submitted}</td>
                      <td className="px-4 py-3 flex gap-2 justify-end">
                        <Button size="sm" variant="primary" onClick={() => handleVerifyAction(v.id, 'approve')}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleVerifyAction(v.id, 'return')}>Return</Button>
                        <Button size="sm" variant="danger" onClick={() => handleVerifyAction(v.id, 'reject')}>Reject</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination total={data.verifyQueue.length} maxPerPage={100} />
          </div>
        </>
      )}

      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine table results</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Min Salary</label>
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
                placeholder="0" 
                value={minSalary}
                onChange={e => setMinSalary(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Max Salary</label>
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
                placeholder="Any" 
                value={maxSalary}
                onChange={e => setMaxSalary(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">KYC Status</label>
            <select 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500"
              value={filterKyc}
              onChange={e => setFilterKyc(e.target.value)}
            >
              <option value="">All KYC Levels</option>
              <option value="VERIFIED">VERIFIED (L1)</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Whitelist Status</label>
            <select 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500"
              value={filterWhitelist}
              onChange={e => setFilterWhitelist(e.target.value)}
            >
              <option value="">All Whitelist States</option>
              <option value="yes">Enabled (L2 Verified)</option>
              <option value="no">Disabled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Employment Status</label>
            <select 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="FROZEN">FROZEN</option>
              <option value="BLACKLISTED">BLACKLISTED</option>
              <option value="KYC_RETURNED">KYC_RETURNED</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)} className="flex-1">Apply Filters</Button>
            <Button variant="ghost" onClick={() => {
              setMinSalary('');
              setMaxSalary('');
              setFilterKyc('');
              setFilterWhitelist('');
              setFilterStatus('');
              setAdvancedFilterOpen(false);
            }}>Reset All</Button>
          </div>
        </div>
      </Drawer>

      {/* Employee Manage Drawer with comments and history */}
      <Drawer isOpen={!!drawerEmpId} onClose={() => setDrawerEmpId(null)} mode="right">
        {(() => {
          const activeEmp = data.employees.find(e => e.id === drawerEmpId);
          if (!activeEmp) return null;
          const company = data.companies.find(c => c.id === activeEmp.company);
          const disbursements = data.disbursements.filter(d => d.emp.startsWith(activeEmp.id));
          const comments = activeEmp.comments || [
            { author: 'Ops Staff (System)', text: 'Initial verification checks complete. Awaiting direct payroll matching.', ts: '2026-06-25 09:15' }
          ];

          const handleAddEmployeeComment = () => {
            if (!newEmpComment.trim()) return;
            const updatedComments = [
              ...comments,
              { author: 'Sarah Jenkins (Analyst)', text: newEmpComment, ts: new Date().toISOString().slice(0,16).replace('T',' ') }
            ];
            const updatedEmps = data.employees.map(e => e.id === activeEmp.id ? { ...e, comments: updatedComments } : e);
            updateData({ employees: updatedEmps });
            pushAudit('EMPLOYEE_COMMENT', activeEmp.id, 'Logged staff comment');
            setNewEmpComment('');
            addToast('Comment added', 'Staff comment logged successfully.');
          };

          return (
            <>
              <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-[2]">
                <div>
                  <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">{activeEmp.name}</h2>
                  <div className="text-[11.5px] text-text-mute font-mono">{activeEmp.id} · {company ? company.name : activeEmp.company} · {activeEmp.dept}</div>
                </div>
                <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setDrawerEmpId(null)}>✕</button>
              </div>

              <div className="p-4.5 px-5 space-y-5">
                {/* Status and limits metrics */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Employment Status & Access</div>
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">KYC level</span>
                      <div><StatusBadge status={activeEmp.kyc} /></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Roster Whitelist</span>
                      <div className="flex items-center gap-1">
                        <Toggle isOn={activeEmp.whitelist} onToggle={() => toggleWhitelist(activeEmp.id)} />
                        <span className="text-[11px] font-semibold text-slate-600">{activeEmp.whitelist ? 'Active' : 'Disabled'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly Cap</span>
                      <span className="font-semibold text-slate-700 font-mono text-xs">{fmt(activeEmp.cap)} MMK</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Current Outstanding</span>
                      <span className="font-semibold text-amber-600 font-mono text-xs">{fmt(activeEmp.outstanding)} MMK</span>
                    </div>
                  </div>
                </div>

                {/* Account details */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Base Accounts & Payroll</div>
                  <div className="space-y-1 text-slate-700 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[11.5px]">
                    <div className="flex justify-between"><span>Base Monthly Salary:</span><span className="font-mono font-medium">{fmt(activeEmp.salary)} MMK</span></div>
                    <div className="flex justify-between"><span>Bank Account:</span><span className="font-semibold">{activeEmp.bank}</span></div>
                    <div className="flex justify-between"><span>Last Roster Sync:</span><span className="text-slate-500">{activeEmp.lastSync}</span></div>
                  </div>
                </div>

                {/* EWA Disbursements */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">EWA Request History ({disbursements.length})</div>
                  <div className="overflow-x-auto border border-line bg-panel rounded-xl shadow-sm max-h-[160px] overflow-y-auto">
                    <table className="dt min-w-full">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="px-2.5 py-1.5">Req ID</th>
                          <th className="px-2.5 py-1.5 text-right">Amount</th>
                          <th className="px-2.5 py-1.5">Method</th>
                          <th className="px-2.5 py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disbursements.length > 0 ? disbursements.map(d => (
                          <tr key={d.id}>
                            <td className="px-2.5 py-1.5 font-mono text-[10px] text-slate-400">{d.id}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[11px] text-slate-700">{fmt(d.requested)}</td>
                            <td className="px-2.5 py-1.5 text-slate-500">{d.channel}</td>
                            <td className="px-2.5 py-1.5"><StatusBadge status={d.status} /></td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="text-center italic text-slate-400 p-4">No disbursements found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Staff Comments Section */}
                <div className="pt-4 border-t border-line space-y-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Staff Discussion & Workflow comments</div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {comments.map((comm: any, i: number) => (
                      <div key={i} className="bg-slate-50 p-2 rounded border border-slate-150 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>{comm.author}</span>
                          <span>{comm.ts}</span>
                        </div>
                        <p className="m-0 text-slate-700 leading-normal text-[11.5px]">{comm.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type an internal remark..." 
                      className="flex-1 bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-primary rounded"
                      value={newEmpComment}
                      onChange={e => setNewEmpComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddEmployeeComment()}
                    />
                    <Button size="sm" onClick={handleAddEmployeeComment}>Add</Button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </Drawer>
    </div>
  );
}
