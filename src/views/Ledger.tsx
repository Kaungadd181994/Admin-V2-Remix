import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { fmt, mmk } from '../types';
import { Badge, TableToolbar, TablePagination, Button, Drawer } from '../components/UI';

export default function Ledger() {
  const { data, updateData, addToast, pushAudit } = useData();
  const [tab, setTab] = useState<'journal' | 'coa'>('journal');
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  
  // Selection states
  const [selectedJournal, setSelectedJournal] = useState<string[]>([]);
  const toggleJournal = (id: string) => setSelectedJournal(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllJournal = (ids: string[]) => setSelectedJournal(prev => prev.length === ids.length ? [] : ids);
  
  const [selectedCoa, setSelectedCoa] = useState<string[]>([]);
  const toggleCoa = (id: string) => setSelectedCoa(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllCoa = (ids: string[]) => setSelectedCoa(prev => prev.length === ids.length ? [] : ids);

  // Filter states
  const [filterAccountType, setFilterAccountType] = useState('');
  const [filterRefType, setFilterRefType] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drilldown states
  const [detailJournal, setDetailJournal] = useState<any>(null);
  const [detailCoa, setDetailCoa] = useState<any>(null);

  // Creation/Form states
  const [postManualOpen, setPostManualOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  // Manual Journal form values
  const [manualDebit, setManualDebit] = useState('');
  const [manualCredit, setManualCredit] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));

  // Create COA account form values
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'Asset' | 'Liability' | 'Income' | 'Expense'>('Asset');

  // Filter Journals
  const filteredJournal = data.journal.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      j.id.toLowerCase().includes(q) || 
      j.ref.toLowerCase().includes(q) || 
      j.desc.toLowerCase().includes(q) || 
      j.debit.toLowerCase().includes(q) || 
      j.credit.toLowerCase().includes(q);

    const matchRefType = !filterRefType || j.ref.startsWith(filterRefType);
    const matchMin = !minAmount || j.amount >= Number(minAmount);
    const matchMax = !maxAmount || j.amount <= Number(maxAmount);
    const matchStartDate = !startDate || j.date >= startDate;
    const matchEndDate = !endDate || j.date <= endDate;

    return matchSearch && matchRefType && matchMin && matchMax && matchStartDate && matchEndDate;
  });

  // Filter Chart of Accounts
  const filteredCoa = data.coa.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      a.code.toLowerCase().includes(q) || 
      a.name.toLowerCase().includes(q) || 
      a.type.toLowerCase().includes(q);

    const matchType = !filterAccountType || a.type === filterAccountType;
    const matchMinNet = !minAmount || Math.abs(a.net) >= Number(minAmount);
    const matchMaxNet = !maxAmount || Math.abs(a.net) <= Number(maxAmount);

    return matchSearch && matchType && matchMinNet && matchMaxNet;
  });

  const totalDr = data.coa.reduce((s,a) => s + a.debit, 0);
  const totalCr = data.coa.reduce((s,a) => s + a.credit, 0);

  // Selection statistics
  const selectedAccounts = data.coa.filter(a => selectedCoa.includes(a.code));
  const selectedTrialDr = selectedAccounts.reduce((sum, a) => sum + a.debit, 0);
  const selectedTrialCr = selectedAccounts.reduce((sum, a) => sum + a.credit, 0);

  // Handlers
  const handleBulkJournalExport = () => {
    if (selectedJournal.length === 0) return;
    const selectedData = data.journal.filter(j => selectedJournal.includes(j.id));
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Entry ID,Date,Reference,Description,Debit Account,Credit Account,Amount"].join(",") + "\n"
      + selectedData.map(j => `${j.id},${j.date},${j.ref},"${j.desc.replace(/"/g, '""')}","${j.debit}","${j.credit}",${j.amount}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_entries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Export successful', `Exported ${selectedJournal.length} journal entries.`, 'ok');
    setSelectedJournal([]);
  };

  const handleBulkJournalVerify = () => {
    if (selectedJournal.length === 0) return;
    addToast('Verification complete', `Successfully verified and locked ${selectedJournal.length} entries.`, 'ok');
    selectedJournal.forEach(id => pushAudit('JOURNAL_VERIFY', id, `Manually reconciled and closed audit period`));
    setSelectedJournal([]);
  };

  const handleBulkCoaExport = () => {
    if (selectedCoa.length === 0) return;
    const selectedData = data.coa.filter(a => selectedCoa.includes(a.code));
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Account Code,Account Name,Type,Debit Balance,Credit Balance,Net Balance"].join(",") + "\n"
      + selectedData.map(a => `${a.code},"${a.name}",${a.type},${a.debit},${a.credit},${a.net}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chart_of_accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Export successful', `Exported ${selectedCoa.length} account definitions.`, 'ok');
    setSelectedCoa([]);
  };

  // Post Manual Journal Entry logic
  const handlePostManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDebit || !manualCredit || !manualAmount || !manualDesc) {
      addToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }
    if (manualDebit === manualCredit) {
      addToast('Accounting Error', 'Debit and Credit accounts must be different for double-entry validation.', 'error');
      return;
    }
    const parsedAmount = Number(manualAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast('Validation Error', 'Amount must be a positive number.', 'error');
      return;
    }

    const nextId = `JE-880${data.journal.length + 22}`;
    const debAccountObj = data.coa.find(c => c.code === manualDebit)!;
    const credAccountObj = data.coa.find(c => c.code === manualCredit)!;

    const newEntry = {
      id: nextId,
      date: manualDate,
      ref: manualRef || 'JE-MANUAL',
      desc: manualDesc,
      debit: `${debAccountObj.name} (${debAccountObj.code})`,
      credit: `${credAccountObj.name} (${credAccountObj.code})`,
      amount: parsedAmount
    };

    // Update Chart of Accounts balances
    const updatedCoa = data.coa.map(acc => {
      let d = acc.debit;
      let c = acc.credit;
      if (acc.code === manualDebit) {
        d += parsedAmount;
      }
      if (acc.code === manualCredit) {
        c += parsedAmount;
      }
      return {
        ...acc,
        debit: d,
        credit: c,
        net: d - c
      };
    });

    updateData({
      journal: [newEntry, ...data.journal],
      coa: updatedCoa
    });

    pushAudit('MANUAL_JE_POST', nextId, `Manual double-entry adjustment: Dr ${debAccountObj.code} / Cr ${credAccountObj.code} with ${mmk(parsedAmount)}`);
    addToast('Journal Entry Posted', `Transaction ${nextId} has been posted. Trial Balance recalculated.`, 'ok');

    // Reset Form
    setManualDebit('');
    setManualCredit('');
    setManualAmount('');
    setManualDesc('');
    setManualRef('');
    setPostManualOpen(false);
  };

  // Create Chart of Accounts logic
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode || !newAccName) {
      addToast('Validation Error', 'Please fill in both account code and account name.', 'error');
      return;
    }
    const isExist = data.coa.some(a => a.code === newAccCode);
    if (isExist) {
      addToast('Duplicate Code', `An account with code ${newAccCode} already exists.`, 'error');
      return;
    }

    const newAccount = {
      code: newAccCode,
      name: newAccName,
      type: newAccType,
      debit: 0,
      credit: 0,
      net: 0
    };

    updateData({
      coa: [...data.coa, newAccount]
    });

    pushAudit('COA_ACCOUNT_CREATE', newAccCode, `Created new ${newAccType} account: ${newAccName}`);
    addToast('Account Created', `Chart of Accounts updated with ${newAccName} (${newAccCode}).`, 'ok');

    // Reset Form
    setNewAccCode('');
    setNewAccName('');
    setNewAccType('Asset');
    setAddAccountOpen(false);
  };

  const handleBulkExport = () => {
    if (tab === 'journal') {
      if (selectedJournal.length > 0) {
        handleBulkJournalExport();
      } else {
        const csvContent = "data:text/csv;charset=utf-8," 
          + ["Entry ID,Date,Reference,Description,Debit Account,Credit Account,Amount"].join(",") + "\n"
          + filteredJournal.map(j => `${j.id},${j.date},${j.ref},"${j.desc.replace(/"/g, '""')}","${j.debit}","${j.credit}",${j.amount}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `journal_all_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Export successful', `Exported all ${filteredJournal.length} matching journal entries.`, 'ok');
      }
    } else {
      if (selectedCoa.length > 0) {
        handleBulkCoaExport();
      } else {
        const csvContent = "data:text/csv;charset=utf-8," 
          + ["Account Code,Account Name,Type,Debit Balance,Credit Balance,Net Balance"].join(",") + "\n"
          + filteredCoa.map(a => `${a.code},"${a.name}",${a.type},${a.debit},${a.credit},${a.net}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `chart_of_accounts_all_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Export successful', `Exported all ${filteredCoa.length} matching accounts.`, 'ok');
      }
    }
  };

  // Find entries for a specific account Ledger Card view
  const getAccountLedgerEntries = (code: string) => {
    return data.journal.filter(j => j.debit.includes(`(${code})`) || j.credit.includes(`(${code})`) || j.debit.includes(code) || j.credit.includes(code));
  };

  return (
    <div className="space-y-4">
      <div className="view-head flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0 mb-1">General Ledger &amp; Chart of Accounts</h1>
          <div className="text-xs text-slate-500 font-medium">Real-time dual-aspect accounting registers reflecting multi-tenant escrow ledger controls and automatic fee allocation.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={() => setAddAccountOpen(true)}>
            📁 Create Account
          </Button>
          <Button size="sm" variant="primary" onClick={() => setPostManualOpen(true)}>
            ✍ Post Manual Journal
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 pb-2">
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'journal' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('journal'); setSelectedCoa([]); }}>Journal Entries</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'coa' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('coa'); setSelectedJournal([]); }}>Chart of Accounts &amp; Trial Balance</button>
      </div>

      <TableToolbar 
        search={search} 
        setSearch={setSearch} 
        placeholder={tab === 'journal' ? "Search journal entries by ID, ref, description..." : "Search accounts by code, name, type..."}
        searchFields={tab === 'journal' ? ['ID', 'Date', 'Ref', 'Description', 'Accounts'] : ['Code', 'Name', 'Account Type']}
        count={tab === 'journal' ? filteredJournal.length : filteredCoa.length}
        onExport={handleBulkExport}
        onAdvancedFilter={() => setAdvancedFilterOpen(true)}
        filters={
          <>
            {tab === 'journal' ? (
              <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterRefType} onChange={e=>setFilterRefType(e.target.value)}>
                <option value="">All Ref Types</option>
                <option value="JE">JE (Manual Adjustments)</option>
                <option value="REQ">REQ (Request Disbursements)</option>
                <option value="BCH">BCH (Repayments)</option>
              </select>
            ) : (
              <select className="h-9 bg-white border border-slate-200 rounded-lg text-slate-700 px-3 py-0 text-[13px] outline-none shadow-sm font-medium focus:border-blue-500" value={filterAccountType} onChange={e=>setFilterAccountType(e.target.value)}>
                <option value="">All Types</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            )}
          </>
        }
      />

      {/* Selected Action Bars */}
      {tab === 'journal' && selectedJournal.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selectedJournal.length}</span>
            <span className="text-[12.5px] font-semibold text-blue-800">Journal entries selected for bulk actions</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="success" onClick={handleBulkJournalVerify}>
              ✓ Mark Verified &amp; Reconciled
            </Button>
            <Button size="sm" variant="default" onClick={handleBulkJournalExport}>
              📥 Export Selected ({selectedJournal.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedJournal([])} className="!text-slate-500 hover:!bg-slate-200">
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {tab === 'coa' && selectedCoa.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-4 animate-slide-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full font-mono">{selectedCoa.length}</span>
            <span className="text-[12.5px] font-semibold text-blue-800">Chart of Accounts selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white border border-slate-200 text-[11px] px-2.5 py-1 rounded-lg font-mono font-medium text-slate-700 shadow-sm flex items-center gap-1.5">
              <span>Selected Balance:</span>
              <strong className={selectedTrialDr === selectedTrialCr ? "text-emerald-600" : "text-amber-600"}>
                {selectedTrialDr === selectedTrialCr ? "BALANCED" : "IMBALANCE"}
              </strong>
              <span className="text-slate-400">|</span>
              <span>Dr {fmt(selectedTrialDr)}</span>
              <span className="text-slate-300">/</span>
              <span>Cr {fmt(selectedTrialCr)}</span>
            </div>
            <Button size="sm" variant="default" onClick={handleBulkCoaExport}>
              📥 Export Selected ({selectedCoa.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedCoa([])} className="!text-slate-500 hover:!bg-slate-200">
              Deselect All
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
        {tab === 'journal' ? (
          <>
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedJournal.length === filteredJournal.length && filteredJournal.length > 0} onChange={() => toggleAllJournal(filteredJournal.map(x=>x.id))} /></th>
                  <th className="px-4 py-3">Entry</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Debit Account</th><th className="px-4 py-3">Credit Account</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredJournal.map(j => (
                  <tr key={j.id} className={selectedJournal.includes(j.id) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4"><input type="checkbox" checked={selectedJournal.includes(j.id)} onChange={() => toggleJournal(j.id)} /></td>
                    <td className="font-mono text-[12px] text-text-dim">{j.id}</td>
                    <td className="font-mono text-[12px] text-text-dim">{j.date}</td>
                    <td className="font-mono text-[12px] text-text-dim">{j.ref}</td>
                    <td>{j.desc}</td>
                    <td><span className="text-blue-700 font-medium">{j.debit}</span></td>
                    <td><span className="text-slate-600">{j.credit}</span></td>
                    <td className="text-right font-mono text-[12px] font-semibold text-slate-900">{fmt(j.amount)}</td>
                    <td className="text-right pr-4">
                      <Button size="sm" variant="ghost" onClick={() => setDetailJournal(j)}>Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination total={filteredJournal.length} maxPerPage={100} />
          </>
        ) : (
          <>
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedCoa.length === filteredCoa.length && filteredCoa.length > 0} onChange={() => toggleAllCoa(filteredCoa.map(x=>x.code))} /></th>
                  <th className="px-4 py-3">Code</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th><th className="px-4 py-3 text-right">Net</th><th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredCoa.map(a => (
                  <tr key={a.code} className={selectedCoa.includes(a.code) ? 'bg-blue-50/50' : ''}>
                    <td className="px-4"><input type="checkbox" checked={selectedCoa.includes(a.code)} onChange={() => toggleCoa(a.code)} /></td>
                    <td className="font-mono text-[12px] text-text-dim">{a.code}</td>
                    <td><strong>{a.name}</strong></td>
                    <td><Badge color={{Asset:'blue',Liability:'amber',Income:'green',Expense:'red'}[a.type] || 'grey'}>{a.type}</Badge></td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(a.debit)}</td>
                    <td className="text-right font-mono text-[12px] text-text-dim">{fmt(a.credit)}</td>
                    <td className="text-right font-mono text-[12px] font-semibold text-slate-900">{fmt(a.net)}</td>
                    <td className="text-right pr-4">
                      <Button size="sm" variant="ghost" onClick={() => setDetailCoa(a)}>Ledger Card</Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td colSpan={4} className="font-bold border-t border-slate-200 text-right px-4 py-3">Trial Balance Total</td>
                  <td className="text-right font-mono border-t border-slate-200 text-[12px] px-4 py-3">{fmt(totalDr)}</td>
                  <td className="text-right font-mono border-t border-slate-200 text-[12px] px-4 py-3">{fmt(totalCr)}</td>
                  <td className={`text-right font-mono border-t border-slate-200 text-[12px] px-4 py-3 ${totalDr === totalCr ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalDr === totalCr ? '✓ BALANCED' : '⚠ IMBALANCE'}
                  </td>
                  <td className="border-t border-slate-200"></td>
                </tr>
              </tbody>
            </table>
            <TablePagination total={filteredCoa.length} maxPerPage={100} />
          </>
        )}
      </div>

      {/* Advanced Filters Drawer */}
      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine accounting journals</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Min Value</label>
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
                placeholder="0" 
                value={minAmount}
                onChange={e => setMinAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Max Value</label>
              <input 
                type="number" 
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
                placeholder="Any" 
                value={maxAmount}
                onChange={e => setMaxAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Start Date</label>
            <input 
              type="date" 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">End Date</label>
            <input 
              type="date" 
              className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)} className="flex-1">Apply Filters</Button>
            <Button variant="ghost" onClick={() => {
              setMinAmount('');
              setMaxAmount('');
              setStartDate('');
              setEndDate('');
              setFilterAccountType('');
              setFilterRefType('');
              setAdvancedFilterOpen(false);
            }}>Reset All</Button>
          </div>
        </div>
      </Drawer>

      {/* Manual Journal Posting Drawer */}
      <Drawer isOpen={postManualOpen} onClose={() => setPostManualOpen(false)} mode="right">
        <form onSubmit={handlePostManualEntry}>
          <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
            <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Post Manual Journal Entry</h2><div className="text-[11.5px] text-text-mute">Manually adjust account balances</div></div>
            <button type="button" className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setPostManualOpen(false)}>✕</button>
          </div>
          <div className="p-4.5 px-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Debit Account (Dr)</label>
              <select 
                required
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-medium cursor-pointer"
                value={manualDebit}
                onChange={e => setManualDebit(e.target.value)}
              >
                <option value="">-- Choose Account --</option>
                {data.coa.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code}) - Type: {c.type}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Credit Account (Cr)</label>
              <select 
                required
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-medium cursor-pointer"
                value={manualCredit}
                onChange={e => setManualCredit(e.target.value)}
              >
                <option value="">-- Choose Account --</option>
                {data.coa.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code}) - Type: {c.type}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Amount (MMK)</label>
              <input 
                required
                type="number"
                min="1"
                placeholder="Enter adjustment amount"
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono"
                value={manualAmount}
                onChange={e => setManualAmount(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Reference Code</label>
              <input 
                type="text"
                placeholder="e.g. JE-MANUAL-01"
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono"
                value={manualRef}
                onChange={e => setManualRef(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Posting Date</label>
              <input 
                required
                type="date"
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Description / Narrative</label>
              <textarea 
                required
                placeholder="Justification or audit comment..."
                className="h-20 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 p-2.5 text-[12.5px] outline-none focus:border-blue-500 resize-none"
                value={manualDesc}
                onChange={e => setManualDesc(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-4 pt-2">
              <Button type="submit" variant="primary" className="flex-1">Post Ledger Entry</Button>
              <Button type="button" variant="ghost" onClick={() => setPostManualOpen(false)}>Cancel</Button>
            </div>
          </div>
        </form>
      </Drawer>

      {/* Create Account Drawer */}
      <Drawer isOpen={addAccountOpen} onClose={() => setAddAccountOpen(false)} mode="right">
        <form onSubmit={handleCreateAccount}>
          <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
            <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Create Chart of Accounts Account</h2><div className="text-[11.5px] text-text-mute">Define a new ledger control code</div></div>
            <button type="button" className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAddAccountOpen(false)}>✕</button>
          </div>
          <div className="p-4.5 px-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Account Code</label>
              <input 
                required
                type="text"
                placeholder="e.g. 1300, L10002"
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-mono"
                value={newAccCode}
                onChange={e => setNewAccCode(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Account Name</label>
              <input 
                required
                type="text"
                placeholder="e.g. Security Deposits Escrow"
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-sans"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] text-slate-500 font-bold uppercase tracking-[.05em]">Account Type</label>
              <select 
                required
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 px-2.5 text-[12.5px] outline-none focus:border-blue-500 font-medium cursor-pointer"
                value={newAccType}
                onChange={e => setNewAccType(e.target.value as any)}
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div className="flex gap-2 mt-4 pt-2">
              <Button type="submit" variant="primary" className="flex-1">Create Account Code</Button>
              <Button type="button" variant="ghost" onClick={() => setAddAccountOpen(false)}>Cancel</Button>
            </div>
          </div>
        </form>
      </Drawer>

      {/* Journal Entry Details Drawer */}
      <Drawer isOpen={!!detailJournal} onClose={() => setDetailJournal(null)} mode="right">
        {detailJournal && (
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
                <div>
                  <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Journal Entry Detail</h2>
                  <div className="text-[11.5px] text-text-mute">Verified Dual-Entry Breakdown</div>
                </div>
                <button type="button" className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setDetailJournal(null)}>✕</button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-xs">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Entry Identifier</span>
                    <strong className="text-slate-700 font-mono text-[13px]">{detailJournal.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Reconciliation Reference</span>
                    <strong className="text-slate-700 font-mono text-[13px]">{detailJournal.ref}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Posting Date</span>
                    <strong className="text-slate-700 font-mono text-[13px]">{detailJournal.date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Amount Value</span>
                    <strong className="text-blue-700 font-mono text-[13px]">{mmk(detailJournal.amount)}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Narrative / Memo</span>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-700 text-xs leading-relaxed italic">
                    "{detailJournal.desc}"
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Double-Entry Balancing Sheet</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 p-2.5">
                      <span>Account</span>
                      <span className="text-right">Debit (Dr)</span>
                      <span className="text-right">Credit (Cr)</span>
                    </div>
                    <div className="grid grid-cols-3 p-2.5 border-b border-slate-100 font-medium">
                      <span className="text-blue-700 truncate">{detailJournal.debit}</span>
                      <span className="text-right font-mono text-slate-900">{fmt(detailJournal.amount)}</span>
                      <span className="text-right font-mono text-slate-300">0</span>
                    </div>
                    <div className="grid grid-cols-3 p-2.5 font-medium">
                      <span className="text-slate-600 truncate">{detailJournal.credit}</span>
                      <span className="text-right font-mono text-slate-300">0</span>
                      <span className="text-right font-mono text-slate-900">{fmt(detailJournal.amount)}</span>
                    </div>
                    <div className="grid grid-cols-3 p-2.5 bg-slate-50 border-t border-slate-100 font-bold text-[11px]">
                      <span>Balance Equivalence</span>
                      <span className="text-right font-mono text-emerald-600">{fmt(detailJournal.amount)}</span>
                      <span className="text-right font-mono text-emerald-600">{fmt(detailJournal.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-line bg-slate-50">
              <Button variant="default" className="w-full" onClick={() => setDetailJournal(null)}>
                Dismiss Details
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Account Ledger Card Drawer */}
      <Drawer isOpen={!!detailCoa} onClose={() => setDetailCoa(null)} mode="right">
        {detailCoa && (
          <div className="h-full flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
                <div>
                  <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Account Ledger Card</h2>
                  <div className="text-[11.5px] text-text-mute">{detailCoa.name} ({detailCoa.code})</div>
                </div>
                <button type="button" className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setDetailCoa(null)}>✕</button>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-[0.05em] mb-0.5">Total Debits</span>
                    <strong className="text-slate-800 font-mono text-[13px]">{fmt(detailCoa.debit)}</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-[0.05em] mb-0.5">Total Credits</span>
                    <strong className="text-slate-800 font-mono text-[13px]">{fmt(detailCoa.credit)}</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-[0.05em] mb-0.5">Net Balance</span>
                    <strong className="text-blue-700 font-mono text-[13px]">{fmt(detailCoa.net)}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block uppercase tracking-[0.05em] text-[9.5px]">Impacted Transactions Register</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold font-mono text-slate-500">
                      {getAccountLedgerEntries(detailCoa.code).length} ENTRIES
                    </span>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-50 text-[9.5px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Entry ID</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2 text-right">Dr / Cr</th>
                          <th className="px-3 py-2 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-[11.5px] text-slate-700 divide-y divide-slate-100">
                        {getAccountLedgerEntries(detailCoa.code).map(entry => {
                          const isDr = entry.debit.includes(`(${detailCoa.code})`) || entry.debit.includes(detailCoa.code);
                          return (
                            <tr key={entry.id} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 font-mono text-slate-500">{entry.date}</td>
                              <td className="px-3 py-2.5 font-mono text-blue-600 font-medium">{entry.id}</td>
                              <td className="px-3 py-2.5 font-medium truncate max-w-[120px]" title={entry.desc}>{entry.desc}</td>
                              <td className="px-3 py-2.5 text-right font-semibold">
                                {isDr ? <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px]">DEBIT</span> : <span className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-[10px]">CREDIT</span>}
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono text-slate-900">{fmt(entry.amount)}</td>
                            </tr>
                          );
                        })}
                        {getAccountLedgerEntries(detailCoa.code).length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center text-slate-400 py-6 italic">No posted journal items impact this account.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-line bg-slate-50">
              <Button variant="default" className="w-full" onClick={() => setDetailCoa(null)}>
                Dismiss Ledger Card
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
