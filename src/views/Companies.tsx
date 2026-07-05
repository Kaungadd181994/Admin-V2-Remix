import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Button, StatusBadge, Drawer, Badge, TableToolbar, TablePagination } from '../components/UI';
import { fmt, mmk, STAGES } from '../types';

export default function Companies({ params }: { params?: { companyId?: string } }) {
  const { data, updateData, pushAudit, addToast, openTab } = useData();
  const [tab, setTab] = useState<'all' | 'pipeline'>('all');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [minEmployees, setMinEmployees] = useState('');
  const [maxEmployees, setMaxEmployees] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [obForm, setObForm] = useState({ name: '', type: 'CORPORATE', industry: '', emp: '' });

  const [drawerCorpId, setDrawerCorpId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [selectedStageKey, setSelectedStageKey] = useState<string>('SUBMITTED');
  const [newStageComment, setNewStageComment] = useState('');

  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  useEffect(() => {
    if (params?.companyId) {
      setDrawerCorpId(params.companyId);
    }
  }, [params]);

  const toggleRow = (id: string) => setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) => setSelectedRows(prev => prev.length === ids.length ? [] : ids);

  const handleStartOnboard = () => {
    if(!obForm.name) { addToast('Name required','Enter a company name to continue.','warn'); return; }
    const id = 'CORP-0' + (data.companies.length + 1).toString().padStart(2,'0');
    const newCo: any = {
      id, name: obForm.name, type: obForm.type, limit: 0, utilized: 0, 
      status: 'PENDING_OPS', tier: '-', score: 0, lastAudit: '-', 
      employees: Number(obForm.emp)||0, industry: obForm.industry||'General', 
      stage: 'SUBMITTED', payoutDay: '-', dueDay: '-', grace: '-', lateFee: '-', accrual: '-', capType: '-', capValue: '-',
      comments: {}
    };
    updateData({ companies: [...data.companies, newCo] });
    pushAudit('COMPANY_SUBMITTED', id, obForm.name + ' entered onboarding pipeline');
    addToast('Company submitted', obForm.name + ' is now at Stage 1 — Submitted.');
    setOnboardOpen(false);
    setTab('pipeline');
  };

  const handleAction = (action: string, id: string) => {
    const c = data.companies.find(x => x.id === id);
    if (!c) return;
    const label = action === 'pass' ? 'advanced to next stage' : action === 'return' ? 'returned for more info' : 'rejected';
    
    // Core Mandate: Every terminal action (Approve, Reject, Return) intercepts the system thread and forces a mandatory Remark Comment
    if (!comment.trim()) {
      addToast('Auditing Enforced', '🛑 SECURE COMPLIANCE: Every terminal action (Approve, Reject, Return) intercepts the system thread and FORCES a mandatory Remark Comment input before database ledger commit.', 'error');
      return;
    }
    
    // Auto advance stages on "pass"
    let nextStage = c.stage;
    let nextStatus = c.status;
    const currentIdx = STAGES.findIndex(s => s.key === c.stage);
    
    if (action === 'pass') {
      if (currentIdx < STAGES.length - 1) {
        nextStage = STAGES[currentIdx + 1].key;
        // Adjust status based on new stage
        if (nextStage === 'KYC_REVIEW') nextStatus = 'PENDING_OPS';
        else if (nextStage === 'CREDIT_ASSESSMENT') nextStatus = 'PENDING_RISK';
        else if (nextStage === 'BUDGET_APPROVAL') nextStatus = 'PENDING_FINANCE';
        else if (nextStage === 'ACTIVE') {
          nextStatus = 'ACTIVE';
          // set standard limits on completion if not set
          c.limit = c.limit || 25000000;
          c.tier = c.tier === '-' ? 'C' : c.tier;
          c.score = c.score || 65;
        }
      }
    } else if (action === 'return') {
      if (currentIdx > 0) {
        nextStage = STAGES[currentIdx - 1].key;
        nextStatus = 'PENDING_OPS';
      }
    } else if (action === 'reject') {
      nextStatus = 'RISK_WARNING';
    }

    // Persist comment in current active stage comments
    const currentComments = c.comments || {};
    const stageComments = currentComments[c.stage] || [];
    const updatedStageComments = [
      ...stageComments,
      { author: 'ryan.aung@ewa.platform (Action)', text: `${action.toUpperCase()}: ${comment}`, ts: new Date().toISOString().slice(0,16).replace('T',' ') }
    ];

    const updatedCos = data.companies.map(x => x.id === id ? { 
      ...x, 
      stage: nextStage, 
      status: nextStatus,
      comments: {
        ...currentComments,
        [c.stage]: updatedStageComments
      }
    } : x);

    updateData({ companies: updatedCos });
    pushAudit('COMPANY_' + action.toUpperCase(), id, `REMARK: ${comment}`);
    addToast('Action recorded', c.name + ' was ' + label + '.', action === 'reject' ? 'warn' : 'ok');
    setDrawerCorpId(null);
    setComment('');
  };

  const handleAddStageComment = (stageKey: string) => {
    if (!newStageComment.trim() || !activeCompany) return;
    const currentComments = activeCompany.comments || {};
    const stageComments = currentComments[stageKey] || [];
    
    const updatedStageComments = [
      ...stageComments,
      { author: 'Sarah Jenkins (Analyst)', text: newStageComment, ts: new Date().toISOString().slice(0,16).replace('T',' ') }
    ];

    const updatedCos = data.companies.map(c => c.id === activeCompany.id ? {
      ...c,
      comments: {
        ...currentComments,
        [stageKey]: updatedStageComments
      }
    } : c);

    updateData({ companies: updatedCos });
    pushAudit('COMPANY_COMMENT', activeCompany.id, `Comment added to ${stageKey}`);
    setNewStageComment('');
    addToast('Comment added', 'Workflow stage comment logged successfully.');
  };

  const handleBulkAdvance = () => {
    if (selectedRows.length === 0) return;
    const updatedCos = data.companies.map(c => {
      if (selectedRows.includes(c.id)) {
        const currentIdx = STAGES.findIndex(s => s.key === c.stage);
        if (currentIdx < STAGES.length - 1) {
          const nextStage = STAGES[currentIdx + 1].key;
          let nextStatus = c.status;
          if (nextStage === 'KYC_REVIEW') nextStatus = 'PENDING_OPS';
          else if (nextStage === 'CREDIT_ASSESSMENT') nextStatus = 'PENDING_RISK';
          else if (nextStage === 'BUDGET_APPROVAL') nextStatus = 'PENDING_FINANCE';
          else if (nextStage === 'ACTIVE') nextStatus = 'ACTIVE';

          const currentComments = c.comments || {};
          const updatedStageComments = [
            ...(currentComments[c.stage] || []),
            { author: 'ryan.aung@ewa.platform (Bulk Action)', text: `BULK PASS: Advanced to ${STAGES[currentIdx+1].label} via batch processing.`, ts: new Date().toISOString().slice(0,16).replace('T',' ') }
          ];

          return {
            ...c,
            stage: nextStage,
            status: nextStatus,
            comments: {
              ...currentComments,
              [c.stage]: updatedStageComments
            }
          };
        }
      }
      return c;
    });
    updateData({ companies: updatedCos });
    selectedRows.forEach(id => pushAudit('COMPANY_BULK_PASS', id, 'Advanced via bulk operations'));
    addToast('Bulk action completed', `Advanced ${selectedRows.length} selected companies to their next pipeline stage.`, 'ok');
    setSelectedRows([]);
  };

  const handleBulkSetTier = (tier: string) => {
    if (selectedRows.length === 0 || !tier) return;
    const updatedCos = data.companies.map(c => {
      if (selectedRows.includes(c.id)) {
        return { ...c, tier, score: tier === 'A' ? 90 : tier === 'B' ? 75 : tier === 'C' ? 60 : tier === 'D' ? 45 : 30 };
      }
      return c;
    });
    updateData({ companies: updatedCos });
    selectedRows.forEach(id => pushAudit('COMPANY_BULK_TIER', id, `Tier updated to ${tier} via bulk operation`));
    addToast('Bulk tier updated', `Set ${selectedRows.length} companies to Tier ${tier}.`, 'ok');
    setSelectedRows([]);
  };

  const handleBulkExport = () => {
    if (selectedRows.length === 0) return;
    const selectedData = data.companies.filter(c => selectedRows.includes(c.id));
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Name,Type,Limit,Utilized,Status,Tier,Employees,Industry"].join(",") + "\n"
      + selectedData.map(c => `${c.id},"${c.name}",${c.type},${c.limit},${c.utilized},${c.status},${c.tier},${c.employees},"${c.industry}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ewa_selected_companies_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Bulk Export Successful', `Exported data of ${selectedRows.length} selected companies.`, 'ok');
    setSelectedRows([]);
  };

  const handleToggleEmpWhitelist = (empId: string) => {
    const emp = data.employees.find(e => e.id === empId);
    if (!emp) return;
    
    if (['PENDING_SETTLE', 'BLACKLISTED', 'FROZEN', 'KYC_RETURNED'].includes(emp.status)) {
      addToast('Cannot whitelist', `${emp.name} must resolve status "${emp.status}" first.`, 'warn');
      return;
    }

    const updatedEmps = data.employees.map(e => {
      if (e.id === empId) {
        return { ...e, whitelist: !e.whitelist };
      }
      return e;
    });

    updateData({ employees: updatedEmps });
    pushAudit('WHITELIST_TOGGLE', empId, `Set to ${!emp.whitelist ? 'ON' : 'OFF'} from Company drawer`);
    addToast('Employee whitelist updated', `${emp.name} EWA access is now ${!emp.whitelist ? 'ENABLED' : 'DISABLED'}. Budget recalculated.`);
  };

  const handleUpdateEmpCap = (empId: string, newCapStr: string) => {
    const val = Number(newCapStr);
    if (isNaN(val) || val < 0) return;

    const emp = data.employees.find(e => e.id === empId);
    if (!emp) return;

    const updatedEmps = data.employees.map(e => {
      if (e.id === empId) {
        return { ...e, cap: val };
      }
      return e;
    });

    updateData({ employees: updatedEmps });
    pushAudit('EMPLOYEE_CAP_UPDATE', empId, `Cap adjusted to ${val.toLocaleString()} MMK`);
    addToast('Employee cap updated', `Set ${emp.name}'s EWA Cap to ${val.toLocaleString()} MMK.`);
  };

  const filtered = data.companies.filter(c => {
    const query = search.toLowerCase();
    const matchSearch = !query || 
      c.name.toLowerCase().includes(query) || 
      c.id.toLowerCase().includes(query) || 
      c.industry.toLowerCase().includes(query) ||
      (c.tier && c.tier.toLowerCase().includes(query)) ||
      c.status.toLowerCase().includes(query);

    const matchType = !filterType || c.type === filterType;
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchTier = !filterTier || c.tier === filterTier;
    
    const limitVal = c.limit || 0;
    const matchMinLimit = !minLimit || limitVal >= Number(minLimit);
    const matchMaxLimit = !maxLimit || limitVal <= Number(maxLimit);

    const empCount = c.employees || 0;
    const matchMinEmp = !minEmployees || empCount >= Number(minEmployees);
    const matchMaxEmp = !maxEmployees || empCount <= Number(maxEmployees);

    let matchDate = true;
    if (c.lastAudit && c.lastAudit !== '-') {
      if (startDate && c.lastAudit < startDate) matchDate = false;
      if (endDate && c.lastAudit > endDate) matchDate = false;
    } else if (startDate || endDate) {
      matchDate = false; // no date on record but date filter active
    }

    return matchSearch && matchType && matchStatus && matchTier && matchMinLimit && matchMaxLimit && matchMinEmp && matchMaxEmp && matchDate;
  });

  const activeCompany = drawerCorpId ? data.companies.find(c => c.id === drawerCorpId) : null;
  const stageIdx = activeCompany ? STAGES.findIndex(s => s.key === activeCompany.stage) : -1;
  const linkedEmps = activeCompany ? data.employees.filter(e => e.company === drawerCorpId) : [];

  useEffect(() => {
    if (activeCompany) {
      setSelectedStageKey(activeCompany.stage);
    }
  }, [drawerCorpId]);

  const getStageHistory = (co: any, stageKey: string) => {
    // Standard default comment records
    const defaults: Record<string, Array<{author: string, text: string, ts: string}>> = {
      SUBMITTED: [
        { author: 'ops.staff@ewa.platform', text: `Onboarded ${co.name} (${co.industry || 'General'}) with expected ${co.employees || 20} employees. Documents pre-scanned.`, ts: '2026-06-15 10:32' }
      ],
      KYC_REVIEW: [
        { author: 'Ei Ei Phyo (Ops Lead)', text: 'AML screening returned negative matches. Document packages are correct.', ts: '2026-06-16 14:12' }
      ],
      CREDIT_ASSESSMENT: [
        { author: 'Nandar Hlaing (Risk Officer)', text: `Assessed credit score at ${co.score || 72}/100. Stable tier proposed.`, ts: '2026-06-18 09:40' }
      ],
      BUDGET_APPROVAL: [
        { author: 'Kyaw Thiha (Finance Checker)', text: `Budget pool allocated and secured. Approved repayment terms.`, ts: '2026-06-20 16:25' }
      ],
      ACTIVE: [
        { author: 'System Sentinel', text: 'All operational parameters validated. Active EWA serving enabled.', ts: '2026-06-21 00:01' }
      ]
    };

    const isCompleted = STAGES.findIndex(s => s.key === stageKey) < STAGES.findIndex(s => s.key === co.stage);
    const isCurrent = co.stage === stageKey;

    let checklist: Array<{item: string, ok: boolean}> = [];
    if (stageKey === 'SUBMITTED') {
      checklist = [
        { item: 'KYC/KYB digital application form complete', ok: true },
        { item: 'Company registration certificate uploaded', ok: true },
        { item: 'Director NRC / Passport identification verified', ok: true },
      ];
    } else if (stageKey === 'KYC_REVIEW') {
      checklist = [
        { item: 'KYC/AML Watchlist clearance (DICA matching)', ok: isCompleted || isCurrent },
        { item: 'Bank account verification & connectivity test', ok: isCompleted },
        { item: 'Board of directors approval resolution filed', ok: isCompleted },
      ];
    } else if (stageKey === 'CREDIT_ASSESSMENT') {
      checklist = [
        { item: 'CBM credit bureau profile check', ok: isCompleted || isCurrent },
        { item: 'Audited financial balance sheet review', ok: isCompleted },
        { item: 'Tier allocation and credit scoring model execution', ok: isCompleted },
      ];
    } else if (stageKey === 'BUDGET_APPROVAL') {
      checklist = [
        { item: 'Maker rule configuration match confirmation', ok: isCompleted || isCurrent },
        { item: 'Pre-funding collateral verification', ok: isCompleted },
        { item: 'Finance committee credit pool signoff', ok: isCompleted },
      ];
    } else if (stageKey === 'ACTIVE') {
      checklist = [
        { item: 'API integrations live', ok: isCompleted || isCurrent },
        { item: 'Employee roster synchronization enabled', ok: isCompleted || isCurrent },
        { item: 'Realtime disbursement system unlocked', ok: isCompleted || isCurrent },
      ];
    }

    const stageComments = (co.comments && co.comments[stageKey]) || (isCompleted || isCurrent ? defaults[stageKey] || [] : []);

    return {
      checklist,
      comments: stageComments,
      actor: stageKey === 'SUBMITTED' ? 'ops.staff@ewa' : stageKey === 'KYC_REVIEW' ? 'ops.lead@ewa' : stageKey === 'CREDIT_ASSESSMENT' ? 'risk.officer@ewa' : stageKey === 'BUDGET_APPROVAL' ? 'finance.checker@ewa' : 'system'
    };
  };

  const renderStageContent = (stageKey: string) => {
    if (!activeCompany) return null;
    const history = getStageHistory(activeCompany, stageKey);
    return (
      <div className="space-y-4 text-xs">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Step Checklist</div>
          <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
            {history.checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={item.ok ? 'text-emerald-500 font-bold' : 'text-slate-300 font-bold'}>
                  {item.ok ? '✓' : '○'}
                </span>
                <span className={item.ok ? 'text-slate-700' : 'text-slate-400 italic'}>{item.item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wide">Stage Comments & Audits</div>
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {history.comments.length > 0 ? (
              history.comments.map((comm: any, i: number) => (
                <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>{comm.author}</span>
                    <span>{comm.ts}</span>
                  </div>
                  <p className="m-0 text-slate-700 leading-normal">{comm.text}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 italic py-2">No comments logged for this stage yet.</div>
            )}
          </div>
        </div>

        {/* Live stage comment logger */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            placeholder="Log an internal comment on this stage..." 
            className="flex-1 bg-slate-50 border border-slate-200 text-xs px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-primary rounded"
            value={newStageComment}
            onChange={e => setNewStageComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddStageComment(stageKey)}
          />
          <Button size="sm" onClick={() => handleAddStageComment(stageKey)}>Add Comment</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0">Companies</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="primary" onClick={() => setOnboardOpen(true)}>+ Start Onboarding</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 pb-2">
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('all')}>All Companies ({data.companies.length})</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'pipeline' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('pipeline')}>Onboarding Pipeline</button>
      </div>

      {tab === 'all' ? (
        <>
          <TableToolbar 
            search={search} 
            setSearch={setSearch} 
            placeholder="Search by ID, Name, Industry, Tier, Status..."
            searchFields={['ID', 'Name', 'Industry', 'Tier', 'Status']}
            count={filtered.length}
            onExport={() => addToast('Exporting Data', 'Downloading CSV...', 'ok')}
            onAdvancedFilter={() => setAdvancedFilterOpen(true)}
            filters={
              <>
                <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                  <option value="">All types</option>
                  <option value="CORPORATE">CORPORATE</option>
                  <option value="SME">SME</option>
                </select>
                <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RISK_WARNING">RISK_WARNING</option>
                  <option value="PENDING_RISK">PENDING_RISK</option>
                  <option value="PENDING_OPS">PENDING_OPS</option>
                  <option value="PENDING_FINANCE">PENDING_FINANCE</option>
                </select>
              </>
            }
          />

          {selectedRows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selectedRows.length}</span>
                <span className="text-[12.5px] font-semibold text-blue-800">Companies selected for bulk operations</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="success" onClick={handleBulkAdvance}>
                  🚀 Bulk Advance Stage
                </Button>
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs">
                  <span className="text-slate-500 font-medium px-1">Set Tier:</span>
                  <select 
                    className="bg-transparent border-none text-[11.5px] font-bold outline-none cursor-pointer pr-1 text-slate-700"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleBulkSetTier(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Select...</option>
                    <option value="A">Tier A</option>
                    <option value="B">Tier B</option>
                    <option value="C">Tier C</option>
                    <option value="D">Tier D</option>
                    <option value="E">Tier E</option>
                  </select>
                </div>
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
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedRows.length === filtered.length && filtered.length > 0} onChange={() => toggleAll(filtered.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Corporate ID &amp; Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Total Limit</th><th className="px-4 py-3 text-right">Utilized</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right text-emerald-700 bg-emerald-50/50 font-bold">Whitelist Cap Allocation</th>
                  <th className="px-4 py-3">Payout Day</th><th className="px-4 py-3">Due Day</th><th className="px-4 py-3">Grace</th><th className="px-4 py-3">Late Fee %</th>
                  <th className="px-4 py-3">Tier &amp; Score</th><th className="px-4 py-3">Cap Strategy</th><th className="px-4 py-3">Accrual Mode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last Audit</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filtered.map(c => (
                  <tr key={c.id} className={selectedRows.includes(c.id) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4"><input type="checkbox" checked={selectedRows.includes(c.id)} onChange={() => toggleRow(c.id)} /></td>
                    <td><span className="font-semibold text-text-main">{c.id}</span> <span className="ml-1">{c.name}</span><div className="text-[11px] text-text-mute mt-0.5">{c.industry} · {c.employees} employees</div></td>
                    <td><Badge color={c.type==='CORPORATE'?'blue':'grey'}>{c.type}</Badge></td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{c.limit?fmt(c.limit):'—'}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{c.utilized?fmt(c.utilized):'—'}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{c.limit?fmt(c.limit-c.utilized):'—'}</td>
                    <td className="text-right font-mono text-[12px] bg-emerald-50/15 font-semibold text-emerald-800">
                      {(() => {
                        const wList = data.employees.filter(e => e.company === c.id && e.whitelist);
                        const totalWCap = wList.reduce((sum, e) => sum + (e.cap || 0), 0);
                        return (
                          <div className="flex flex-col items-end">
                            <span>{totalWCap > 0 ? fmt(totalWCap) + ' MMK' : '—'}</span>
                            <span className="text-[10px] text-emerald-600 font-sans font-medium">{wList.length} whitelisted</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="font-mono text-[12px] text-text-dim">{c.payoutDay!=='-'?'Day '+c.payoutDay:'—'}</td>
                    <td className="font-mono text-[12px] text-text-dim">{c.dueDay!=='-'?'Day '+c.dueDay:'—'}</td>
                    <td className="font-mono text-[12px] text-text-dim">{c.grace!=='-'?c.grace+' Days':'—'}</td>
                    <td className="font-mono text-[12px] text-text-dim">{c.lateFee!=='-'?c.lateFee+'%':'—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {c.tier !== '-' ? <Badge color={({ A: 'green', B: 'blue', C: 'grey', D: 'amber', E: 'red' } as any)[c.tier] || 'grey'}>Tier {c.tier}</Badge> : '—'}
                        {c.score > 0 && (
                          <span className={`text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            c.score >= 80 ? 'bg-green-50 text-green-700 border border-green-100' :
                            c.score >= 60 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            c.score >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {c.score}/100
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">
                      {c.capType !== '-' ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{c.capValue}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">{c.capType}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="text-xs">
                      {c.accrual !== '-' ? (
                        <Badge color={c.accrual === 'SIMPLE_DAILY' ? 'blue' : 'amber'}>
                          {c.accrual === 'SIMPLE_DAILY' ? 'Simple Daily' : 'Compound Daily'}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="font-mono text-[12px] text-text-dim">{c.lastAudit}</td>
                    <td className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" onClick={() => setDrawerCorpId(c.id)}>Manage</Button>
                        <Button size="sm" variant="ghost" title="Open in New Parallel Tab" onClick={() => openTab('companies', 'company-' + c.id, '🏢 ' + c.name, { companyId: c.id })}>
                          ↗
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination total={filtered.length} maxPerPage={100} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map(s => {
              const items = data.companies.filter(c => c.stage === s.key);
              return (
                <div key={s.key} className="bg-slate-50 rounded-xl flex flex-col min-h-[420px] p-2">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center mb-2">
                    <span>{s.label}</span>
                    <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {items.length > 0 ? items.map(c => (
                      <div key={c.id} className="bg-white border border-slate-200 p-3 rounded-lg text-xs cursor-pointer hover:border-blue-500 hover:shadow-md transition-all shadow-sm" onClick={() => setDrawerCorpId(c.id)}>
                        <div className="font-mono text-[10px] text-slate-400">{c.id} · {c.type}</div>
                        <div className="font-bold my-1.5 text-[13px] text-slate-800">{c.name}</div>
                        <div className="flex justify-between text-slate-500 text-[10px] font-medium"><span>{c.industry}</span><span>{c.employees} emp</span></div>
                      </div>
                    )) : <div className="p-4 py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg mt-1"><div className="text-xl mb-2">📥</div>No companies</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-text-mute mt-2">Corporate: 5-stage pipeline with Maker-Checker · SME: simplified 3-stage (Submitted → Verification → Active). Click a card to act.</div>
        </>
      )}

      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div>
            <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2>
            <div className="text-[11.5px] text-text-mute">Refine table results by all available parameters</div>
          </div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Limit Range */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] text-slate-500 uppercase font-bold tracking-wider">Credit Limit Range (MMK)</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2.5 text-[12.5px] outline-none focus:border-blue-500 rounded" 
                placeholder="Min Limit" 
                value={minLimit} 
                onChange={e => setMinLimit(e.target.value)} 
              />
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2.5 text-[12.5px] outline-none focus:border-blue-500 rounded" 
                placeholder="Max Limit" 
                value={maxLimit} 
                onChange={e => setMaxLimit(e.target.value)} 
              />
            </div>
          </div>

          {/* Employee Size Range */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] text-slate-500 uppercase font-bold tracking-wider">Workforce Size (Employees)</label>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2.5 text-[12.5px] outline-none focus:border-blue-500 rounded" 
                placeholder="Min Employees" 
                value={minEmployees} 
                onChange={e => setMinEmployees(e.target.value)} 
              />
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2.5 text-[12.5px] outline-none focus:border-blue-500 rounded" 
                placeholder="Max Employees" 
                value={maxEmployees} 
                onChange={e => setMaxEmployees(e.target.value)} 
              />
            </div>
          </div>

          {/* Credit Risk Rating Tier */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] text-slate-500 uppercase font-bold tracking-wider">Credit Tier Rating</label>
            <select 
              className="w-full h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2.5 text-[12.5px] outline-none focus:border-blue-500 rounded" 
              value={filterTier} 
              onChange={e => setFilterTier(e.target.value)}
            >
              <option value="">All Tiers</option>
              <option value="A">Tier A (Excellent Credit)</option>
              <option value="B">Tier B (Good Credit)</option>
              <option value="C">Tier C (Moderate Credit)</option>
              <option value="D">Tier D (High Credit Risk)</option>
              <option value="E">Tier E (Very High Credit Risk)</option>
            </select>
          </div>

          {/* Last Audit Date Range */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] text-slate-500 uppercase font-bold tracking-wider">Last Audit / Sync Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-400 uppercase">From</span>
                <input 
                  type="date" 
                  className="h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2 text-[11.5px] outline-none focus:border-blue-500 rounded" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-400 uppercase">To</span>
                <input 
                  type="date" 
                  className="h-9 bg-slate-50 border border-slate-200 text-slate-800 px-2 text-[11.5px] outline-none focus:border-blue-500 rounded" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-100">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)} className="flex-1">Apply Constraints</Button>
            <Button variant="ghost" onClick={() => {
              setMinLimit('');
              setMaxLimit('');
              setMinEmployees('');
              setMaxEmployees('');
              setStartDate('');
              setEndDate('');
              setFilterTier('');
              setFilterType('');
              setFilterStatus('');
              setSearch('');
              addToast('Filters Cleared', 'All constraints have been reset.', 'ok');
              setAdvancedFilterOpen(false);
            }}>Clear All</Button>
          </div>
        </div>
      </Drawer>

      {/* Onboarding Modal */}
      <Drawer isOpen={onboardOpen} onClose={() => setOnboardOpen(false)} mode="center">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Start Company Onboarding</h2><div className="text-[11.5px] text-text-mute font-mono">Stage 1 of 5 · Submitted</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setOnboardOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-3.5">
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Company Name</label><input type="text" className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary" placeholder="e.g. Ayeyar Construction Ltd" value={obForm.name} onChange={e=>setObForm({...obForm, name: e.target.value})} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Company Type</label><select className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary" value={obForm.type} onChange={e=>setObForm({...obForm, type: e.target.value})}><option value="CORPORATE">CORPORATE — multi-branch, full pipeline</option><option value="SME">SME — single branch, simplified</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Industry</label><input type="text" className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary" placeholder="e.g. Construction" value={obForm.industry} onChange={e=>setObForm({...obForm, industry: e.target.value})} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Expected Employee Count</label><input type="text" className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary" placeholder="e.g. 60" value={obForm.emp} onChange={e=>setObForm({...obForm, emp: e.target.value})} /></div>
          <div className="text-[11px] text-text-mute mt-2">Company enters the pipeline at <strong>Submitted</strong>. Operations verifies documents next, then Risk assesses credit, then Finance approves budget.</div>
          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={handleStartOnboard}>Submit &amp; Create</Button>
            <Button variant="ghost" onClick={() => setOnboardOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Drawer>

      {/* Company Manage Drawer */}
      <Drawer isOpen={!!drawerCorpId} onClose={() => setDrawerCorpId(null)} mode="right">
        {activeCompany && (
          <>
            <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-[2]">
              <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">{activeCompany.name}</h2><div className="text-[11.5px] text-text-mute font-mono">{activeCompany.id} · {activeCompany.type} · {activeCompany.industry}</div></div>
              <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setDrawerCorpId(null)}>✕</button>
            </div>
            
            <div className="px-5 pt-3 border-b border-line bg-panel sticky top-[73px] z-[1]">
              <div className="flex gap-4">
                <button className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'all' || tab === 'pipeline' ? 'border-primary text-text-main' : 'border-transparent text-text-mute hover:text-text-main'}`}>Overview & Config</button>
                <button className={`pb-3 text-sm font-semibold border-b-2 transition-colors border-transparent text-text-mute hover:text-text-main`}>Employees</button>
                <button className={`pb-3 text-sm font-semibold border-b-2 transition-colors border-transparent text-text-mute hover:text-text-main`}>Budget Approvals</button>
              </div>
            </div>

            <div className="p-4.5 px-5">
              {/* Interactive Multi-Stage Progress Workflow */}
              <div className="flex flex-col gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200 mb-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Click any stage below to inspect checklists & comments:
                </div>
                <div className="flex items-center gap-1 border-b border-slate-100 pb-1.5">
                  {STAGES.map((s, i) => {
                    const isCompleted = i < stageIdx;
                    const isCurrent = s.key === activeCompany.stage;
                    const isSelected = s.key === selectedStageKey;
                    
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSelectedStageKey(s.key)}
                        className={`flex-1 text-center py-1 px-0.5 text-[9.5px] font-bold border-b-2 uppercase tracking-[.02em] transition-all cursor-pointer ${
                          isSelected 
                            ? 'text-primary border-primary bg-white shadow-sm rounded-t-sm' 
                            : isCompleted 
                              ? 'text-success border-success hover:bg-emerald-50/50' 
                              : isCurrent 
                                ? 'text-primary/70 border-slate-200 hover:bg-slate-100' 
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5 py-1">
                          <span className="text-[11px] leading-none">
                            {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                          </span>
                          <span className="truncate w-full text-center px-0.5">{s.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Active Stage Detail Panel */}
                <div className="bg-white rounded-lg border border-slate-200/60 p-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Stage: {STAGES.find(s => s.key === selectedStageKey)?.label}
                    </span>
                    <Badge color={
                      STAGES.findIndex(s => s.key === selectedStageKey) < stageIdx
                        ? 'green'
                        : selectedStageKey === activeCompany.stage
                          ? 'blue'
                          : 'grey'
                    }>
                      {STAGES.findIndex(s => s.key === selectedStageKey) < stageIdx
                        ? 'COMPLETED'
                        : selectedStageKey === activeCompany.stage
                          ? 'PENDING'
                          : 'AWAITING'}
                    </Badge>
                  </div>
                  {renderStageContent(selectedStageKey)}
                </div>
              </div>

              <div className="text-[11px] uppercase tracking-[.06em] text-text-mute mb-3">Company Profile & Status</div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-text-mute uppercase tracking-[.05em] font-bold">Risk Tier</div><div className="text-[13px] font-medium">{activeCompany.tier!=='-'?'Tier '+activeCompany.tier+' ('+activeCompany.score+'/100)':'Not assessed'}</div></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-text-mute uppercase tracking-[.05em] font-bold">Status</div><div><StatusBadge status={activeCompany.status} /></div></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-text-mute uppercase tracking-[.05em] font-bold">Total Approved Limit</div><div className="text-[13px] font-medium font-mono text-primary">{activeCompany.limit?mmk(activeCompany.limit):'Pending'}</div></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-text-mute uppercase tracking-[.05em] font-bold">Current Utilized</div><div className="text-[13px] font-medium font-mono text-amber-600">{activeCompany.utilized?mmk(activeCompany.utilized):'—'}</div></div>
              </div>

              {/* Whitelist Employee Cap Budget Relation Card */}
              {(() => {
                const wList = data.employees.filter(e => e.company === activeCompany.id && e.whitelist);
                const totalWCap = wList.reduce((sum, e) => sum + (e.cap || 0), 0);
                const totalWOutstanding = wList.reduce((sum, e) => sum + (e.outstanding || 0), 0);
                const wListPercentOfLimit = activeCompany.limit > 0 ? ((totalWCap / activeCompany.limit) * 100).toFixed(1) : '0';
                const utilizationPercent = totalWCap > 0 ? ((totalWOutstanding / totalWCap) * 100).toFixed(1) : '0';

                return (
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px]">🛡️</span>
                        <h4 className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider m-0">
                          Whitelist Cap Budget Linkage
                        </h4>
                      </div>
                      <Badge color="green">Active Sync</Badge>
                    </div>

                    <p className="text-[11.5px] text-emerald-800/80 leading-relaxed mb-3 font-sans">
                      The total credit limit of this corporate is dynamically allocated to individual employees via the **Whitelist Roster**. Only Whitelisted employees have active EWA caps and can draw advances.
                    </p>

                    <div className="grid grid-cols-2 gap-3.5 bg-white border border-emerald-100 p-3 rounded-lg text-xs font-sans mb-3.5">
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Whitelisted Employees</span>
                        <strong className="text-slate-800 text-[13px]">{wList.length} Active Profiles</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Total Roster Cap Pool</span>
                        <strong className="text-emerald-700 font-mono text-[13px]">{fmt(totalWCap)} MMK</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Active Whitelist Draw</span>
                        <strong className="text-slate-800 font-mono text-[13px]">{fmt(totalWOutstanding)} MMK</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase text-[9px] font-bold mb-0.5">Available Whitelist Room</span>
                        <strong className="text-blue-700 font-mono text-[13px]">{fmt(totalWCap - totalWOutstanding)} MMK</strong>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-[10.5px] text-emerald-800 font-medium mb-1">
                          <span>Roster Cap Allocated (% of Treasury Limit)</span>
                          <span className="font-bold">{wListPercentOfLimit}%</span>
                        </div>
                        <div className="h-1.5 bg-emerald-100/60 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(Number(wListPercentOfLimit), 100)}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10.5px] text-emerald-800 font-medium mb-1">
                          <span>Whitelist Active Utilization Rate</span>
                          <span className="font-bold">{utilizationPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-emerald-100/60 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(Number(utilizationPercent), 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="text-[11px] uppercase tracking-[.06em] text-text-mute mt-6 mb-3 pt-4 border-t border-line">Policy & Rule Configuration (Maker-Checker)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Payroll Window</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue="1st to 30th" /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Payout Day</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue={activeCompany.payoutDay!=='-'?activeCompany.payoutDay:''} placeholder="e.g. 5" /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Repayment Due Day</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue={activeCompany.dueDay!=='-'?activeCompany.dueDay:''} placeholder="e.g. 7" /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Grace Period (Days)</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue={activeCompany.grace!=='-'?activeCompany.grace:''} /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Disbursement Fee</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue="1500 MMK" /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Late Fee Strategy</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue={activeCompany.lateFee!=='-'?activeCompany.lateFee+'% per day':'Standard Profile'} /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cap Limitation</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue={activeCompany.capType} /></div>
                <div className="flex flex-col gap-1.5"><div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Additional Limitations</div><input type="text" className="bg-white border border-slate-200 rounded text-xs px-2 py-1.5" defaultValue="Max 4 requests / month" /></div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-end gap-2 mt-2">
                  <Button variant="ghost">Reset</Button>
                  <Button variant="primary">Save Configuration</Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 mb-3 pt-4 border-t border-line">
                <div className="text-[11px] uppercase tracking-[.06em] text-text-mute">Onboarding Action</div>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase font-mono">
                  ⚠️ Mandatory Audit Remark Required
                </span>
              </div>
              <p className="text-[11px] text-text-mute mb-3 -mt-1 font-medium">Operations verifies KYC/KYB → Risk sets rules (Maker) → Finance approves budget (Checker).</p>
              <textarea 
                className={`w-full bg-panel-2 border text-text-main p-2.5 text-[12.5px] min-h-[64px] resize-y focus:outline-none rounded-lg transition-all ${
                  !comment.trim() ? 'border-red-300 focus:border-red-500 bg-red-50/10' : 'border-line focus:border-primary'
                }`}
                placeholder="Add a detailed remark comment for this stage action (required)..." 
                value={comment} 
                onChange={e=>setComment(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap mb-6">
                <Button variant="success" onClick={() => handleAction('pass', activeCompany.id)}>✓ Pass / Approve</Button>
                <Button variant="danger" onClick={() => handleAction('return', activeCompany.id)}>↩ Return</Button>
                <Button variant="ghost" onClick={() => handleAction('reject', activeCompany.id)}>✕ Reject</Button>
              </div>

              <div className="text-[11px] uppercase tracking-[.06em] text-text-mute mt-6 mb-3 pt-4 border-t border-line">Linked Employees ({linkedEmps.length})</div>
              <div className="overflow-x-auto border border-line bg-panel rounded-xl mb-4 shadow-sm">
                <table className="dt min-w-full">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Employee</th>
                      <th className="px-3 py-2">KYC</th>
                      <th className="px-3 py-2">Whitelist</th>
                      <th className="px-3 py-2 text-right">EWA Cap Limit (MMK)</th>
                      <th className="px-3 py-2 text-right">Outstanding</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedEmps.length ? linkedEmps.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-900">{e.id} {e.name}</td>
                        <td className="px-3 py-2"><StatusBadge status={e.kyc} /></td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleToggleEmpWhitelist(e.id)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                              e.whitelist 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {e.whitelist ? '✓ ENABLED' : '✕ DISABLED'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input 
                              type="number" 
                              className="w-24 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded text-right px-1.5 py-0.5 font-mono text-[11.5px] transition-all outline-none"
                              value={e.cap || 0}
                              onChange={evt => handleUpdateEmpCap(e.id, evt.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-600">{fmt(e.outstanding)}</td>
                        <td className="px-3 py-2"><StatusBadge status={e.status} /></td>
                      </tr>
                    )) : <tr><td colSpan={6} className="text-slate-400 text-[12px] p-6 text-center border-2 border-dashed border-slate-100 rounded-lg m-2">No employees uploaded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
