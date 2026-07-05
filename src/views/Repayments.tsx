import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, Badge, Drawer, TableToolbar, TablePagination } from '../components/UI';
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Coins, 
  FileText, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Search,
  Check,
  FileCheck,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function Repayments() {
  const { data, updateData } = useData();
  const [activeSubTab, setActiveSubTab] = useState('settlements');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for interactive actions
  const [selectedRepayId, setSelectedRepayId] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isSubmitRepayOpen, setIsSubmitRepayOpen] = useState(false);
  const [isMapSuspenseOpen, setIsMapSuspenseOpen] = useState(false);
  
  // Form states for submitting new repayment
  const [repayCorp, setRepayCorp] = useState('CORP-001');
  const [repayAmount, setRepayAmount] = useState('512500');
  const [repayBankRef, setRepayBankRef] = useState('KBZ-DEP-773012');
  const [repayMethod, setRepayMethod] = useState('KBZ Direct Transfer');
  const [repayProofFile, setRepayProofFile] = useState('repayment_slip_shwe_june.pdf');

  // Suspense mapping form
  const [suspenseId, setSuspenseId] = useState('');
  const [suspenseCorp, setSuspenseCorp] = useState('CORP-001');

  // Format selections for file exports
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportBranch, setExportBranch] = useState('All');

  // Handler for Maker-Checker Verification (releasing batch/repayment & posting GL)
  const handleVerifyRepayment = (batchId: string) => {
    // 1. Update the batch status to 'MATCHED'
    const updatedBatches = data.batches.map((b: any) => {
      if (b.id === batchId) {
        return {
          ...b,
          status: 'MATCHED',
          coverage: 100.0,
          received: b.invoice || b.expected + b.lateFees
        };
      }
      return b;
    });

    // 2. Simulate double entry posting inside Journal
    const targetBatch = data.batches.find((b: any) => b.id === batchId);
    if (targetBatch) {
      const newJournalEntries = [
        {
          id: `JE-REPAY-${Math.floor(Math.random() * 900000) + 100000}`,
          date: new Date().toISOString().split('T')[0],
          ref: batchId,
          desc: `Approved Corporate Repayment - ${targetBatch.corp}`,
          debit: 'Cash / Bank (1100)',
          credit: 'Advance Receivable (1200)',
          amount: targetBatch.expected
        }
      ];

      if (targetBatch.lateFees > 0) {
        newJournalEntries.push({
          id: `JE-REPAY-LF-${Math.floor(Math.random() * 900000) + 100000}`,
          date: new Date().toISOString().split('T')[0],
          ref: batchId,
          desc: `Late fee collections realized - ${targetBatch.corp}`,
          debit: 'Cash / Bank (1100)',
          credit: 'Late Fee Revenue (4200)',
          amount: targetBatch.lateFees
        });
      }

      // Update global context
      updateData({
        batches: updatedBatches,
        journal: [ ...newJournalEntries, ...data.journal ],
        // Also deduct employee outstanding amounts if this company's repayment cleared!
        employees: data.employees.map((e: any) => {
          const corpCode = targetBatch.corp.split(' ')[0];
          if (e.company === corpCode && e.status === 'PENDING_SETTLE') {
            return { ...e, outstanding: 0, status: 'ACTIVE' };
          } else if (e.company === corpCode) {
            return { ...e, outstanding: 0 };
          }
          return e;
        }),
        auditLogs: [
          {
            ts: new Date().toISOString().replace('T', ' ').substring(0, 19),
            actor: 'finance.checker@ewa',
            role: 'Finance Officer (Checker)',
            action: 'REPAYMENT_APPROVE_POST_GL',
            entity: batchId,
            detail: `Cleared invoice settlement. Posted double-entry accounting to GL accounts.`,
            ip: '10.20.4.30'
          },
          ...data.auditLogs
        ]
      });

      alert(`Verification success! Repayment approved & Dual-Aspect ledger posted to: Cash & Bank and Receivables GL.`);
    }
  };

  const handleCreateRepaymentSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCorp = data.companies.find((c: any) => c.id === repayCorp);
    if (!targetCorp) return;

    // Find all disbursements for this corporation that are currently active/disbursed and have originalRef
    const companyEmployees = data.employees.filter((e: any) => e.company === targetCorp.id);
    const relatedRefs = data.disbursements
      .filter((d: any) => {
        const empId = d.emp.split(' ')[0];
        return companyEmployees.some((e: any) => e.id === empId) && d.originalRef;
      })
      .map((d: any) => d.originalRef);

    const newBatch = {
      id: `BCH-${Math.floor(Math.random() * 9000) + 1000}`,
      corp: `${targetCorp.id} ${targetCorp.name}`,
      cycle: 'JUNE-2026',
      gl: 'GL-CLR-0041',
      expected: Number(repayAmount),
      lateFees: 0,
      invoice: Number(repayAmount),
      received: Number(repayAmount),
      ref: repayProofFile,
      relatedOriginalRefs: relatedRefs,
      ts: new Date().toISOString().replace('T', ' ').substring(0, 16),
      coverage: 100.0,
      suspense: 0,
      status: 'MATCHED' // Auto match for direct submissions in this admin simulation
    };

    const newJournal = {
      id: `JE-REPAY-${Math.floor(Math.random() * 900000) + 100000}`,
      date: new Date().toISOString().split('T')[0],
      ref: newBatch.id,
      desc: `Corporate Payroll Repayment via HR submitted proof`,
      debit: 'Cash / Bank (1100)',
      credit: 'Advance Receivable (1200)',
      amount: Number(repayAmount)
    };

    updateData({
      batches: [newBatch, ...data.batches],
      journal: [newJournal, ...data.journal],
      auditLogs: [
        {
          ts: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'admin.hr@company',
          role: 'HR Maker',
          action: 'REPAYMENT_SUBMIT',
          entity: newBatch.id,
          detail: `Repayment proof submitted. Amount: ${Number(repayAmount).toLocaleString()} MMK. Ref: ${repayBankRef}`,
          ip: '103.6.22.4'
        },
        ...data.auditLogs
      ]
    });

    setIsSubmitRepayOpen(false);
    alert('Repayment settlement submitted successfully and verified!');
  };

  const handleMapSuspense = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBatch = data.batches.find((b: any) => b.id === suspenseId);
    const targetCorp = data.companies.find((c: any) => c.id === suspenseCorp);
    if (!targetBatch || !targetCorp) return;

    // Find all disbursements for this corporation that are currently active/disbursed and have originalRef
    const companyEmployees = data.employees.filter((e: any) => e.company === targetCorp.id);
    const relatedRefs = data.disbursements
      .filter((d: any) => {
        const empId = d.emp.split(' ')[0];
        return companyEmployees.some((e: any) => e.id === empId) && d.originalRef;
      })
      .map((d: any) => d.originalRef);

    const updatedBatches = data.batches.map((b: any) => {
      if (b.id === suspenseId) {
        return {
          ...b,
          corp: `${targetCorp.id} ${targetCorp.name}`,
          status: 'MATCHED',
          expected: b.suspense,
          received: b.suspense,
          suspense: 0,
          relatedOriginalRefs: relatedRefs,
          coverage: 100.0
        };
      }
      return b;
    });

    updateData({
      batches: updatedBatches,
      auditLogs: [
        {
          ts: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'finance.checker@ewa',
          role: 'Finance Officer',
          action: 'SUSPENSE_RECONCILE',
          entity: suspenseId,
          detail: `Mapped suspense credit of ${targetBatch.suspense.toLocaleString()} MMK to ${targetCorp.name}`,
          ip: '10.20.4.30'
        },
        ...data.auditLogs
      ]
    });

    setIsMapSuspenseOpen(false);
    alert('Suspense account successfully mapped to corporate client and reconciled!');
  };

  const handleDownloadExport = (corpName: string, expectedDeduction: number) => {
    alert(`Generating ${exportFormat} payroll deduction file for ${corpName}\n- Target Branch: ${exportBranch}\n- Total expected deduction: ${expectedDeduction.toLocaleString()} MMK\n- Records processed successfully.`);
  };

  const handleWaiveLateFees = (batchId: string) => {
    const updatedBatches = data.batches.map((b: any) => {
      if (b.id === batchId) {
        return {
          ...b,
          lateFees: 0,
          invoice: b.expected
        };
      }
      return b;
    });

    updateData({
      batches: updatedBatches,
      auditLogs: [
        {
          ts: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'risk.manager@ewa',
          role: 'Risk Manager',
          action: 'WAIVE_LATE_FEES',
          entity: batchId,
          detail: `Waived accrued late penalties. Adjusted invoice to basic outstanding.`,
          ip: '10.20.4.11'
        },
        ...data.auditLogs
      ]
    });

    alert('Late fees successfully waived by Risk Officer!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return <Badge color="green">Matched &amp; Cleared</Badge>;
      case 'PARTIAL':
        return <Badge color="amber">Partial Payment (Suspended)</Badge>;
      case 'MISSING':
        return <Badge color="red">Missing (Overdue)</Badge>;
      case 'SUSPENSE':
        return <Badge color="blue">Suspense (Unidentified)</Badge>;
      default:
        return <Badge color="grey">{status}</Badge>;
    }
  };

  // Filter batches based on search
  const filteredBatches = data.batches.filter((b: any) => 
    b.corp.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Real-time calculations from data.batches
  const activeBatches = data.batches.filter((b: any) => b.status !== 'SUSPENSE');
  const totalInvoiced = activeBatches.reduce((sum: number, b: any) => sum + (b.invoice || (b.expected + b.lateFees)), 0);
  const totalReceived = activeBatches.reduce((sum: number, b: any) => sum + b.received, 0);
  const collectionSuccessRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0;
  const outstandingOverdue = totalInvoiced - totalReceived;

  const suspenseFunds = data.batches
    .filter((b: any) => b.status === 'SUSPENSE')
    .reduce((sum: number, b: any) => sum + b.received, 0);

  const totalLateFees = activeBatches.reduce((sum: number, b: any) => sum + b.lateFees, 0);

  const overdueBatches = activeBatches.filter((b: any) => b.received < (b.invoice || (b.expected + b.lateFees)));

  let bucket1to3 = 0;
  let bucket4to10 = 0;
  let bucket11to30 = 0;
  let bucket30plus = 0;

  activeBatches.forEach((b: any) => {
    const unpaid = (b.invoice || (b.expected + b.lateFees)) - b.received;
    if (unpaid > 0) {
      if (b.id === 'BCH-5502') {
        bucket1to3 += unpaid;
      } else if (b.id === 'BCH-5505') {
        bucket4to10 += unpaid;
      } else {
        if (unpaid > 500000) {
          bucket4to10 += unpaid;
        } else {
          bucket1to3 += unpaid;
        }
      }
    }
  });

  const totalOverdue = bucket1to3 + bucket4to10 + bucket11to30 + bucket30plus;

  return (
    <div className="space-y-5">
      {/* Header section with clean visual hierarchy */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0">Repayments &amp; Settlements</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setIsSubmitRepayOpen(true)}>
            <Plus size={14} className="mr-1" /> Submit Repayment Slip
          </Button>
        </div>
      </div>

      {/* Dynamic Statistics & Collection Success Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Real-Time Collection Stats Panel (LHS - 5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection Success Rate</span>
              <Badge color={collectionSuccessRate > 80 ? 'green' : collectionSuccessRate > 50 ? 'amber' : 'red'}>
                {collectionSuccessRate.toFixed(1)}% Cleared
              </Badge>
            </div>
            
            <div className="flex items-end gap-2 mb-4">
              <div className="text-2xl font-extrabold font-mono text-slate-800">{totalReceived.toLocaleString()} MMK</div>
              <div className="text-xs text-slate-400 font-medium mb-1">collected of {totalInvoiced.toLocaleString()} MMK expected</div>
            </div>

            {/* Custom SVG/CSS Gauge Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${collectionSuccessRate > 80 ? 'bg-emerald-500' : collectionSuccessRate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${collectionSuccessRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>0%</span>
                <span>50% Target</span>
                <span>100% Full Settle</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accrued Late Penalties</span>
              <span className="text-sm font-bold font-mono text-rose-600 mt-1 block">+{totalLateFees.toLocaleString()} MMK</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suspense Float</span>
              <span className="text-sm font-bold font-mono text-blue-600 mt-1 block">{suspenseFunds.toLocaleString()} MMK</span>
            </div>
          </div>
        </div>

        {/* Overdue Aging Buckets Dashboard (RHS - 7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="m-0 text-sm font-bold text-slate-800">Overdue Repayment Aging Buckets</h3>
              <p className="m-0 text-[11px] text-slate-400 mt-0.5">Real-time breakdown of outstanding balances by days past due</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Overdue: <span className="text-rose-600">{totalOverdue.toLocaleString()} MMK</span>
            </span>
          </div>

          {/* Aging Buckets Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Bucket 1: 1-3 Days */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${bucket1to3 > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50/50 border-slate-150'}`}>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1–3 Days</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Initial Warning</span>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-extrabold font-mono block ${bucket1to3 > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {bucket1to3.toLocaleString()} MMK
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  {bucket1to3 > 0 ? '1 Client Portfolio' : 'Clean'}
                </span>
              </div>
            </div>

            {/* Bucket 2: 4-10 Days */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${bucket4to10 > 0 ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/50 border-slate-150'}`}>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">4–10 Days</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Escalated Legal</span>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-extrabold font-mono block ${bucket4to10 > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {bucket4to10.toLocaleString()} MMK
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  {bucket4to10 > 0 ? '1 Client Portfolio' : 'Clean'}
                </span>
              </div>
            </div>

            {/* Bucket 3: 11-30 Days */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${bucket11to30 > 0 ? 'bg-rose-100/40 border-rose-300' : 'bg-slate-50/50 border-slate-150'}`}>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">11–30 Days</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Operations Hold</span>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-extrabold font-mono block ${bucket11to30 > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {bucket11to30.toLocaleString()} MMK
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  {bucket11to30 > 0 ? 'Action Pending' : 'Clean'}
                </span>
              </div>
            </div>

            {/* Bucket 4: 30+ Days */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${bucket30plus > 0 ? 'bg-red-100/50 border-red-300' : 'bg-slate-50/50 border-slate-150'}`}>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">30+ Days</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Write-Off Queue</span>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-extrabold font-mono block ${bucket30plus > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                  {bucket30plus.toLocaleString()} MMK
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  {bucket30plus > 0 ? 'Loss Anticipated' : 'Clean'}
                </span>
              </div>
            </div>

          </div>

          {/* Quick Warning Advice Strip */}
          <div className="mt-4.5 bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <AlertTriangle className="text-amber-500 shrink-0" size={14} />
              <span>Overdue risk thresholds reached for <strong>{overdueBatches.length} accounts</strong>. Automated interest penalties are accruing.</span>
            </div>
            <button 
              type="button"
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0" 
              onClick={() => { setActiveSubTab('reconciliation'); }}
            >
              Resolve Gaps &rarr;
            </button>
          </div>
          
        </div>
      </div>

      {/* Tabbed sub-navigation */}
      <div className="flex gap-1 border-b border-slate-200 pb-2 mb-4">
        <button 
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'settlements' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} 
          onClick={() => setActiveSubTab('settlements')}
        >
          Active Settlements &amp; Checker Approvals
        </button>
        <button 
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'deduction' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} 
          onClick={() => setActiveSubTab('deduction')}
        >
          Payroll Auto-Deduction File Export
        </button>
        <button 
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'reconciliation' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} 
          onClick={() => setActiveSubTab('reconciliation')}
        >
          Expected vs Actual Reconciliation
        </button>
        <button 
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeSubTab === 'latefees' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} 
          onClick={() => setActiveSubTab('latefees')}
        >
          Late Fee &amp; Accrual Policies
        </button>
      </div>

      {/* SUB-TAB 1: Active Settlements (Maker-Checker with GL Posting) */}
      {activeSubTab === 'settlements' && (
        <div className="space-y-4">
          <TableToolbar 
            search={searchQuery}
            setSearch={setSearchQuery}
            count={filteredBatches.length}
            onExport={() => alert('Repayments records exported.')}
            filters={<span className="text-xs text-slate-500 italic">Maker: Corporate HR Uploads Receipt • Checker: Platform Finance Verifies &amp; Posts GL</span>}
          />

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
            <table className="dt min-w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Batch ID</th>
                  <th className="px-4 py-3">Corporate Client</th>
                  <th className="px-4 py-3 text-blue-700">Linked EWA Refs</th>
                  <th className="px-4 py-3 text-right">Expected billing</th>
                  <th className="px-4 py-3 text-right">Accrued Late Fees</th>
                  <th className="px-4 py-3 text-right">Total Invoice</th>
                  <th className="px-4 py-3 text-right">Total Received</th>
                  <th className="px-4 py-3">Repayment Proof</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Checker Action</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px] text-slate-700">
                {filteredBatches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="font-mono text-[12px] text-slate-500 font-bold px-4 py-3">{b.id}</td>
                    <td className="font-semibold text-slate-800">{b.corp}</td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-[155px] py-1">
                        {b.relatedOriginalRefs && b.relatedOriginalRefs.length > 0 ? (
                          b.relatedOriginalRefs.map((r: string) => (
                            <span key={r} className="text-[9.5px] font-mono bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-bold">{r}</span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No active links</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right font-mono text-[12px] text-slate-500">
                      {b.expected > 0 ? `${b.expected.toLocaleString()} MMK` : '—'}
                    </td>
                    <td className="text-right font-mono text-[12px] text-rose-500">
                      {b.lateFees > 0 ? `+${b.lateFees.toLocaleString()} MMK` : '—'}
                    </td>
                    <td className="text-right font-mono text-[12px] font-bold text-slate-800">
                      {b.invoice > 0 ? `${b.invoice.toLocaleString()} MMK` : '—'}
                    </td>
                    <td className="text-right font-mono text-[12px] text-emerald-600 font-semibold bg-emerald-50/20 px-2">
                      {b.received > 0 ? `${b.received.toLocaleString()} MMK` : '—'}
                    </td>
                    <td>
                      {b.ref !== '—' ? (
                        <button 
                          className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          onClick={() => {
                            setSelectedRepayId(b.id);
                            setIsProofModalOpen(true);
                          }}
                        >
                          <FileText size={12} /> {b.ref}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No receipt attached</span>
                      )}
                    </td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td className="text-right pr-4">
                      {b.status === 'PARTIAL' && (
                        <div className="flex gap-1.5 justify-end">
                          <Button size="xs" variant="default" onClick={() => handleVerifyRepayment(b.id)}>
                            Approve Full Clearing
                          </Button>
                          <Button size="xs" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => alert('Escalating partial settlement to Shwe Treasury')}>
                            Escalate
                          </Button>
                        </div>
                      )}
                      {b.status === 'MISSING' && (
                        <div className="flex gap-1.5 justify-end">
                          <Button size="xs" variant="primary" onClick={() => {
                            setRepayCorp(b.corp.split(' ')[0]);
                            setRepayAmount(b.invoice);
                            setIsSubmitRepayOpen(true);
                          }}>
                            Resolve Slip
                          </Button>
                        </div>
                      )}
                      {b.status === 'SUSPENSE' && (
                        <Button size="xs" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                          setSuspenseId(b.id);
                          setIsMapSuspenseOpen(true);
                        }}>
                          Map Deposit
                        </Button>
                      )}
                      {b.status === 'MATCHED' && (
                        <span className="text-emerald-600 text-xs font-semibold flex items-center justify-end gap-1">
                          <Check size={14} /> GL Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination total={filteredBatches.length} maxPerPage={10} />
        </div>
      )}

      {/* SUB-TAB 2: Payroll Auto-Deduction File Export */}
      {activeSubTab === 'deduction' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="m-0 text-base font-bold text-slate-800">Generate Standard Salary Deduction Roster</h3>
            <p className="text-xs text-slate-500 mt-1">Export employee salary advances to feed your corporate payroll engines (SAP, Oracle, Excel, CSV). This will withhold the correct sums on payday.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Payroll Cycle</label>
              <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none">
                <option>JUNE - JULY 2026</option>
                <option>MAY - JUNE 2026</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Export Format System</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="CSV">Standard Roster (CSV)</option>
                <option value="Excel">Formatted Excel (.xlsx)</option>
                <option value="SAP">SAP ERP Pay Ledger (SAP TXT)</option>
                <option value="Oracle">Oracle Fusion HCM format</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Branch filter</label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none"
                value={exportBranch}
                onChange={(e) => setExportBranch(e.target.value)}
              >
                <option value="All">All Branches (Head + Sub Branches)</option>
                <option value="Head Office">Head Office only</option>
                <option value="Mandalay Branch">Mandalay Delivery Unit</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {data.companies.filter((c: any) => c.stage === 'ACTIVE').map((c: any) => {
              // calculate approximate total deduction for June from disbursements
              const totalAdvances = data.employees
                .filter((e: any) => e.company === c.id)
                .reduce((sum: number, cur: any) => sum + cur.outstanding, 0);

              return (
                <div key={c.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {c.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {c.name} 
                        <Badge color={c.type === 'CORPORATE' ? 'blue' : 'grey'}>{c.type}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Corporate ID: <span className="font-mono font-medium">{c.id}</span> · Whitelisted staff with EWA: {c.employees}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">June Expected Deductions</div>
                      <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
                        {totalAdvances > 0 ? `${totalAdvances.toLocaleString()} MMK` : '0 MMK'}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="default"
                      className="flex items-center gap-1.5"
                      onClick={() => handleDownloadExport(c.name, totalAdvances)}
                    >
                      <Download size={13} /> Export Deduction ({exportFormat})
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Expected vs Actual Reconciliation (Double Check) */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div>
            <h3 className="m-0 text-base font-bold text-slate-800">Exceptions &amp; Reconciliation Log</h3>
            <p className="text-xs text-slate-500 mt-1">Real-time discrepancy checks of June invoices. Discrepancies generate auto-reconciliation actions to prevent credit gaps.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex items-start gap-3">
              <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <div className="text-sm font-bold text-rose-900">Yangon Textile Union (CORP-005) - OVERDUE BY 5 DAYS</div>
                <div className="text-xs text-rose-700 leading-relaxed mt-1">
                  Expected: <span className="font-bold font-mono">1,240,000 MMK</span> plus <span className="font-bold font-mono">41,000 MMK</span> late fees (Total: 1,281,000 MMK). Received: <span className="font-bold font-mono text-rose-600">0 MMK</span>.
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="xs" variant="primary" className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => alert('SMS and Email automatic legal warnings sent to Yangon Textile Union HR.')}>
                    Send Legal Notice
                  </Button>
                  <Button size="xs" variant="ghost" className="text-slate-600 hover:bg-slate-200" onClick={() => handleWaiveLateFees('BCH-5505')}>
                    Waive Late Penalty (Allow Grace)
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-900">Nexa Tech (CORP-002) - PARTIAL PAYMENT DETECTED</div>
                <div className="text-xs text-amber-700 leading-relaxed mt-1">
                  Expected: <span className="font-bold font-mono">824,000 MMK</span> (including late fees). Received: <span className="font-bold font-mono text-emerald-600">500,000 MMK</span>. Gaps: <span className="font-bold font-mono text-rose-600">324,000 MMK</span>. EWA is currently suspended for this client's staff.
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="xs" variant="default" onClick={() => alert('Nexa Tech HR notified of outstanding gap.')}>
                    Email Nexa HR
                  </Button>
                  <Button size="xs" variant="ghost" className="text-slate-600 hover:bg-slate-200" onClick={() => handleVerifyRepayment('BCH-5502')}>
                    Force Reconcile Full Invoice
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex items-start gap-3">
              <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <div className="text-sm font-bold text-blue-900">Unidentified Deposit (BCH-5503) - SUSPENSE ACCOUNT</div>
                <div className="text-xs text-blue-700 leading-relaxed mt-1">
                  Received <span className="font-bold font-mono">50,000 MMK</span> via KBZ Direct Transfer. No matching invoice or expected settlement details found. Uploaded proof reference: <span className="font-mono">REF-44912.pdf</span>.
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="xs" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                    setSuspenseId('BCH-5503');
                    setIsMapSuspenseOpen(true);
                  }}>
                    Map to Corporate Client
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Late Fee & Accrual Policies */}
      {activeSubTab === 'latefees' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="m-0 text-base font-bold text-slate-800">Accrued Late Fee &amp; Penalty Matrix</h3>
            <p className="text-xs text-slate-500 mt-1">Review regulatory compliance and late fee policies. Overdue corporate repayment cycles trigger simple daily slab accumulations automatically.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Percent size={14} className="text-blue-500" /> Default Platform Penalty Slab
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li><strong className="text-slate-800">0.15% simple daily</strong> penalty accrues on delayed invoice outstanding after the official due date has expired.</li>
                <li><strong className="text-slate-800">Grace period:</strong> Custom parameters per company (e.g. 2-3 Days grace) before slab accumulations start.</li>
                <li><strong className="text-slate-800">EWA suspension trigger:</strong> Automatic suspension of all employee withdrawals if corporate is more than 3 days late.</li>
                <li><strong className="text-slate-800">SME Exemption:</strong> SME contracts have a flat overdue fee rate (e.g., 5,000 MMK flat) rather than a compounded slab.</li>
              </ul>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Late Fee Estimation Tester</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Invoice Principal (MMK)</label>
                    <input type="number" defaultValue="1000000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none" id="test-principal" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Days Overdue</label>
                    <input type="number" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none" id="test-days" />
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Calculated Simple Late Fee (0.15% daily):</span>
                  <span className="font-bold font-mono text-rose-600">7,500 MMK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER/MODAL: Repayment Slip / Bank Proof Upload Form */}
      <Drawer isOpen={isSubmitRepayOpen} onClose={() => setIsSubmitRepayOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Submit Repayment Settlement</h2>
            <div className="text-[11.5px] text-slate-500">Corporate HR Maker Settlement Portal</div>
          </div>
          <button className="w-[30px] h-[30px] border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shrink-0" onClick={() => setIsSubmitRepayOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleCreateRepaymentSubmission} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Select Corporate Client</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              value={repayCorp}
              onChange={(e) => setRepayCorp(e.target.value)}
            >
              {data.companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Repayment Receipt Amount (MMK)</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="e.g. 512500" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Official Bank Reference / Receipt ID</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              value={repayBankRef}
              onChange={(e) => setRepayBankRef(e.target.value)}
              placeholder="e.g. KBZ-DEP-773012" 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Payment Method Channel</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              value={repayMethod}
              onChange={(e) => setRepayMethod(e.target.value)}
            >
              <option value="KBZ Direct Transfer">KBZ Direct Transfer</option>
              <option value="CB Pay Corporate">CB Pay Corporate</option>
              <option value="Wave Money Corporate Float">Wave Money Corporate Float</option>
              <option value="Yoma Bank Corporate Transfer">Yoma Bank Corporate Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Upload Receipt Screenshot/PDF Proof (Max 10MB)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 bg-slate-50/50">
              <FileCheck className="mx-auto text-blue-500 mb-2" size={24} />
              <div className="text-xs font-semibold text-slate-700">{repayProofFile}</div>
              <div className="text-[10px] text-slate-400 mt-1">Tap to re-select local file</div>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsSubmitRepayOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1">Submit Maker Proof</Button>
          </div>
        </form>
      </Drawer>

      {/* SUSPENSE MAPPING MODAL */}
      <Drawer isOpen={isMapSuspenseOpen} onClose={() => setIsMapSuspenseOpen(false)} mode="center">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 mb-2 m-0 flex items-center gap-2">
            <Coins className="text-blue-500" size={20} /> Map Suspense Credit to Corporate Account
          </h2>
          <p className="text-xs text-slate-500 mt-0">Deduct funds from Customer Suspense Ledger and allocate credits to corresponding corporate client.</p>
          
          <form onSubmit={handleMapSuspense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Suspense Deposit Ref</label>
              <input type="text" value={suspenseId} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Target Corporate Client</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none"
                value={suspenseCorp}
                onChange={(e) => setSuspenseCorp(e.target.value)}
              >
                {data.companies.filter((c: any) => c.stage === 'ACTIVE').map((c: any) => (
                  <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsMapSuspenseOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Map &amp; Reconcile Ledger</Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* VIEW BANK RECEIPT PROOF MODAL */}
      <Drawer isOpen={isProofModalOpen} onClose={() => setIsProofModalOpen(false)} mode="center">
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
            <h3 className="m-0 text-base font-bold text-slate-800">Verifying Bank Settlement Receipt</h3>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setIsProofModalOpen(false)}>✕</button>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg text-left font-sans space-y-3">
            <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
              <span className="text-slate-400 font-semibold uppercase">Verification ID</span>
              <span className="font-mono font-bold text-slate-700">{selectedRepayId}</span>
            </div>
            
            <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
              <span className="text-slate-400 font-semibold uppercase">Channel Method</span>
              <span className="font-medium text-slate-700">KBZ Direct Corporate Banking</span>
            </div>

            <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
              <span className="text-slate-400 font-semibold uppercase">Repay Slip Document</span>
              <span className="text-blue-600 font-medium font-mono">repayment_slip_shwe_june.pdf</span>
            </div>

            {/* Mock bank slip graphic representation */}
            <div className="border border-slate-300 rounded-md p-4 bg-white shadow-inner flex flex-col items-center justify-center space-y-2 py-8 mt-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-14 h-14 border-4 border-emerald-200 rounded-full flex items-center justify-center text-[10px] uppercase font-bold text-emerald-400/80 rotate-12">
                Verified
              </div>
              <ShieldCheck className="text-emerald-500" size={32} />
              <div className="text-xs font-bold text-slate-700">KANBAWZA BANK LTD</div>
              <div className="text-[10px] text-slate-400">YANGON HEAD OFFICE BRANCH</div>
              <div className="font-mono text-sm font-extrabold text-slate-800 mt-2">521,725 MMK</div>
              <div className="text-[9px] text-slate-400 mt-1">TRANSACTION REF ID: KBZ/DEP/9938101</div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsProofModalOpen(false)}>Close View</Button>
            <Button 
              variant="primary" 
              className="flex-1" 
              onClick={() => {
                if (selectedRepayId) {
                  handleVerifyRepayment(selectedRepayId);
                }
                setIsProofModalOpen(false);
              }}
            >
              Authorize Settlement (Post GL)
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
