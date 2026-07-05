import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, Badge, Drawer, Toggle, TableToolbar, TablePagination } from '../components/UI';
import { Settings, Plus, Percent, ShieldCheck, User, Building, Trash2 } from 'lucide-react';

const initialFees = [
  { id: 'CFG-F01', name: 'Standard Tier A Fee', type: 'Flat Fee', payer: 'Receiver (Employee)', value: '1,500 MMK', details: 'Fixed fee per transaction', condition: 'Txn < 100,000', status: 'ACTIVE' },
  { id: 'CFG-F02', name: 'Standard Tier B Fee', type: 'Percentage', payer: 'Receiver (Employee)', value: '2.5%', details: '2.5% of request principal', condition: 'Txn >= 100,000', status: 'ACTIVE' },
  { id: 'CFG-F03', name: 'SME Corporate Coverage', type: 'Range Tier', payer: 'Sender (Corporate)', value: 'Tier Brackets', details: '0-50k: 1,000 | 50k-100k: 1,800 | 100k+: 2.5%', condition: 'SME entities only', status: 'ACTIVE' },
  { id: 'CFG-D01', name: 'Holiday Promo (April)', type: 'Discount', payer: 'Receiver (Employee)', value: '-500 MMK', details: 'Deduct 500 MMK from fee', condition: 'Date inside April', status: 'INACTIVE' }
];

const mockLimits = [
  { id: 'CFG-L01', name: 'Max Monthly Txn', type: 'Velocity', value: '4 Txns / cycle', condition: 'REJECT', status: 'ACTIVE' },
  { id: 'CFG-L02', name: 'High Amount Flag', type: 'Amount Limit', value: '> 500,000 MMK', condition: 'MANUAL_REVIEW', status: 'ACTIVE' },
  { id: 'CFG-L03', name: 'Min Tenure Req', type: 'Tenure', value: '< 3 Months', condition: 'REJECT', status: 'ACTIVE' }
];

export default function ConfigSystem() {
  const { data, updateData, addToast, pushAudit } = useData();
  const [tab, setTab] = useState('fees');
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);

  // --- MULTI-TENANT EWA CONFIG-DRIVEN RULE ENGINE STATES ---
  const [activeScope, setActiveScope] = useState<'SYSTEM_GLOBAL' | 'CORP-001' | 'CORP-002' | 'EMP-0045'>('SYSTEM_GLOBAL');
  
  const [systemGlobalConfig, setSystemGlobalConfig] = useState<any>({
    tenant_id: "SYSTEM_GLOBAL",
    config_version: "1.0.4",
    limits: {
      max_withdrawal_percentage: 0.5,
      max_absolute_amount_per_day: 500000,
      min_withdrawal_allowed: 10000,
      max_transactions_per_cycle: 4
    },
    fee_matrix: {
      channels: {
        kbzpay: { fee_type: "flat", value: 1500 },
        wavepay: { fee_type: "flat", value: 2000 },
        cbpay: { fee_type: "percentage", value: 0.015 },
        bank_transfer: { fee_type: "percentage", value: 0.02 }
      },
      tenant_subsidy: true
    },
    workflow_triggers: {
      auto_approve_threshold: 300000,
      maker_checker_required: true
    }
  });

  const [tenantConfigs, setTenantConfigs] = useState<Record<string, any>>({
    'CORP-001': {
      limits: {
        max_withdrawal_percentage: 0.5,
        max_absolute_amount_per_day: 600000,
        min_withdrawal_allowed: 10000,
        max_transactions_per_cycle: 5
      },
      fee_matrix: {
        channels: {
          kbzpay: { fee_type: "flat", value: 1000 },
          wavepay: { fee_type: "flat", value: 1800 }
        },
        tenant_subsidy: true
      }
    },
    'CORP-002': {
      limits: {
        max_withdrawal_percentage: 0.3,
        min_withdrawal_allowed: 20000,
        max_absolute_amount_per_day: 300000,
        max_transactions_per_cycle: 2
      },
      fee_matrix: {
        channels: {
          kbzpay: { fee_type: "flat", value: 2500 }
        },
        tenant_subsidy: false
      },
      workflow_triggers: {
        auto_approve_threshold: 150000,
        maker_checker_required: true
      }
    }
  });

  const [employeeConfigs, setEmployeeConfigs] = useState<Record<string, any>>({
    'EMP-0045': {
      limits: {
        max_withdrawal_percentage: 0.6,
        max_absolute_amount_per_day: 800000,
        min_withdrawal_allowed: 5000,
        max_transactions_per_cycle: 6
      }
    }
  });

  const getRawConfigForScope = (scope: string) => {
    if (scope === 'SYSTEM_GLOBAL') return systemGlobalConfig;
    if (scope === 'CORP-001') return tenantConfigs['CORP-001'];
    if (scope === 'CORP-002') return tenantConfigs['CORP-002'];
    return employeeConfigs['EMP-0045'];
  };

  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(systemGlobalConfig, null, 2));
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [isDraftModified, setIsDraftModified] = useState(false);
  const [checkerRemark, setCheckerRemark] = useState('');

  const [versionHistory, setVersionHistory] = useState<any[]>([
    {
      version: '1.0.4',
      ts: '2026-07-04 18:30',
      author: 'nandar.hlaing@ewa.platform',
      config: {
        tenant_id: "SYSTEM_GLOBAL",
        config_version: "1.0.4",
        limits: {
          max_withdrawal_percentage: 0.5,
          max_absolute_amount_per_day: 500000,
          min_withdrawal_allowed: 10000,
          max_transactions_per_cycle: 4
        },
        fee_matrix: {
          channels: {
            kbzpay: { fee_type: "flat", value: 1500 },
            wavepay: { fee_type: "flat", value: 2000 },
            cbpay: { fee_type: "percentage", value: 0.015 },
            bank_transfer: { fee_type: "percentage", value: 0.02 }
          },
          tenant_subsidy: true
        },
        workflow_triggers: {
          auto_approve_threshold: 300000,
          maker_checker_required: true
        }
      }
    },
    {
      version: '1.0.3',
      ts: '2026-06-15 09:12',
      author: 'kyaw.thiha@ewa.platform',
      config: {
        tenant_id: "SYSTEM_GLOBAL",
        config_version: "1.0.3",
        limits: {
          max_withdrawal_percentage: 0.4,
          max_absolute_amount_per_day: 400000,
          min_withdrawal_allowed: 15000,
          max_transactions_per_cycle: 3
        },
        fee_matrix: {
          channels: {
            kbzpay: { fee_type: "flat", value: 2000 },
            wavepay: { fee_type: "flat", value: 2500 },
            cbpay: { fee_type: "percentage", value: 0.02 },
            bank_transfer: { fee_type: "percentage", value: 0.025 }
          },
          tenant_subsidy: false
        },
        workflow_triggers: {
          auto_approve_threshold: 200000,
          maker_checker_required: true
        }
      }
    }
  ]);

  const handleScopeChange = (scope: any) => {
    setActiveScope(scope);
    const cfg = getRawConfigForScope(scope);
    setJsonText(JSON.stringify(cfg, null, 2));
    setJsonValidationError(null);
    setIsDraftModified(false);
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setIsDraftModified(true);
    try {
      const parsed = JSON.parse(val);
      if (activeScope === 'SYSTEM_GLOBAL') {
        if (!parsed.tenant_id) throw new Error("Missing required field: tenant_id");
        if (!parsed.config_version) throw new Error("Missing required field: config_version");
        if (!parsed.limits) throw new Error("Missing limits configuration object");
        if (parsed.limits.max_withdrawal_percentage === undefined || parsed.limits.max_withdrawal_percentage < 0 || parsed.limits.max_withdrawal_percentage > 1.0) {
          throw new Error("Limits schema violation: max_withdrawal_percentage must be between 0.0 and 1.0");
        }
        if (parsed.limits.max_absolute_amount_per_day === undefined || parsed.limits.max_absolute_amount_per_day <= 0) {
          throw new Error("Limits schema violation: max_absolute_amount_per_day must be positive integer");
        }
        if (parsed.limits.min_withdrawal_allowed === undefined) {
          throw new Error("Limits schema violation: min_withdrawal_allowed is required");
        }
        if (!parsed.fee_matrix || !parsed.fee_matrix.channels) {
          throw new Error("Fee matrix channels mapping is required");
        }
        if (parsed.fee_matrix.tenant_subsidy === undefined) {
          throw new Error("Fee matrix: tenant_subsidy toggle is required (boolean)");
        }
        if (!parsed.workflow_triggers || parsed.workflow_triggers.auto_approve_threshold === undefined) {
          throw new Error("Workflow triggers: auto_approve_threshold is required");
        }
      } else {
        if (parsed.limits?.max_withdrawal_percentage !== undefined && (parsed.limits.max_withdrawal_percentage < 0 || parsed.limits.max_withdrawal_percentage > 1.0)) {
          throw new Error("Limits schema violation: max_withdrawal_percentage must be between 0.0 and 1.0");
        }
      }
      setJsonValidationError(null);
    } catch (err: any) {
      setJsonValidationError(err.message);
    }
  };

  const handleDeployDraft = () => {
    if (jsonValidationError) {
      addToast('Validation Failure', 'Cannot deploy draft with validation errors.', 'error');
      return;
    }
    if (!checkerRemark.trim()) {
      addToast('Auditing Enforced', '🛑 COMPLIANCE REQUIREMENT: You must provide a specific Maker-Checker justifying comment before deploying configuration changes.', 'error');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (activeScope === 'SYSTEM_GLOBAL') {
        const nextVerNum = Number(systemGlobalConfig.config_version.split('.')[2]) + 1;
        const nextVersion = `1.0.${nextVerNum}`;
        const updatedGlobal = { ...parsed, config_version: nextVersion };
        setSystemGlobalConfig(updatedGlobal);
        
        const newHistory = {
          version: nextVersion,
          ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
          author: 'kyaw.thiha@ewa.platform (Checker)',
          config: updatedGlobal
        };
        setVersionHistory(prev => [newHistory, ...prev]);
        setJsonText(JSON.stringify(updatedGlobal, null, 2));
        
        pushAudit('CONFIG_DEPLOY', 'SYSTEM_GLOBAL', `Deployed config version ${nextVersion}. Justification: ${checkerRemark}`);
        addToast('Configuration Deployed', `Successfully released core system configuration version ${nextVersion}`, 'ok');
      } else if (activeScope === 'CORP-001' || activeScope === 'CORP-002') {
        setTenantConfigs(prev => ({ ...prev, [activeScope]: parsed }));
        pushAudit('CONFIG_DEPLOY', activeScope, `Updated corporate overrides. Justification: ${checkerRemark}`);
        addToast('Corporate Policy Updated', `Successfully deployed overrides for ${activeScope}`, 'ok');
      } else {
        setEmployeeConfigs(prev => ({ ...prev, [activeScope]: parsed }));
        pushAudit('CONFIG_DEPLOY', activeScope, `Updated individual employee overrides. Justification: ${checkerRemark}`);
        addToast('Employee Policy Updated', `Successfully deployed overrides for Kaung Htet Min`, 'ok');
      }

      setIsDraftModified(false);
      setCheckerRemark('');
    } catch (err: any) {
      addToast('Error saving config', err.message, 'error');
    }
  };

  const handleRollback = (hist: any) => {
    setSystemGlobalConfig(hist.config);
    setJsonText(JSON.stringify(hist.config, null, 2));
    setJsonValidationError(null);
    setIsDraftModified(false);
    
    pushAudit('CONFIG_ROLLBACK', 'SYSTEM_GLOBAL', `Instant rollback triggered to config version ${hist.version}`);
    addToast('Rollback Executed', `Core system config reverted back to version ${hist.version}`, 'warn');
  };

  // Inheritance Resolver: Employee -> Tenant -> System Global Defaults
  const resolveInheritedConfig = (empId: string) => {
    const emp = data.employees.find(e => e.id === empId);
    if (!emp) return { config: systemGlobalConfig, sources: {} };

    const tenantId = emp.company;
    const empOverride = employeeConfigs[empId] || {};
    const tenantOverride = tenantConfigs[tenantId] || {};

    const sources: Record<string, string> = {};

    const resolveValue = (path: string, defaultValue: any) => {
      const keys = path.split('.');
      
      let currentVal: any = empOverride;
      for (const k of keys) {
        currentVal = currentVal?.[k];
      }
      if (currentVal !== undefined) {
        sources[path] = `Employee Override (${empId})`;
        return currentVal;
      }

      currentVal = tenantOverride;
      for (const k of keys) {
        currentVal = currentVal?.[k];
      }
      if (currentVal !== undefined) {
        sources[path] = `Tenant Override (${tenantId})`;
        return currentVal;
      }

      sources[path] = 'System Platform Default';
      currentVal = systemGlobalConfig;
      for (const k of keys) {
        currentVal = currentVal?.[k];
      }
      return currentVal !== undefined ? currentVal : defaultValue;
    };

    const resolved = {
      tenant_id: tenantId,
      config_version: systemGlobalConfig.config_version,
      limits: {
        max_withdrawal_percentage: resolveValue('limits.max_withdrawal_percentage', 0.5),
        max_absolute_amount_per_day: resolveValue('limits.max_absolute_amount_per_day', 500000),
        min_withdrawal_allowed: resolveValue('limits.min_withdrawal_allowed', 10000),
        max_transactions_per_cycle: resolveValue('limits.max_transactions_per_cycle', 4)
      },
      fee_matrix: {
        channels: {
          kbzpay: {
            fee_type: resolveValue('fee_matrix.channels.kbzpay.fee_type', 'flat'),
            value: resolveValue('fee_matrix.channels.kbzpay.value', 1500)
          },
          wavepay: {
            fee_type: resolveValue('fee_matrix.channels.wavepay.fee_type', 'flat'),
            value: resolveValue('fee_matrix.channels.wavepay.value', 2000)
          },
          cbpay: {
            fee_type: resolveValue('fee_matrix.channels.cbpay.fee_type', 'percentage'),
            value: resolveValue('fee_matrix.channels.cbpay.value', 0.015)
          },
          bank_transfer: {
            fee_type: resolveValue('fee_matrix.channels.bank_transfer.fee_type', 'percentage'),
            value: resolveValue('fee_matrix.channels.bank_transfer.value', 0.02)
          }
        },
        tenant_subsidy: resolveValue('fee_matrix.tenant_subsidy', true)
      },
      workflow_triggers: {
        auto_approve_threshold: resolveValue('workflow_triggers.auto_approve_threshold', 300000),
        maker_checker_required: resolveValue('workflow_triggers.maker_checker_required', true)
      }
    };

    return { config: resolved, sources };
  };

  // --- SIMULATOR STATE ---
  const [simEmpId, setSimEmpId] = useState('EMP-0045');
  const [simAmountText, setSimAmountText] = useState('150000');
  const [simChannel, setSimChannel] = useState('kbzpay');
  const [simPrevTxns, setSimPrevTxns] = useState(1);
  const [simApiFailure, setSimApiFailure] = useState(false);
  const [simAccrualPercent, setSimAccrualPercent] = useState(50);
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [simStatus, setSimStatus] = useState<'IDLE' | 'EVALUATED' | 'COMMITTED_SUCCESS' | 'COMMITTED_FAILURE'>('IDLE');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const runEvaluation = (silent = false) => {
    const emp = data.employees.find(e => e.id === simEmpId);
    if (!emp) return null;

    const amount = Number(simAmountText) || 0;
    const { config: activeRules, sources } = resolveInheritedConfig(simEmpId);

    const logs: string[] = [];
    logs.push(`[INIT] Loading active configuration version: v${activeRules.config_version}`);
    logs.push(`[INIT] Selected Employee: ${emp.name} (${emp.id})`);
    logs.push(`[INIT] Parent Tenant: ${data.companies.find(c => c.id === emp.company)?.name || emp.company}`);

    const baseSalary = emp.salary;
    const accruedSalary = Math.round(baseSalary * (simAccrualPercent / 100));
    logs.push(`[CALC] Monthly Base Salary: ${baseSalary.toLocaleString()} MMK`);
    logs.push(`[CALC] Current Simulated Accrual: ${simAccrualPercent}% (${accruedSalary.toLocaleString()} MMK)`);

    const outstanding = emp.outstanding || 0;
    logs.push(`[CALC] Outstanding debt from previous withdrawals: ${outstanding.toLocaleString()} MMK`);

    const maxWithdrawalPct = activeRules.limits.max_withdrawal_percentage;
    const maxAvailableRaw = (accruedSalary * maxWithdrawalPct) - outstanding;
    const maxAvailable = Math.max(0, Math.round(maxAvailableRaw));
    
    logs.push(`[CALC] FORMULA: Max_Available_Balance = (Accrued Salary * Max Withdrawal %) - Outstanding Balance`);
    logs.push(`[CALC] RESULT: (${accruedSalary.toLocaleString()} * ${(maxWithdrawalPct * 100).toFixed(0)}%) - ${outstanding.toLocaleString()} = ${maxAvailable.toLocaleString()} MMK`);

    let passed = true;
    let errorCode = "";
    let reason = "";

    const minAllowed = activeRules.limits.min_withdrawal_allowed;
    if (amount < minAllowed) {
      passed = false;
      errorCode = "ERR_RULE_LIMIT_EXCEEDED";
      reason = `Amount of ${amount.toLocaleString()} MMK is below minimum per-transaction floor limit of ${minAllowed.toLocaleString()} MMK.`;
      logs.push(`[RULE] ❌ FLOOR CHECK: Requested amount of ${amount.toLocaleString()} MMK is LESS than minimum threshold ${minAllowed.toLocaleString()} MMK.`);
    } else {
      logs.push(`[RULE] ✅ FLOOR CHECK: Amount exceeds floor limit of ${minAllowed.toLocaleString()} MMK.`);
    }

    if (amount > maxAvailable && passed) {
      passed = false;
      errorCode = "ERR_RULE_LIMIT_EXCEEDED";
      reason = `Requested amount exceeds dynamic available balance of ${maxAvailable.toLocaleString()} MMK.`;
      logs.push(`[RULE] ❌ AVAILABILITY CHECK: Requested ${amount.toLocaleString()} MMK is GREATER than available balance ${maxAvailable.toLocaleString()} MMK.`);
    } else if (passed) {
      logs.push(`[RULE] ✅ AVAILABILITY CHECK: Requested amount is within available limit of ${maxAvailable.toLocaleString()} MMK.`);
    }

    const dailyCeiling = activeRules.limits.max_absolute_amount_per_day;
    if (amount > dailyCeiling && passed) {
      passed = false;
      errorCode = "ERR_RULE_LIMIT_EXCEEDED";
      reason = `Requested amount exceeds daily absolute withdrawal ceiling of ${dailyCeiling.toLocaleString()} MMK.`;
      logs.push(`[RULE] ❌ DAILY CEILING BREACH: Requested ${amount.toLocaleString()} MMK is GREATER than daily ceiling of ${dailyCeiling.toLocaleString()} MMK.`);
    } else if (passed) {
      logs.push(`[RULE] ✅ DAILY CEILING CHECK: Within daily limit of ${dailyCeiling.toLocaleString()} MMK.`);
    }

    const maxTxns = activeRules.limits.max_transactions_per_cycle;
    if (simPrevTxns >= maxTxns && passed) {
      passed = false;
      errorCode = "ERR_RULE_LIMIT_EXCEEDED";
      reason = `Velocity limit breached: employee has conducted ${simPrevTxns} transactions in this cycle, exceeding the allowed velocity of ${maxTxns} transactions.`;
      logs.push(`[RULE] ❌ VELOCITY BREACH: Previous transactions (${simPrevTxns}) matches or exceeds velocity ceiling of ${maxTxns} per cycle.`);
    } else if (passed) {
      logs.push(`[RULE] ✅ VELOCITY CHECK: Cycle velocity (${simPrevTxns}/${maxTxns} withdrawals) is within safe bounds.`);
    }

    const chConfig = activeRules.fee_matrix.channels[simChannel] || { fee_type: 'flat', value: 2000 };
    let fee = 0;
    if (chConfig.fee_type === 'flat') {
      fee = chConfig.value;
      logs.push(`[FEE] Channel: ${simChannel.toUpperCase()} selected. Fee structure: Flat Fee of ${fee.toLocaleString()} MMK.`);
    } else {
      fee = Math.round(amount * chConfig.value);
      logs.push(`[FEE] Channel: ${simChannel.toUpperCase()} selected. Fee structure: Percentage Fee of ${(chConfig.value * 100).toFixed(1)}% (${fee.toLocaleString()} MMK).`);
    }

    const isSubsidized = activeRules.fee_matrix.tenant_subsidy;
    let empFee = fee;
    let tenantFee = 0;
    if (isSubsidized) {
      empFee = 0;
      tenantFee = fee;
      logs.push(`[FEE] 🏢 TENANT SUBSIDY POLICY ACTIVE: Employer absorbs 100% of user fees. Employee pays 0 MMK. Tenant Account Receivable is billed ${fee.toLocaleString()} MMK.`);
    } else {
      logs.push(`[FEE] 👤 EMPLOYEE PAID: Employee covers transaction fee. Charged ${empFee.toLocaleString()} MMK.`);
    }

    const threshold = activeRules.workflow_triggers.auto_approve_threshold;
    let workflowAction = "AUTO_APPROVED";
    if (amount > threshold) {
      workflowAction = "MANUAL_REVIEW_TRIGGERED";
      logs.push(`[WORKFLOW] ⚠️ WARNING: Amount ${amount.toLocaleString()} MMK exceeds auto-approve threshold limit of ${threshold.toLocaleString()} MMK.`);
      logs.push(`[WORKFLOW] This transaction will require manual Maker-Checker approval before final ledger release.`);
    } else {
      logs.push(`[WORKFLOW] ✅ Auto-approve parameter matches: Amount is below threshold of ${threshold.toLocaleString()} MMK.`);
    }

    const result = {
      passed,
      errorCode,
      reason,
      amount,
      fee,
      empFee,
      tenantFee,
      isSubsidized,
      maxAvailable,
      workflowAction,
      activeRules
    };

    if (!silent) {
      setTerminalLogs(logs);
      setEvaluationResult(result);
      setSimStatus('EVALUATED');
    }

    return result;
  };

  const executeSimulationCommit = () => {
    const evalRes = runEvaluation(true);
    if (!evalRes) return;

    if (!evalRes.passed) {
      addToast('Evaluation Rejected', 'Cannot commit transaction that fails policy parameters.', 'error');
      return;
    }

    const emp = data.employees.find(e => e.id === simEmpId);
    if (!emp) return;

    const company = data.companies.find(c => c.id === emp.company);
    if (!company) return;

    const amount = evalRes.amount;
    const fee = evalRes.fee;
    const empFee = evalRes.empFee;
    const tenantFee = evalRes.tenantFee;

    const logs = [...terminalLogs];
    logs.push(`[LEDGER] Policy validation passed. Dispatching execution thread...`);

    if (simApiFailure) {
      logs.push(`[GATEWAY] Contacting MoBiz disbursement API for net payout: ${(amount - empFee).toLocaleString()} MMK...`);
      logs.push(`[GATEWAY] ❌ ERROR: API Connection Timeout (504 Gateway Error)`);
      logs.push(`[REVERSAL] 🚨 CORE EXCEPTION INTERCEPTED: External partner gateway failure mid-transaction!`);
      logs.push(`[REVERSAL] Initiating instantaneous dual-entry journal rollback safeguard to balance cash books...`);

      const failedReqId = `REQ-ERR-${Math.floor(10000 + Math.random() * 90000)}`;
      const failedTx: any = {
        id: failedReqId,
        emp: `${emp.id} ${emp.name}`,
        ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
        accrued: Math.round(emp.salary * (simAccrualPercent / 100)),
        requested: amount,
        fee: fee,
        debit: amount + (evalRes.isSubsidized ? 0 : fee),
        net: amount - empFee,
        channel: simChannel === 'kbzpay' ? 'KBZPay Wallet' : simChannel === 'wavepay' ? 'WavePay Wallet' : simChannel === 'cbpay' ? 'CB Bank Acc' : 'Bank Transfer',
        ref: 'FAILED',
        originalRef: `ORG-ERR-${failedReqId}`,
        status: 'FAILED',
        error: 'GATEWAY_TIMEOUT_FAIL'
      };

      const revJeId = `JE-REV-${Math.floor(100000 + Math.random() * 900000)}`;
      const rollbackJournal: any = {
        id: revJeId,
        date: new Date().toISOString().slice(0, 10),
        ref: failedReqId,
        desc: `REVERSAL intercept — restore balance after MoBiz gateway error`,
        debit: `Advance Receivable (1200)`,
        credit: `Customer Suspense (L100000217)`,
        amount: amount + (evalRes.isSubsidized ? 0 : fee)
      };

      updateData({
        disbursements: [failedTx, ...data.disbursements],
        journal: [rollbackJournal, ...data.journal]
      });

      logs.push(`[REVERSAL] Ledger Reversal Journal Entry written: ${revJeId}`);
      logs.push(`[REVERSAL] Debited Advance Receivable (1200) for ${(amount + (evalRes.isSubsidized ? 0 : fee)).toLocaleString()} MMK`);
      logs.push(`[REVERSAL] Credited Customer Suspense (L100000217) to balance suspense books`);
      logs.push(`[STATUS] 🚨 TRANSACTION REVERSED & BLOCKED. Zero capital loss. ledger balanced.`);

      setTerminalLogs(logs);
      setSimStatus('COMMITTED_FAILURE');
      pushAudit('PARTNER_API_REVERSAL', failedReqId, `Intercepted Gateway Failure mid-transaction; committed rollback journal ${revJeId} to safeguard employee balance`);
      addToast('Transaction Intercepted', 'Partner API Timeout! Safeguard rollback completed instantly.', 'error');
    } else {
      logs.push(`[GATEWAY] Contacting MoBiz API...`);
      const successRef = `TXN-MOB-${Math.floor(10000 + Math.random() * 90000)}`;
      logs.push(`[GATEWAY] Net payout of ${(amount - empFee).toLocaleString()} MMK settled instantly to employee wallet. Ref: ${successRef}`);
      
      const newReqId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;
      const newTx: any = {
        id: newReqId,
        emp: `${emp.id} ${emp.name}`,
        ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
        accrued: Math.round(emp.salary * (simAccrualPercent / 100)),
        requested: amount,
        fee: fee,
        debit: amount + (evalRes.isSubsidized ? 0 : fee),
        net: amount - empFee,
        channel: simChannel === 'kbzpay' ? 'KBZPay Wallet' : simChannel === 'wavepay' ? 'WavePay Wallet' : simChannel === 'cbpay' ? 'CB Bank Acc' : 'Bank Transfer',
        ref: successRef,
        originalRef: `ORG-OK-${newReqId}`,
        status: evalRes.workflowAction === 'AUTO_APPROVED' ? 'DISBURSED' : 'PROCESSING',
        error: 'None'
      };

      const txnDate = new Date().toISOString().slice(0, 10);
      const debitedAmt = amount + (evalRes.isSubsidized ? 0 : fee);
      
      const journal1: any = {
        id: `JE-${Math.floor(100000 + Math.random() * 900000)}`,
        date: txnDate,
        ref: newReqId,
        desc: `EWA Disbursement — balance lock`,
        debit: `Customer Suspense (L100000217)`,
        credit: `Advance Receivable (1200)`,
        amount: debitedAmt
      };

      const journal2: any = {
        id: `JE-${Math.floor(100000 + Math.random() * 900000)}`,
        date: txnDate,
        ref: newReqId,
        desc: `EWA Transaction Fee Recognition`,
        debit: `Customer Suspense (L100000217)`,
        credit: `Fee Income (I100000101)`,
        amount: fee
      };

      const journal3: any = {
        id: `JE-${Math.floor(100000 + Math.random() * 900000)}`,
        date: txnDate,
        ref: newReqId,
        desc: `Net Cash Payout to Employee Wallet`,
        debit: `Cash / Bank (1100)`,
        credit: `Customer Suspense (L100000217)`,
        amount: amount - empFee
      };

      const newJournalList = [journal1, journal2, journal3, ...data.journal];

      const updatedEmployees = data.employees.map(e => {
        if (e.id === emp.id) {
          return { ...e, outstanding: (e.outstanding || 0) + debitedAmt };
        }
        return e;
      });

      const updatedCompanies = data.companies.map(c => {
        if (c.id === company.id) {
          return { ...c, utilized: (c.utilized || 0) + amount };
        }
        return c;
      });

      const updatedCoa = data.coa.map(ac => {
        if (ac.code === '1100') return { ...ac, credit: ac.credit + (amount - empFee), net: ac.debit - (ac.credit + amount - empFee) };
        if (ac.code === '1200') return { ...ac, debit: ac.debit + debitedAmt, net: (ac.debit + debitedAmt) - ac.credit };
        if (ac.code === 'L100000217') return { ...ac, debit: ac.debit + debitedAmt, credit: ac.credit + debitedAmt };
        if (ac.code === 'I100000101') return { ...ac, credit: ac.credit + fee, net: ac.debit - (ac.credit + fee) };
        return ac;
      });

      updateData({
        disbursements: [newTx, ...data.disbursements],
        journal: newJournalList,
        employees: updatedEmployees,
        companies: updatedCompanies,
        coa: updatedCoa
      });

      logs.push(`[LEDGER] Journal Entries successfully committed.`);
      logs.push(`[LEDGER] JE-1: Debited Customer Suspense, Credited Advance Receivable: ${debitedAmt.toLocaleString()} MMK`);
      logs.push(`[LEDGER] JE-2: Debited Customer Suspense, Credited Fee Income: ${fee.toLocaleString()} MMK`);
      logs.push(`[LEDGER] JE-3: Debited Cash/Bank, Credited Customer Suspense: ${(amount - empFee).toLocaleString()} MMK`);
      logs.push(`[LEDGER] Outstanding balance for ${emp.name} updated to: ${((emp.outstanding || 0) + debitedAmt).toLocaleString()} MMK`);
      logs.push(`[STATUS] ✅ TRANSACTION COMPLETED & DISBURSED.`);

      setTerminalLogs(logs);
      setSimStatus('COMMITTED_SUCCESS');
      
      pushAudit('EWA_SIMULATED_TX', newReqId, `Policy evaluation matched. Accrued: ${Math.round(emp.salary * (simAccrualPercent / 100))}. Requested: ${amount}. Fee: ${fee}. Disbursed successfully.`);
      addToast('Transaction Simulated', 'Earned Wage disbursed and Ledger entry recorded successfully!', 'ok');
    }
  };

  // Rule collection state
  const [feesList, setFeesList] = useState(initialFees);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);

  // --- DYNAMIC FORMULAS & TEMPLATES STATES ---
  const [customFormulas, setCustomFormulas] = useState<any[]>([
    {
      id: 'FORM-01',
      name: 'Dynamic Compound WavePay Base',
      entity: 'Employee',
      element: 'WavePay Wallet',
      formula: 'amount * percentage * flat',
      params: { percentage: 2.0, flat: 1.1, late_days: 0, tenure_months: 0, late_days_rate: 0 },
      conditions: [{ field: 'amount', operator: '>', value: 100000 }],
      resultPreview: '100,000 * 0.02 * 1.1 = 2,200 MMK'
    },
    {
      id: 'FORM-02',
      name: 'Monsoon Overdue Recovery Penalty',
      entity: 'Employee',
      element: 'All Channels',
      formula: 'amount * percentage + (late_days * late_days_rate)',
      params: { percentage: 1.0, flat: 0, late_days: 3, tenure_months: 0, late_days_rate: 800 },
      conditions: [{ field: 'late_days', operator: '>=', value: 1 }],
      resultPreview: '100,000 * 0.01 + (3 * 800) = 3,400 MMK'
    },
    {
      id: 'FORM-03',
      name: 'Corporate Split Incentive Tier',
      entity: 'Corporate (50/50 Split)',
      element: 'KBZPay Wallet',
      formula: '(amount * percentage + flat) * 0.5',
      params: { percentage: 1.5, flat: 1000, late_days: 0, tenure_months: 6, late_days_rate: 0 },
      conditions: [{ field: 'tenure_months', operator: '>=', value: 6 }],
      resultPreview: '(100,000 * 0.015 + 1000) * 0.5 = 1,250 MMK'
    }
  ]);

  const [formulaName, setFormulaName] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('Employee');
  const [selectedElement, setSelectedElement] = useState('All Channels');
  const [selectedFormulaString, setSelectedFormulaString] = useState('amount * percentage + (late_days * late_days_rate)');
  
  // Custom formula variables
  const [paramPercentage, setParamPercentage] = useState(2.0); // %
  const [paramFlat, setParamFlat] = useState(1500); // MMK
  const [paramLateDaysRate, setParamLateDaysRate] = useState(800); // MMK per late day
  const [paramTenureMonths, setParamTenureMonths] = useState(0);
  
  // Custom dynamic condition rules
  const [condField, setCondField] = useState('late_days');
  const [condOperator, setCondOperator] = useState('>=');
  const [condValue, setCondValue] = useState(1);
  
  // Interactive test sandbox inputs
  const [sandboxAmount, setSandboxAmount] = useState(150000);
  const [sandboxLateDays, setSandboxLateDays] = useState(3);
  const [sandboxTenureMonths, setSandboxTenureMonths] = useState(6);

  const evaluateFormulaResult = (formulaStr: string, amt: number, pct: number, flatVal: number, lDays: number, tenure: number, lDaysRate: number) => {
    try {
      let expr = formulaStr.toLowerCase();
      expr = expr.replace(/\bamount\b/g, String(amt));
      expr = expr.replace(/\bpercentage\b/g, String(pct / 100));
      expr = expr.replace(/\bflat\b/g, String(flatVal));
      expr = expr.replace(/\blate_days_rate\b/g, String(lDaysRate));
      expr = expr.replace(/\blate_days\b/g, String(lDays));
      expr = expr.replace(/\btenure_months\b/g, String(tenure));
      
      expr = expr.replace(/[^0-9+\-*/().\s]/g, '');
      const result = new Function(`return ${expr}`)();
      return Math.max(0, Math.round(result));
    } catch (e) {
      return 0;
    }
  };

  const handleAddFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaName.trim()) {
      addToast('Validation Error', 'Please enter a name for the custom fee formula.', 'warn');
      return;
    }
    
    const testEval = evaluateFormulaResult(selectedFormulaString, 100000, paramPercentage, paramFlat, 1, 12, paramLateDaysRate);
    if (isNaN(testEval)) {
      addToast('Math Error', 'The entered custom formula is mathematically invalid. Please check variables.', 'error');
      return;
    }

    const newFormula = {
      id: `FORM-0${customFormulas.length + 1}`,
      name: formulaName,
      entity: selectedEntity,
      element: selectedElement,
      formula: selectedFormulaString,
      params: { 
        percentage: paramPercentage, 
        flat: paramFlat, 
        late_days: 0, 
        tenure_months: 0, 
        late_days_rate: paramLateDaysRate 
      },
      conditions: [{ field: condField, operator: condOperator, value: condValue }],
      resultPreview: `${selectedFormulaString.replace('amount', '100,000').replace('percentage', String(paramPercentage / 100)).replace('flat', String(paramFlat)).replace('late_days_rate', String(paramLateDaysRate)).replace('late_days', '3').replace('tenure_months', '6')} = ${evaluateFormulaResult(selectedFormulaString, 100000, paramPercentage, paramFlat, 3, 6, paramLateDaysRate).toLocaleString()} MMK`
    };

    setCustomFormulas(prev => [newFormula, ...prev]);
    addToast('Formula Created', `Custom fee formula "${formulaName}" successfully registered to the database!`, 'ok');
    pushAudit('CREATE_FEE_FORMULA', newFormula.id, `Created dynamic formula: ${selectedFormulaString}`);
    
    // Reset inputs
    setFormulaName('');
  };

  const handleDeleteFormula = (id: string) => {
    setCustomFormulas(prev => prev.filter(f => f.id !== id));
    addToast('Formula Deleted', 'Custom formula removed from system registry.', 'ok');
    pushAudit('DELETE_FEE_FORMULA', id, `Removed dynamic fee formula`);
  };
  
  // Custom Form States for interactive parameters
  const [ruleName, setRuleName] = useState('');
  const [ruleCategory, setRuleCategory] = useState('Fee');
  const [payerType, setPayerType] = useState('Receiver (Employee)');
  const [calcType, setCalcType] = useState('Flat Fee');
  const [ruleValue, setRuleValue] = useState('1,500');
  const [ruleCondition, setRuleCondition] = useState('All transactions');
  
  // Drawer-specific Formula Builder states
  const [drawerSelectedFormulaId, setDrawerSelectedFormulaId] = useState('FORM-01');
  const [drawerFormulaCustomMode, setDrawerFormulaCustomMode] = useState(false);
  const [drawerSelectedFormulaString, setDrawerSelectedFormulaString] = useState('amount * percentage + flat');
  const [drawerParamPercentage, setDrawerParamPercentage] = useState(2.0);
  const [drawerParamFlat, setDrawerParamFlat] = useState(1500);
  const [drawerParamLateDaysRate, setDrawerParamLateDaysRate] = useState(500);
  const [drawerParamTenureMonths, setDrawerParamTenureMonths] = useState(0);
  const [drawerFormulaName, setDrawerFormulaName] = useState('');
  
  // Bracket range builders
  const [brackets, setBrackets] = useState<{ min: number; max: number; fee: string }[]>([
    { min: 0, max: 50000, fee: '1,000 MMK' },
    { min: 50001, max: 100000, fee: '2,000 MMK' }
  ]);
  const [newMin, setNewMin] = useState(100001);
  const [newMax, setNewMax] = useState(200000);
  const [newFee, setNewFee] = useState('2.5%');


  const addBracket = () => {
    setBrackets(prev => [...prev, { min: newMin, max: newMax, fee: newFee }]);
    setNewMin(newMax + 1);
    setNewMax(newMax + 100000);
  };

  const removeBracket = (index: number) => {
    setBrackets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    let finalValue = ruleValue;
    let finalDetails = '';

    if (calcType === 'Flat Fee') {
      finalValue = ruleValue.includes('MMK') ? ruleValue : `${ruleValue} MMK`;
      finalDetails = `Fixed fee of ${finalValue}`;
    } else if (calcType === 'Percentage') {
      finalValue = ruleValue.includes('%') ? ruleValue : `${ruleValue}%`;
      finalDetails = `${finalValue} of transaction principal`;
    } else if (calcType === 'Range Tier') {
      finalValue = 'Tier Brackets';
      finalDetails = brackets.map(b => `${(b.min/1000).toFixed(0)}k-${(b.max/1000).toFixed(0)}k: ${b.fee}`).join(' | ');
    } else if (calcType === 'Dynamic Formula') {
      if (drawerFormulaCustomMode) {
        finalValue = drawerSelectedFormulaString;
        finalDetails = `Custom: pct=${drawerParamPercentage}%, flat=${drawerParamFlat} MMK, late=${drawerParamLateDaysRate} MMK/d`;
      } else {
        const found = customFormulas.find(f => f.id === drawerSelectedFormulaId);
        finalValue = found ? found.formula : drawerSelectedFormulaString;
        finalDetails = found 
          ? `Template [${found.id}]: ${found.name}`
          : `Formula: ${drawerSelectedFormulaString}`;
      }
    }

    const newRule = {
      id: `CFG-F0${feesList.length + 1}`,
      name: ruleName,
      type: calcType,
      payer: payerType,
      value: finalValue,
      details: finalDetails,
      condition: ruleCondition,
      status: 'ACTIVE'
    };

    setFeesList(prev => [newRule, ...prev]);
    
    // Reset states
    setIsNewRuleOpen(false);
    setRuleName('');
    setRuleCategory('Fee');
    setPayerType('Receiver (Employee)');
    setCalcType('Flat Fee');
    setRuleValue('1,500');
    setRuleCondition('All transactions');
  };

  const toggleFee = (id: string) => setSelectedFees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllFees = (ids: string[]) => setSelectedFees(prev => prev.length === ids.length ? [] : ids);

  const [selectedLimits, setSelectedLimits] = useState<string[]>([]);
  const toggleLimit = (id: string) => setSelectedLimits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllLimits = (ids: string[]) => setSelectedLimits(prev => prev.length === ids.length ? [] : ids);

  const filteredFees = feesList.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredLimits = mockLimits.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-heading m-0 text-slate-800">System Configuration &amp; Policies</h2>
        </div>
        <Button variant="primary" onClick={() => setIsNewRuleOpen(true)}>
          <Plus size={14} className="mr-1" /> Create Rule
        </Button>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 pb-2 overflow-x-auto scrollbar-none">
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${tab === 'fees' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('fees'); setSearch(''); }}>Fees &amp; Discounts</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${tab === 'formulas' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('formulas'); setSearch(''); }}>🧮 Dynamic Formulas &amp; Templates</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${tab === 'limits' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('limits'); setSearch(''); }}>Velocity &amp; Limitations</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${tab === 'mapping' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('mapping')}>Company Mapping</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${tab === 'ruleEngine' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('ruleEngine')}>⚙️ Multi-Tenant Rule Engine</button>
      </div>

      {(tab === 'fees' || tab === 'limits') && (
        <TableToolbar 
          search={search} 
          setSearch={setSearch} 
          count={tab === 'fees' ? filteredFees.length : filteredLimits.length}
          onExport={() => alert('Exporting rule sets...')}
          onAdvancedFilter={() => setAdvancedFilterOpen(true)}
          filters={<></>}
        />
      )}

      {tab === 'fees' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
          <table className="dt min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selectedFees.length === filteredFees.length && filteredFees.length > 0} onChange={() => toggleAllFees(filteredFees.map(x=>x.id))} />
                </th>
                <th className="px-4 py-3">Rule ID</th>
                <th className="px-4 py-3">Rule Name</th>
                <th className="px-4 py-3">Charged To</th>
                <th className="px-4 py-3">Basis Type</th>
                <th className="px-4 py-3">Base Value</th>
                <th className="px-4 py-3">Policy details / Range brackets</th>
                <th className="px-4 py-3">Trigger Condition</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] text-slate-700">
              {filteredFees.map(f => (
                <tr key={f.id} className={selectedFees.includes(f.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}>
                  <td className="px-4"><input type="checkbox" checked={selectedFees.includes(f.id)} onChange={() => toggleFee(f.id)} /></td>
                  <td className="font-mono text-[12px] text-slate-500 font-bold">{f.id}</td>
                  <td className="font-semibold text-slate-800">{f.name}</td>
                  <td>
                    <span className="flex items-center gap-1">
                      {f.payer.includes('Receiver') ? (
                        <Badge color="blue"><User size={10} className="mr-0.5 inline" /> Receiver Paid</Badge>
                      ) : (
                        <Badge color="purple"><Building size={10} className="mr-0.5 inline" /> Sender Paid</Badge>
                      )}
                    </span>
                  </td>
                  <td className="font-medium text-slate-600">{f.type}</td>
                  <td className="font-mono text-[12px] text-slate-800 font-bold">{f.value}</td>
                  <td className="text-slate-500 max-w-[320px] truncate" title={f.details}>{f.details}</td>
                  <td className="text-slate-500 font-medium">{f.condition}</td>
                  <td><Badge color={f.status === 'ACTIVE' ? 'green' : 'grey'}>{f.status}</Badge></td>
                  <td className="text-right pr-4"><Button size="sm">Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination total={filteredFees.length} maxPerPage={100} />
        </div>
      )}

      {tab === 'formulas' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
              <Percent size={320} />
            </div>
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-blue-500/30">
                Advanced Math &amp; Repayment Rules
              </span>
              <h3 className="text-xl font-bold font-heading m-0 text-white">Dynamic Fee Formulas &amp; Parametric Templates</h3>
              <p className="text-xs text-blue-100/80 leading-relaxed m-0">
                Configure advanced compound transaction fees, late grace period penalties, and tenure-based loyalty rewards. Define custom mathematical models using real-time variable tags like <code className="bg-blue-950/40 text-blue-300 font-mono text-[10.5px] px-1 py-0.5 rounded">amount</code>, <code className="bg-blue-950/40 text-blue-300 font-mono text-[10.5px] px-1 py-0.5 rounded">percentage</code>, <code className="bg-blue-950/40 text-blue-300 font-mono text-[10.5px] px-1 py-0.5 rounded">flat</code>, and <code className="bg-blue-950/40 text-blue-300 font-mono text-[10.5px] px-1 py-0.5 rounded">late_days</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left side: Custom Formula Builder */}
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <span className="text-lg">🎛️</span>
                <h3 className="m-0 text-sm font-bold text-slate-700">Dynamic Rule &amp; Formula Creator</h3>
              </div>

              <form onSubmit={handleAddFormula} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Formula Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Late Overdue Surcharge"
                    value={formulaName}
                    onChange={(e) => setFormulaName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Payer Entity</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                      value={selectedEntity}
                      onChange={(e) => setSelectedEntity(e.target.value)}
                    >
                      <option value="Employee">Employee (Receiver)</option>
                      <option value="Corporate">Corporate (Sender)</option>
                      <option value="Corporate (50/50 Split)">Corporate (50/50 Split)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Channel</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                      value={selectedElement}
                      onChange={(e) => setSelectedElement(e.target.value)}
                    >
                      <option value="All Channels">All Channels</option>
                      <option value="KBZPay Wallet">KBZPay Wallet</option>
                      <option value="WavePay Wallet">WavePay Wallet</option>
                      <option value="CB Bank Acc">CB Bank Acc</option>
                      <option value="Standard Bank Transfer">Standard Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Formula Mathematical Template</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                      <input 
                        type="radio" 
                        name="formula_tpl" 
                        className="mt-0.5"
                        checked={selectedFormulaString === 'amount * percentage + flat'} 
                        onChange={() => setSelectedFormulaString('amount * percentage + flat')} 
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Standard Linear Flat Rate</span>
                        <code className="text-[10px] text-indigo-600 font-mono">amount * percentage + flat</code>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                      <input 
                        type="radio" 
                        name="formula_tpl" 
                        className="mt-0.5"
                        checked={selectedFormulaString === 'amount * percentage * flat'} 
                        onChange={() => setSelectedFormulaString('amount * percentage * flat')} 
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Compound Fee Multiplier</span>
                        <code className="text-[10px] text-indigo-600 font-mono">amount * percentage * flat</code>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                      <input 
                        type="radio" 
                        name="formula_tpl" 
                        className="mt-0.5"
                        checked={selectedFormulaString === 'amount * percentage + (late_days * late_days_rate)'} 
                        onChange={() => setSelectedFormulaString('amount * percentage + (late_days * late_days_rate)')} 
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Overdue Late Day Surcharge</span>
                        <code className="text-[10px] text-indigo-600 font-mono">amount * percentage + (late_days * late_days_rate)</code>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 border border-slate-100 rounded-lg bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                      <input 
                        type="radio" 
                        name="formula_tpl" 
                        className="mt-0.5"
                        checked={selectedFormulaString === '(amount * percentage) - (tenure_months * flat)'} 
                        onChange={() => setSelectedFormulaString('(amount * percentage) - (tenure_months * flat)')} 
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Loyalty Tenure Reward Deduction</span>
                        <code className="text-[10px] text-indigo-600 font-mono">(amount * percentage) - (tenure_months * flat)</code>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Parameters inputs */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5 font-sans">
                  <span className="text-[11px] font-bold text-slate-700 block">Configure Template Parameters</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Percentage factor (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold font-mono text-slate-800"
                        value={paramPercentage}
                        onChange={(e) => setParamPercentage(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Flat Fee part (MMK)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold font-mono text-slate-800"
                        value={paramFlat}
                        onChange={(e) => setParamFlat(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Late Day Rate (MMK/Day)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold font-mono text-slate-800"
                        value={paramLateDaysRate}
                        onChange={(e) => setParamLateDaysRate(Number(e.target.value))}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Loyalty Min Tenure (Mo.)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-bold font-mono text-slate-800"
                        value={paramTenureMonths}
                        onChange={(e) => setParamTenureMonths(Number(e.target.value))}
                        placeholder="e.g. 6"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditions block */}
                <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-2 font-sans">
                  <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                    ⛓️ Custom Conditional Trigger Bounds
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                        value={condField}
                        onChange={(e) => setCondField(e.target.value)}
                      >
                        <option value="late_days">Late Overdue Days</option>
                        <option value="amount">Transaction Amount</option>
                        <option value="tenure_months">Employee Tenure</option>
                      </select>
                    </div>
                    <div>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                        value={condOperator}
                        onChange={(e) => setCondOperator(e.target.value)}
                      >
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value=">">&gt;</option>
                        <option value="==">==</option>
                      </select>
                    </div>
                    <div>
                      <input 
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-mono font-bold"
                        value={condValue}
                        onChange={(e) => setCondValue(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full text-xs font-bold text-white py-2.5">
                  Save Dynamic Formula Template
                </Button>
              </form>
            </div>

            {/* Right side: Interactive Sandbox & Evaluator Calculator */}
            <div className="xl:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="m-0 text-sm font-bold text-slate-700">Dynamic Multi-Factor Fee Sandbox</h3>
                  </div>
                  <Badge color="blue">Reactive Playground</Badge>
                </div>

                <div className="p-5 space-y-5">
                  <p className="text-xs text-slate-500 m-0 leading-relaxed font-sans">
                    Test how dynamic parameters and conditional states evaluate runtime payouts. Drag sliders to simulate cash-out size, overdue delays, or employee tenure to see the live breakdown.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    {/* Sandbox Parameter Sliders */}
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Simulated Cash-out Principal:</span>
                          <span className="font-bold text-slate-800 font-mono">{(sandboxAmount).toLocaleString()} MMK</span>
                        </div>
                        <input 
                          type="range" 
                          min="10000" 
                          max="800000" 
                          step="10000"
                          className="w-full cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                          value={sandboxAmount}
                          onChange={(e) => setSandboxAmount(Number(e.target.value))}
                        />
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Repayment Overdue Delay (Late Days):</span>
                          <span className="font-bold text-amber-600 font-mono">{sandboxLateDays} Overdue Days</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="30" 
                          step="1"
                          className="w-full cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                          value={sandboxLateDays}
                          onChange={(e) => setSandboxLateDays(Number(e.target.value))}
                        />
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-semibold">Employee Contract Tenure:</span>
                          <span className="font-bold text-indigo-600 font-mono">{sandboxTenureMonths} Months</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="24" 
                          step="1"
                          className="w-full cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                          value={sandboxTenureMonths}
                          onChange={(e) => setSandboxTenureMonths(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Live Calculator Outputs Panel */}
                    <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-4.5 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Live Evaluator Output</span>
                        
                        {/* Selector to pick which formula model to evaluate in sandbox */}
                        <div className="mb-3">
                          <label className="text-[10px] text-slate-500 block mb-1">Active Sandbox Formula Model:</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700"
                            onChange={(e) => {
                              const found = customFormulas.find(f => f.id === e.target.value);
                              if (found) {
                                setSelectedFormulaString(found.formula);
                                setParamPercentage(found.params.percentage || 0);
                                setParamFlat(found.params.flat || 0);
                                setParamLateDaysRate(found.params.late_days_rate || 0);
                              }
                            }}
                          >
                            {customFormulas.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="bg-slate-950 text-slate-100 rounded-lg p-2.5 font-mono text-[10.5px] leading-normal border border-slate-800">
                          <div className="text-[9px] text-slate-400 mb-1">Equation Parser State:</div>
                          <div className="text-emerald-400 font-bold break-all">
                            {selectedFormulaString}
                          </div>
                          <div className="text-slate-400 mt-1.5 break-all">
                            = {selectedFormulaString
                                .replace(/\bamount\b/g, sandboxAmount.toLocaleString())
                                .replace(/\bpercentage\b/g, `${paramPercentage}%`)
                                .replace(/\bflat\b/g, paramFlat.toLocaleString())
                                .replace(/\blate_days_rate\b/g, paramLateDaysRate.toLocaleString())
                                .replace(/\blate_days\b/g, String(sandboxLateDays))
                                .replace(/\btenure_months\b/g, String(sandboxTenureMonths))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-indigo-100/50 mt-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Total Calculated Fee</div>
                          <div className="text-xl font-bold text-indigo-600 font-mono">
                            {evaluateFormulaResult(
                              selectedFormulaString, 
                              sandboxAmount, 
                              paramPercentage, 
                              paramFlat, 
                              sandboxLateDays, 
                              sandboxTenureMonths, 
                              paramLateDaysRate
                            ).toLocaleString()} MMK
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[9.5px] bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-100 rounded font-bold uppercase tracking-wider block">
                            Status: Passed
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Valid Parameters
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Entry Bookkeeping Impact preview */}
                  <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-3 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        ⚖️ Ledger Double-Entry Impact for calculated fee
                      </span>
                      <span className="text-[10px] uppercase text-slate-400 font-mono">Real-Time Sync</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150">
                        <span className="text-[9.5px] font-bold text-indigo-600 uppercase">Debit Entries</span>
                        <div className="mt-1 font-mono text-[11px] space-y-1 text-slate-700">
                          <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                            <span>Customer Suspense (L1000217)</span>
                            <span className="font-bold text-slate-900">
                              {evaluateFormulaResult(
                                selectedFormulaString, 
                                sandboxAmount, 
                                paramPercentage, 
                                paramFlat, 
                                sandboxLateDays, 
                                sandboxTenureMonths, 
                                paramLateDaysRate
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic">Total receivables increase.</div>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-150">
                        <span className="text-[9.5px] font-bold text-emerald-600 uppercase">Credit Entries</span>
                        <div className="mt-1 font-mono text-[11px] space-y-1 text-slate-700">
                          <div className="flex justify-between border-b border-dashed border-slate-100 pb-1">
                            <span>Fee Income (I1000001)</span>
                            <span className="font-bold text-slate-900">
                              {evaluateFormulaResult(
                                selectedFormulaString, 
                                sandboxAmount, 
                                paramPercentage, 
                                paramFlat, 
                                sandboxLateDays, 
                                sandboxTenureMonths, 
                                paramLateDaysRate
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic">Platform EWA revenues increase.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Formula Registry List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">📂</span>
                <h3 className="m-0 text-sm font-bold text-slate-700">Dynamic Fee Formula Registry (Multi-Tenant Pool)</h3>
              </div>
              <Badge color="indigo">{customFormulas.length} Registered Formulas</Badge>
            </div>

            <div className="divide-y divide-slate-100">
              {customFormulas.map((form) => (
                <div key={form.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50/50 gap-4">
                  <div className="space-y-1.5 flex-1 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{form.id}</span>
                      <h4 className="text-sm font-bold text-slate-800 m-0">{form.name}</h4>
                      <Badge color="blue">{form.entity}</Badge>
                      <Badge color="grey">{form.element}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Formula:</span>
                      <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold text-[10.5px]">
                        {form.formula}
                      </code>
                      <span className="text-slate-300">|</span>
                      <span>Trigger:</span>
                      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                        {form.conditions[0].field} {form.conditions[0].operator} {form.conditions[0].value}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 italic m-0">
                      Sample Evaluation (Dry-Run): {form.resultPreview}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                      onClick={() => handleDeleteFormula(form.id)}
                    >
                      <Trash2 size={14} className="mr-1 inline" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'limits' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
          <table className="dt min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedLimits.length === filteredLimits.length && filteredLimits.length > 0} onChange={() => toggleAllLimits(filteredLimits.map(x=>x.id))} /></th>
                <th className="px-4 py-3">Rule ID</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Parameter</th><th className="px-4 py-3">Threshold</th><th className="px-4 py-3">Action on breach</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] text-slate-700">
              {filteredLimits.map(f => (
                <tr key={f.id} className={selectedLimits.includes(f.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}>
                  <td className="px-4"><input type="checkbox" checked={selectedLimits.includes(f.id)} onChange={() => toggleLimit(f.id)} /></td>
                  <td className="font-mono text-[12px] text-slate-500 font-bold">{f.id}</td><td className="font-semibold text-slate-800">{f.name}</td><td>{f.type}</td><td className="font-mono text-[12px] text-text-dim">{f.value}</td><td className={f.condition==='REJECT'?'text-red-600 font-medium':'text-amber-600 font-medium'}>{f.condition}</td><td><Badge color={f.status === 'ACTIVE' ? 'green' : 'grey'}>{f.status}</Badge></td>
                  <td className="text-right pr-4"><Button size="sm">Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination total={filteredLimits.length} maxPerPage={100} />
        </div>
      )}

      {tab === 'ruleEngine' && (
        <div className="space-y-6">
          {/* Header Dashboard Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engine Status</span>
              <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Decoupled Core Active
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Core Config Version</span>
              <div className="text-lg font-bold text-slate-800 mt-1">v{systemGlobalConfig.config_version}</div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Tenants Evaluated</span>
              <div className="text-lg font-bold text-indigo-600 mt-1">{data.companies.length} Tenants</div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Safety Policy Audit Trail</span>
              <div className="text-lg font-bold text-amber-600 mt-1 font-heading">Compliance Enforced</div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Side: Rule Editor, Version Control and Schema Validation */}
            <div className="xl:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛠</span>
                    <h3 className="m-0 text-sm font-bold text-slate-700">Dynamic Rule Configuration Payload</h3>
                  </div>
                  <select 
                    className="bg-white border border-slate-200 text-xs rounded px-2 py-1 outline-none font-semibold text-slate-600 animate-none"
                    value={activeScope}
                    onChange={(e) => handleScopeChange(e.target.value)}
                  >
                    <option value="SYSTEM_GLOBAL">Global System Platform Default</option>
                    <option value="CORP-001">Tenant Override: Shwe Group (CORP-001)</option>
                    <option value="CORP-002">Tenant Override: Nexa Tech (CORP-002)</option>
                    <option value="EMP-0045">Employee Override: Kaung Htet Min (EMP-0045)</option>
                  </select>
                </div>

                <div className="p-5 space-y-4">
                  <div className="text-xs text-slate-500 leading-relaxed">
                    This JSON payload represents the parameters ingested at runtime by the stateless rule engine for evaluation. Try editing a property and testing it instantly.
                  </div>

                  <div className="relative">
                    <textarea
                      className={`w-full h-80 font-mono text-xs p-3.5 bg-slate-900 text-emerald-400 rounded-xl border focus:outline-none transition-all leading-normal ${
                        jsonValidationError ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:ring-1 focus:ring-blue-500'
                      }`}
                      value={jsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      placeholder="{ ... }"
                    />
                    
                    {/* Floating Validation Indicator */}
                    <div className="absolute right-3.5 bottom-3.5">
                      {jsonValidationError ? (
                        <span className="bg-red-955 text-red-400 text-[10px] font-bold border border-red-900/50 px-2 py-1 rounded">
                          ⚠️ Schema Error
                        </span>
                      ) : (
                        <span className="bg-emerald-955 text-emerald-400 text-[10px] font-bold border border-emerald-900/50 px-2 py-1 rounded">
                          ✓ Schema Valid
                        </span>
                      )}
                    </div>
                  </div>

                  {jsonValidationError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-semibold leading-relaxed">
                      ❌ SCHEMA VALIDATION FAULT: {jsonValidationError}
                    </div>
                  )}

                  {isDraftModified && (
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-500 text-base">⚖️</span>
                          <span className="text-xs font-bold text-amber-800">Maker-Checker Policy Review</span>
                        </div>
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase font-mono animate-pulse">
                          Audit Active
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-600 leading-normal m-0">
                        A dynamic modification has been drafted. Under EWA internal compliance procedures, configuration modifications must undergo maker-checker validation with a mandatory auditing comment before deploying.
                      </p>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Justification Remark Comment (Required)</label>
                        <input
                          type="text"
                          className={`w-full text-xs p-2 rounded-lg border focus:outline-none transition-all ${
                            !checkerRemark.trim() ? 'border-red-300 focus:border-red-500 bg-red-50/10' : 'border-slate-200 bg-white focus:border-blue-500'
                          }`}
                          placeholder="e.g., Adjusting maximum withdrawal limits to cover monsoon holiday cash demands..."
                          value={checkerRemark}
                          onChange={(e) => setCheckerRemark(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2.5 pt-1.5">
                        <Button
                          variant="primary"
                          className="flex-1 text-xs text-white"
                          disabled={!!jsonValidationError || !checkerRemark.trim()}
                          onClick={handleDeployDraft}
                        >
                          Approve and Commit to Production (v{(Number(systemGlobalConfig.config_version.split('.')[2]) + 1).toString()})
                        </Button>
                        <Button
                          variant="default"
                          className="text-xs"
                          onClick={() => handleScopeChange(activeScope)}
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Version Rollback & Logs history */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <span className="text-lg">📂</span>
                  <h3 className="m-0 text-sm font-bold text-slate-700">Deploy Versioning Registry (Instant Rollbacks)</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                  {versionHistory.map((hist, idx) => {
                    const isCurrent = hist.version === systemGlobalConfig.config_version;
                    return (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800">Version v{hist.version}</span>
                            {isCurrent && (
                              <span className="bg-green-100 text-green-700 text-[9.5px] px-1.5 py-0.5 font-bold rounded uppercase">
                                Active Version
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Released by {hist.author} on {hist.ts}
                          </div>
                        </div>
                        <div>
                          {isCurrent ? (
                            <span className="text-xs text-slate-400 font-semibold italic">Deployed</span>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleRollback(hist)}
                            >
                              Restore &amp; Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side: Execution Simulator & Sandbox */}
            <div className="xl:col-span-6 space-y-6">
              {/* Inheritance Chain Analyzer */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <span className="text-lg">🌿</span>
                  <h3 className="m-0 text-sm font-bold text-slate-700">Inheritance &amp; Fallback Chain Resolver</h3>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Evaluating employee-specific rules checks the hierarchy. Properties are overridden by custom employee settings, fallback to company-wide tenant parameters, and ultimately cascade to the global system base settings.
                  </p>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5">Rule Property</th>
                          <th className="px-4 py-2.5">Resolved value</th>
                          <th className="px-4 py-2.5">Inherited Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const { config: resolvedRules, sources } = resolveInheritedConfig(simEmpId);
                          const rows = [
                            { prop: "Max Withdrawal %", val: `${(resolvedRules.limits.max_withdrawal_percentage * 100).toFixed(0)}%`, path: "limits.max_withdrawal_percentage" },
                            { prop: "Absolute Daily Ceiling", val: `${resolvedRules.limits.max_absolute_amount_per_day.toLocaleString()} MMK`, path: "limits.max_absolute_amount_per_day" },
                            { prop: "Floor Minimum Limit", val: `${resolvedRules.limits.min_withdrawal_allowed.toLocaleString()} MMK`, path: "limits.min_withdrawal_allowed" },
                            { prop: "Velocity Limit per Cycle", val: `${resolvedRules.limits.max_transactions_per_cycle} withdrawals`, path: "limits.max_transactions_per_cycle" },
                            { prop: "Tenant Absorb Fee (Subsidy)", val: resolvedRules.fee_matrix.tenant_subsidy ? "YES" : "NO", path: "fee_matrix.tenant_subsidy" },
                            { prop: "Auto-Approval Threshold", val: `${resolvedRules.workflow_triggers.auto_approve_threshold.toLocaleString()} MMK`, path: "workflow_triggers.auto_approve_threshold" }
                          ];
                          return rows.map((r, i) => {
                            const src = sources[r.path] || "Default";
                            const colorClass = src.includes("Employee") ? "text-blue-600 font-bold" : src.includes("Tenant") ? "text-purple-600 font-bold" : "text-slate-500";
                            return (
                              <tr key={i} className="hover:bg-white transition-colors">
                                <td className="px-4 py-2.5 font-medium text-slate-700">{r.prop}</td>
                                <td className="px-4 py-2.5 font-bold font-mono text-slate-900">{r.val}</td>
                                <td className={`px-4 py-2.5 font-mono text-[11px] ${colorClass}`}>{src}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Execution Engine Playground Sandbox */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="m-0 text-sm font-bold text-slate-700">Policy Sandbox &amp; Ledger Execution Simulator</h3>
                  </div>
                  <Badge color="blue">Runtime Simulator</Badge>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Employee Profile</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                        value={simEmpId}
                        onChange={(e) => setSimEmpId(e.target.value)}
                      >
                        {data.employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Disbursement Channel</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                        value={simChannel}
                        onChange={(e) => setSimChannel(e.target.value)}
                      >
                        <option value="kbzpay">KBZPay Wallet</option>
                        <option value="wavepay">WavePay Wallet</option>
                        <option value="cbpay">CB Bank Acc</option>
                        <option value="bank_transfer">Standard Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cash-out Amount (MMK)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold font-mono text-slate-800 focus:outline-none"
                        value={simAmountText}
                        onChange={(e) => setSimAmountText(e.target.value)}
                        placeholder="e.g. 150000"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prior Txns in Cycle</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold font-mono text-slate-700 focus:outline-none"
                        value={simPrevTxns}
                        onChange={(e) => setSimPrevTxns(Number(e.target.value))}
                        min={0}
                        max={10}
                      />
                    </div>
                  </div>

                  {/* Accrued Slider */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Simulated Accrued Salary Ratio:</span>
                      <span className="font-bold text-slate-800">{simAccrualPercent}% accrued</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5"
                      className="w-full cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                      value={simAccrualPercent}
                      onChange={(e) => setSimAccrualPercent(Number(e.target.value))}
                    />
                  </div>

                  {/* Partner API Failure Simulator Checkbox */}
                  <div className="flex items-center justify-between p-3 border border-red-100 bg-red-50/10 rounded-lg">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-red-700 flex items-center gap-1">
                        ⚠️ Simulate Partner MoBiz Gateway Timeout
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Tests mid-transaction API fault. Intercepts error and executes automated double-entry ledger reversal.
                      </div>
                    </div>
                    <Toggle isOn={simApiFailure} onToggle={() => setSimApiFailure(!simApiFailure)} />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex gap-2.5 pt-1">
                    <Button 
                      variant="default"
                      className="flex-1 font-semibold text-xs"
                      onClick={() => runEvaluation()}
                    >
                      🧪 Run Policy Evaluation
                    </Button>
                    <Button 
                      variant="primary"
                      className="flex-1 font-bold text-xs"
                      disabled={simStatus !== 'EVALUATED' || (evaluationResult && !evaluationResult.passed)}
                      onClick={executeSimulationCommit}
                    >
                      🚀 Commit &amp; Execute Transaction
                    </Button>
                  </div>

                  {/* Sandbox Terminal Output */}
                  {simStatus !== 'IDLE' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Engine Execution Console</span>
                        <Button size="xs" variant="ghost" onClick={() => { setSimStatus('IDLE'); setTerminalLogs([]); setEvaluationResult(null); }}>
                          Clear Terminal
                        </Button>
                      </div>

                      <div className="bg-slate-900 border border-slate-900 rounded-xl p-3.5 h-64 overflow-y-auto font-mono text-[11px] text-slate-200 space-y-1 scrollbar-none leading-relaxed">
                        {terminalLogs.map((log, index) => {
                          let color = "text-slate-300";
                          if (log.includes("✓") || log.includes("✅")) color = "text-emerald-400";
                          if (log.includes("❌") || log.includes("Error") || log.includes("FAULT")) color = "text-rose-400 font-semibold";
                          if (log.includes("⚠️") || log.includes("WARNING")) color = "text-amber-400";
                          if (log.includes("[CALC]")) color = "text-sky-300";
                          if (log.includes("[LEDGER]")) color = "text-fuchsia-300";
                          if (log.includes("[STATUS]")) color = "text-teal-300 font-bold border-t border-slate-800 pt-1 mt-1";
                          return (
                            <div key={index} className={color}>
                              {log}
                            </div>
                          );
                        })}
                      </div>

                      {/* Display Action Status Block */}
                      {evaluationResult && (
                        <div className={`p-4 border rounded-xl flex items-start gap-3.5 ${
                          !evaluationResult.passed ? 'bg-red-50 border-red-200 text-red-800' :
                          simStatus === 'COMMITTED_SUCCESS' ? 'bg-green-50 border-green-200 text-green-800' :
                          simStatus === 'COMMITTED_FAILURE' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          'bg-blue-50 border-blue-200 text-blue-800'
                        }`}>
                          <span className="text-xl">
                            {!evaluationResult.passed ? "🚫" :
                             simStatus === 'COMMITTED_SUCCESS' ? "✅" :
                             simStatus === 'COMMITTED_FAILURE' ? "🚨" :
                             "ℹ️"}
                          </span>
                          <div className="space-y-1 flex-1">
                            <div className="text-xs font-bold uppercase tracking-wider">
                              {!evaluationResult.passed ? "EWA Rule Evaluation Fault" :
                               simStatus === 'COMMITTED_SUCCESS' ? "Simulation Committed Successfully!" :
                               simStatus === 'COMMITTED_FAILURE' ? "Simulated API Fault Intercepted & Rolled Back" :
                               "Evaluation Completed Successfully (Ready to Commit)"}
                            </div>
                            <p className="text-[11.5px] leading-normal m-0 font-sans">
                              {!evaluationResult.passed ? evaluationResult.reason :
                               simStatus === 'COMMITTED_SUCCESS' ? `The payout was disbursed. Double-entry general ledger entries were posted to journal and central ledger account balances refreshed.` :
                               simStatus === 'COMMITTED_FAILURE' ? `MoBiz Gateway connection broke. The engine executed zero-loss automated rollback. A rollback journal has balanced general ledger books.` :
                               evaluationResult.workflowAction === 'MANUAL_REVIEW_TRIGGERED' ?
                               `Dynamic policy checks pass. Note: Request amount exceeds the auto-approval threshold limit of ${evaluationResult.activeRules.workflow_triggers.auto_approve_threshold.toLocaleString()} MMK, hence it will stage in PENDING review state.` :
                               `Dynamic policy checks pass. The amount matches all parameters. Click 'Commit & Execute' to process the ledger entries.`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
               <h3 className="m-0 text-sm font-bold text-slate-700">Companies</h3>
             </div>
             <div className="flex-1 overflow-y-auto max-h-[500px]">
               {data.companies.map((c: any) => (
                 <div key={c.id} className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                   <div className="font-bold text-sm text-slate-800">{c.name}</div>
                   <div className="text-xs text-slate-500 mt-0.5">{c.id} · {c.tier} Tier</div>
                 </div>
               ))}
             </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="m-0 text-lg font-bold text-slate-800">Shwe Group Configuration</h3>
                 <p className="text-xs text-slate-500 mt-1 mb-0">CORP-001 · Custom Overrides Applied</p>
               </div>
               <Button variant="default">Edit Mapping</Button>
             </div>
             
             <div className="space-y-6">
               <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Fee Structure</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-700">Tier A Fee (CFG-F01)</span>
                     <Toggle isOn={true} onToggle={() => {}} />
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-700">SME Corporate Coverage (CFG-F03)</span>
                     <Toggle isOn={true} onToggle={() => {}} />
                   </div>
                 </div>
               </div>
               
               <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Limitations</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-700">Max Monthly Txn (CFG-L01)</span>
                     <Toggle isOn={true} onToggle={() => {}} />
                   </div>
                   <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-700">High Amount Flag (CFG-L02)</span>
                     <Toggle isOn={true} onToggle={() => {}} />
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Advanced filters drawer */}
      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine table results</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Status</label><select className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary"><option>All</option><option>Active</option></select></div>
          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)}>Apply Filters</Button>
            <Button variant="ghost" onClick={() => setAdvancedFilterOpen(false)}>Clear</Button>
          </div>
        </div>
      </Drawer>

      {/* INTERACTIVE RULE CREATOR DRAWER */}
      <Drawer isOpen={isNewRuleOpen} onClose={() => setIsNewRuleOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div>
            <h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Create Configuration Rule</h2>
            <div className="text-[11.5px] text-slate-500">Add custom EWA Billing, limits, or overrides</div>
          </div>
          <button className="w-[30px] h-[30px] border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shrink-0" onClick={() => setIsNewRuleOpen(false)}>✕</button>
        </div>
        
        <form onSubmit={handleSaveRule} className="p-5 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rule Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" 
              placeholder="e.g. Peak Period Fee Override" 
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rule Category</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value)}
            >
              <option value="Fee">Fee Structure</option>
              <option value="Discount">Discount Rule</option>
              <option value="Velocity">Velocity limitation</option>
            </select>
          </div>

          {ruleCategory === 'Fee' && (
            <>
              {/* SENDER vs RECEIVER PAYMENT SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Who Pays the fee? (Payer Factor)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayerType('Receiver (Employee)')}
                    className={`py-2 px-3 border text-xs font-semibold rounded-lg transition-all ${payerType === 'Receiver (Employee)' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <User size={12} className="inline mr-1" /> Receiver (Employee)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayerType('Sender (Corporate)')}
                    className={`py-2 px-3 border text-xs font-semibold rounded-lg transition-all ${payerType === 'Sender (Corporate)' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Building size={12} className="inline mr-1" /> Sender (Corporate)
                  </button>
                </div>
              </div>

              {/* CALCULATION METHOD BASIS SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Calculation Method</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                >
                  <option value="Flat Fee">Flat Amount Fee</option>
                  <option value="Percentage">Percentage Fee (%)</option>
                  <option value="Range Tier">Range Tier Brackets</option>
                  <option value="Dynamic Formula">Dynamic Formula Builder</option>
                </select>
              </div>

              {/* DYNAMIC FORM BASED ON BASIS */}
              {calcType === 'Dynamic Formula' && (
                <div className="space-y-4 p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      🧮 Parametric Formula Configurator
                    </span>
                    <button
                      type="button"
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                      onClick={() => setDrawerFormulaCustomMode(!drawerFormulaCustomMode)}
                    >
                      {drawerFormulaCustomMode ? "← Use Presets" : "⚙ Custom Equation"}
                    </button>
                  </div>

                  {!drawerFormulaCustomMode ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Fee Template</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 font-semibold"
                        value={drawerSelectedFormulaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setDrawerSelectedFormulaId(id);
                          const found = customFormulas.find(f => f.id === id);
                          if (found) {
                            setDrawerSelectedFormulaString(found.formula);
                            setDrawerParamPercentage(found.params.percentage || 0);
                            setDrawerParamFlat(found.params.flat || 0);
                            setDrawerParamLateDaysRate(found.params.late_days_rate || 0);
                            setDrawerParamTenureMonths(found.params.tenure_months || 0);
                          }
                        }}
                      >
                        {customFormulas.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Mathematical Model</label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 font-semibold"
                          value={drawerSelectedFormulaString}
                          onChange={(e) => setDrawerSelectedFormulaString(e.target.value)}
                        >
                          <option value="amount * percentage + flat">Linear Flat: amount * percentage + flat</option>
                          <option value="amount * percentage * flat">Compound: amount * percentage * flat</option>
                          <option value="amount * percentage + (late_days * late_days_rate)">Late Days: amount * percentage + (late_days * late_days_rate)</option>
                          <option value="(amount * percentage) - (tenure_months * flat)">Tenure Reward: (amount * percentage) - (tenure_months * flat)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Formula Name</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-700"
                          placeholder="e.g. Peak Surcharge"
                          value={drawerFormulaName}
                          onChange={(e) => setDrawerFormulaName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Param Inputs */}
                  <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-3">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">Active Formula Parameters</span>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Percentage Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold font-mono text-slate-700"
                          value={drawerParamPercentage}
                          onChange={(e) => setDrawerParamPercentage(Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Flat Part (MMK)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold font-mono text-slate-700"
                          value={drawerParamFlat}
                          onChange={(e) => setDrawerParamFlat(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Late Day Rate (MMK/d)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold font-mono text-slate-700"
                          value={drawerParamLateDaysRate}
                          onChange={(e) => setDrawerParamLateDaysRate(Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Loyalty Min Tenure</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold font-mono text-slate-700"
                          value={drawerParamTenureMonths}
                          onChange={(e) => setDrawerParamTenureMonths(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interactive Dynamic Preview */}
                  <div className="bg-slate-950 text-slate-100 rounded-lg p-2.5 border border-slate-800">
                    <div className="text-[9px] text-slate-400 mb-1 font-mono uppercase tracking-wider">Dynamic Equation State:</div>
                    <code className="text-[10px] text-emerald-400 font-mono block break-all">
                      {drawerSelectedFormulaString}
                    </code>
                    
                    <div className="border-t border-slate-800/60 my-1.5 pt-1.5 text-[10px] text-slate-400 font-mono">
                      <span>Evaluates: </span>
                      <span className="text-white font-bold">
                        {evaluateFormulaResult(
                          drawerSelectedFormulaString,
                          150000,
                          drawerParamPercentage,
                          drawerParamFlat,
                          3,
                          6,
                          drawerParamLateDaysRate
                        ).toLocaleString()} MMK
                      </span>
                      <span className="text-slate-500 block text-[9px] mt-0.5">
                        (Simulated on 150,000 MMK, 3 late days, 6 mo. tenure)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {calcType === 'Flat Fee' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Flat Fee Value (MMK)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    placeholder="e.g. 1,500"
                  />
                </div>
              )}

              {calcType === 'Percentage' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Percentage Rate (%)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    placeholder="e.g. 2.5"
                  />
                </div>
              )}

              {calcType === 'Range Tier' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-xs font-bold text-slate-700">Tier Brackets Builder</div>
                  
                  {/* Bracket List */}
                  {brackets.length > 0 ? (
                    <div className="space-y-1.5">
                      {brackets.map((b, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white border border-slate-100 rounded p-2">
                          <span className="font-mono text-slate-600 font-semibold">
                            {b.min.toLocaleString()} - {b.max.toLocaleString()} MMK
                          </span>
                          <span className="font-bold text-slate-800 font-mono">
                            {b.fee}
                          </span>
                          <button 
                            type="button" 
                            className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50"
                            onClick={() => removeBracket(idx)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic text-center py-2 bg-white rounded border border-slate-100">
                      No brackets added yet. Create one below.
                    </div>
                  )}

                  {/* Add Bracket Helper */}
                  <div className="border-t border-slate-200 pt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Min Range</label>
                        <input type="number" className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono" value={newMin} onChange={(e)=>setNewMin(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Max Range</label>
                        <input type="number" className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono" value={newMax} onChange={(e)=>setNewMax(Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Bracket Fee Rate / Amount</label>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded p-1 text-xs font-mono" placeholder="e.g. 1,500 MMK or 2%" value={newFee} onChange={(e)=>setNewFee(e.target.value)} />
                    </div>
                    <Button type="button" size="xs" variant="default" className="w-full" onClick={addBracket}>
                      + Add Bracket
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Trigger Condition</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" 
              placeholder="e.g. Txn &gt; 100,000 MMK" 
              value={ruleCondition}
              onChange={(e) => setRuleCondition(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsNewRuleOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1">Save Rule set</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
