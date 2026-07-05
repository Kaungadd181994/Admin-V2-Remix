export const INITIAL_DATA = {
  companies: [
    {id:'CORP-001',name:'Shwe Group',type:'CORPORATE',limit:50000000,utilized:15000000,payoutDay:25,dueDay:5,grace:3,lateFee:1.0,accrual:'SIMPLE_DAILY',capType:'PERCENTAGE',capValue:'50% of Base',status:'ACTIVE',tier:'B',score:78,lastAudit:'2026-06-30',employees:412,industry:'Manufacturing',stage:'ACTIVE'},
    {id:'CORP-002',name:'Nexa Tech',type:'CORPORATE',limit:20000000,utilized:18500000,payoutDay:28,dueDay:7,grace:2,lateFee:1.5,accrual:'COMPOUND_DAILY',capType:'FIXED_AMOUNT',capValue:'300,000 MMK',status:'RISK_WARNING',tier:'D',score:46,lastAudit:'2026-07-01',employees:96,industry:'Technology',stage:'ACTIVE'},
    {id:'CORP-003',name:'Golden Irrawaddy Retail',type:'CORPORATE',limit:32000000,utilized:9800000,payoutDay:26,dueDay:6,grace:3,lateFee:1.0,accrual:'SIMPLE_DAILY',capType:'PERCENTAGE',capValue:'45% of Base',status:'ACTIVE',tier:'A',score:88,lastAudit:'2026-06-22',employees:301,industry:'Retail',stage:'ACTIVE'},
    {id:'CORP-004',name:'Mandalay Freight Co.',type:'SME',limit:6000000,utilized:2100000,payoutDay:30,dueDay:5,grace:2,lateFee:1.0,accrual:'SIMPLE_DAILY',capType:'PERCENTAGE',capValue:'50% of Base',status:'ACTIVE',tier:'C',score:61,lastAudit:'2026-06-18',employees:38,industry:'Logistics',stage:'ACTIVE'},
    {id:'CORP-005',name:'Yangon Textile Union',type:'CORPORATE',limit:41000000,utilized:39750000,payoutDay:24,dueDay:4,grace:2,lateFee:1.5,accrual:'COMPOUND_DAILY',capType:'PERCENTAGE',capValue:'40% of Base',status:'RISK_WARNING',tier:'D',score:41,lastAudit:'2026-06-29',employees:520,industry:'Textile',stage:'ACTIVE'},
    {id:'CORP-006',name:'Bago Agro Processing',type:'SME',limit:4500000,utilized:0,status:'PENDING_RISK',tier:'-',score:0,lastAudit:'-',employees:22,industry:'Agriculture',stage:'CREDIT_ASSESSMENT',payoutDay:'-',dueDay:'-',grace:'-',lateFee:'-',accrual:'-',capType:'-',capValue:'-'},
    {id:'CORP-007',name:'Delta Hospitality Group',type:'CORPORATE',limit:0,utilized:0,status:'PENDING_OPS',tier:'-',score:0,lastAudit:'-',employees:140,industry:'Hospitality',stage:'KYC_REVIEW',payoutDay:'-',dueDay:'-',grace:'-',lateFee:'-',accrual:'-',capType:'-',capValue:'-'},
    {id:'CORP-008',name:'Inle Craft Exports',type:'SME',limit:0,utilized:0,status:'PENDING_FINANCE',tier:'C',score:58,lastAudit:'-',employees:19,industry:'Manufacturing',stage:'BUDGET_APPROVAL',payoutDay:'-',dueDay:'-',grace:'-',lateFee:'-',accrual:'-',capType:'-',capValue:'-'},
  ],
  employees: [
    {id:'EMP-0045',name:'Kaung Htet Min',company:'CORP-001',dept:'Product',salary:1200000,kyc:'VERIFIED',whitelist:true,outstanding:102500,cap:600000,status:'ACTIVE',reason:'-',bank:'KBZ · 1002938472',lastSync:'10 mins ago'},
    {id:'EMP-0089',name:'Poe Poe',company:'CORP-001',dept:'Design',salary:1500000,kyc:'VERIFIED',whitelist:true,outstanding:211150,cap:750000,status:'ACTIVE',reason:'-',bank:'AYA · 2004938111',lastSync:'10 mins ago'},
    {id:'EMP-0112',name:'Thaw Thaw',company:'CORP-001',dept:'QA',salary:800000,kyc:'PENDING',whitelist:false,outstanding:0,cap:400000,status:'PENDING_SETTLE',reason:'Waiting Deposit',bank:'CB · 3004928177',lastSync:'1 day ago'},
    {id:'EMP-0204',name:'Kyaw Kyaw',company:'CORP-002',dept:'Sales',salary:1000000,kyc:'VERIFIED',whitelist:false,outstanding:153750,cap:500000,status:'BLACKLISTED',reason:'Salary Dispute',bank:'YOMA · 400291112',lastSync:'2 hours ago'},
    {id:'EMP-0301',name:'Su Su Hlaing',company:'CORP-003',dept:'Merchandising',salary:950000,kyc:'VERIFIED',whitelist:true,outstanding:58000,cap:420000,status:'ACTIVE',reason:'-',bank:'Wave · 09777112233',lastSync:'22 mins ago'},
    {id:'EMP-0322',name:'Zin Ko Ko',company:'CORP-003',dept:'Logistics',salary:700000,kyc:'VERIFIED',whitelist:true,outstanding:0,cap:315000,status:'ACTIVE',reason:'-',bank:'KBZ · 1029384756',lastSync:'22 mins ago'},
    {id:'EMP-0410',name:'Nilar Win',company:'CORP-005',dept:'Weaving',salary:650000,kyc:'VERIFIED',whitelist:true,outstanding:260000,cap:260000,status:'FROZEN',reason:'Ghost employee check',bank:'CB · 9004821177',lastSync:'4 days ago'},
    {id:'EMP-0455',name:'Aung Zaw Htet',company:'CORP-004',dept:'Drivers',salary:500000,kyc:'VERIFIED',whitelist:false,outstanding:0,cap:250000,status:'PENDING_HR',reason:'Not in latest roster',bank:'KBZPay · 09455112200',lastSync:'3 hours ago'},
    {id:'EMP-0480',name:'Moe Moe Aye',company:'CORP-002',dept:'HR',salary:1100000,kyc:'VERIFIED',whitelist:true,outstanding:0,cap:550000,status:'ACTIVE',reason:'-',bank:'AYA · 2200938111',lastSync:'40 mins ago'},
    {id:'EMP-0512',name:'Htet Aung',company:'CORP-001',dept:'Engineering',salary:1800000,kyc:'REJECTED',whitelist:false,outstanding:0,cap:900000,status:'KYC_RETURNED',reason:'Blurry NRC photo',bank:'-',lastSync:'6 hours ago'},
  ],
  verifyQueue: [
    {id:'VQ-2201',name:'Aung Zaw Htet',company:'CORP-004',scenario:'C — No Match',submitted:'2026-07-03 09:12',confidence:'-'},
    {id:'VQ-2202',name:'Thiri Sandar',company:'CORP-003',scenario:'B — Match, Not Trusted',submitted:'2026-07-03 11:40',confidence:'92%'},
    {id:'VQ-2203',name:'Ye Yint Aung',company:'CORP-005',scenario:'C — No Match',submitted:'2026-07-04 08:05',confidence:'-'},
  ],
  disbursements: [
    {id:'REQ-9901',emp:'EMP-0045 K. H. Min',ts:'2026-07-02 14:20',accrued:480000,requested:100000,fee:2500,debit:102500,net:97500,channel:'KBZPay Wallet',ref:'TXN-KBZ-88291',originalRef:'ORG-REF-SHWE-001',status:'DISBURSED',error:'None'},
    {id:'REQ-9902',emp:'EMP-0089 Poe Poe',ts:'2026-07-02 15:05',accrued:600000,requested:200000,fee:5000,debit:215000,net:195000,channel:'WavePay Wallet',ref:'TXN-WAV-11029',originalRef:'ORG-REF-SHWE-002',status:'DISBURSED',error:'None'},
    {id:'REQ-9903',emp:'EMP-0204 Kyaw Kyaw',ts:'2026-07-02 16:11',accrued:400000,requested:150000,fee:3750,debit:153750,net:146250,channel:'CB Bank Acc',ref:'None',originalRef:'ORG-REF-NEXA-001',status:'FAILED',error:'DEBIT_FIRST_FAIL'},
    {id:'REQ-9904',emp:'EMP-0301 Su Su Hlaing',ts:'2026-07-03 10:02',accrued:320000,requested:60000,fee:1500,debit:61500,net:58500,channel:'Wave Wallet',ref:'TXN-WAV-11208',originalRef:'ORG-REF-GOLD-001',status:'DISBURSED',error:'None'},
    {id:'REQ-9905',emp:'EMP-0410 Nilar Win',ts:'2026-07-03 13:44',accrued:260000,requested:260000,fee:6500,debit:266500,net:253500,channel:'CB Bank Acc',ref:'TXN-CB-30291',originalRef:'ORG-REF-YANGON-001',status:'PROCESSING',error:'None'},
    {id:'REQ-9906',emp:'EMP-0322 Zin Ko Ko',ts:'2026-07-04 09:15',accrued:210000,requested:80000,fee:2000,debit:82000,net:78000,channel:'KBZPay Wallet',ref:'TXN-KBZ-88705',originalRef:'ORG-REF-GOLD-002',status:'DISBURSED',error:'None'},
  ],
  batches: [
    {id:'BCH-5501',corp:'CORP-001 Shwe',cycle:'JUNE-2026',gl:'GL-CLR-0041',expected:512500,lateFees:9225,invoice:521725,received:521725,ref:'REF-99381.pdf',relatedOriginalRefs:['ORG-REF-SHWE-001', 'ORG-REF-SHWE-002'],ts:'2026-07-01 10:00',coverage:100.0,suspense:0,status:'MATCHED'},
    {id:'BCH-5502',corp:'CORP-002 Nexa',cycle:'JUNE-2026',gl:'GL-CLR-0041',expected:800000,lateFees:24000,invoice:824000,received:500000,ref:'REF-11204.pdf',relatedOriginalRefs:['ORG-REF-NEXA-001'],ts:'2026-07-02 11:15',coverage:60.67,suspense:0,status:'PARTIAL'},
    {id:'BCH-5503',corp:'CORP-001 Shwe',cycle:'JUNE-2026',gl:'GL-CLR-0041',expected:0,lateFees:0,invoice:0,received:50000,ref:'REF-44912.pdf',relatedOriginalRefs:[],ts:'2026-07-02 16:30',coverage:0,suspense:50000,status:'SUSPENSE'},
    {id:'BCH-5504',corp:'CORP-003 Golden Irrawaddy',cycle:'JUNE-2026',gl:'GL-CLR-0041',expected:298000,lateFees:0,invoice:298000,received:298000,ref:'REF-77102.pdf',relatedOriginalRefs:['ORG-REF-GOLD-001', 'ORG-REF-GOLD-002'],ts:'2026-07-03 09:40',coverage:100.0,suspense:0,status:'MATCHED'},
    {id:'BCH-5505',corp:'CORP-005 Yangon Textile',cycle:'JUNE-2026',gl:'GL-CLR-0041',expected:1240000,lateFees:41000,invoice:1281000,received:0,ref:'—',relatedOriginalRefs:['ORG-REF-YANGON-001'],ts:'—',coverage:0,suspense:0,status:'MISSING'},
  ],
  budgetRequests: [
    {id:'BR-3301',corp:'CORP-001 Shwe Group',current:50000000,requested:65000000,reason:'Seasonal headcount +80',risk:'B (78)',status:'PENDING_RISK',submitted:'2026-07-02'},
    {id:'BR-3302',corp:'CORP-004 Mandalay Freight',current:6000000,requested:9000000,reason:'New branch — Bago route',risk:'C (61)',status:'APPROVED',submitted:'2026-06-27'},
    {id:'BR-3303',corp:'CORP-002 Nexa Tech',current:20000000,requested:26000000,reason:'Growth plan attached',risk:'D (46)',status:'REJECTED',submitted:'2026-06-20'},
  ],
  journal: [
    {id:'JE-880021',date:'2026-07-02',ref:'REQ-9901',desc:'Advance disbursement — block e-money',debit:'Customer Suspense (L100000217)',credit:'Advance Receivable (1200)',amount:102500},
    {id:'JE-880022',date:'2026-07-02',ref:'REQ-9901',desc:'Fee income recognition',debit:'Customer Suspense (L100000217)',credit:'Fee Income (I100000101)',amount:2500},
    {id:'JE-880023',date:'2026-07-02',ref:'REQ-9901',desc:'Net cash-out to employee wallet',debit:'Cash / Bank (1100)',credit:'Customer Suspense (L100000217)',amount:97500},
    {id:'JE-880031',date:'2026-07-01',ref:'BCH-5501',desc:'Corporate repayment received',debit:'Cash / Bank (1100)',credit:'Advance Receivable (1200)',amount:512500},
    {id:'JE-880032',date:'2026-07-01',ref:'BCH-5501',desc:'Late fee collection',debit:'Cash / Bank (1100)',credit:'Late Fee Revenue (4200)',amount:9225},
  ],
  coa: [
    {code:'1100',name:'Cash & Bank',type:'Asset',debit:812275,credit:97500,net:714775},
    {code:'1200',name:'Advance Receivable',type:'Asset',debit:1150000,credit:512500,net:637500},
    {code:'L100000217',name:'Customer Suspense',type:'Liability',debit:265000,credit:265000,net:0},
    {code:'I100000101',name:'Fee Income',type:'Income',debit:0,credit:19750,net:-19750},
    {code:'4200',name:'Late Fee Revenue',type:'Income',debit:0,credit:9225,net:-9225},
    {code:'5100',name:'Bad Debt Expense',type:'Expense',debit:0,credit:0,net:0},
  ],
  riskExposure: [
    {corp:'CORP-001 Shwe Group',tier:'B',allowable:50000000,current:15000000,count:412,util:30},
    {corp:'CORP-002 Nexa Tech',tier:'D',allowable:20000000,current:18500000,count:96,util:92},
    {corp:'CORP-003 Golden Irrawaddy',tier:'A',allowable:32000000,current:9800000,count:301,util:31},
    {corp:'CORP-004 Mandalay Freight',tier:'C',allowable:6000000,current:2100000,count:38,util:35},
    {corp:'CORP-005 Yangon Textile',tier:'D',allowable:41000000,current:39750000,count:520,util:97},
  ],
  notifications: [
    {id:'N-1',status:'BUDGET_APPROVED',type:'Email',title:'Budget Allocated for Mandalay Freight Co.',content:'Allocated 9,000,000 MMK (Tier C). Employee onboarding can proceed.',time:'2026-06-27 15:02'},
    {id:'N-2',status:'GHOST_EMPLOYEE_ALERT',type:'Email + Portal',title:'Ghost Employee Detected — Nilar Win',content:'Missing from latest roster, outstanding 260,000 MMK. Immediate action required.',time:'2026-07-03 08:10'},
    {id:'N-3',status:'PARTIAL_PAYMENT',type:'Portal + Email',title:'Partial Payment — Nexa Tech',content:'Received 500,000 of 824,000 MMK due. EWA suspended until full settlement.',time:'2026-07-02 11:20'},
    {id:'N-4',status:'ROSTER_APPROVED',type:'Portal',title:'Roster Upload Approved — Golden Irrawaddy',content:'12 new, 4 modified, 1 missing employee processed.',time:'2026-07-01 09:44'},
    {id:'N-5',status:'REPAYMENT_REMINDER',type:'Email',title:'Repayment due in 2 days — Yangon Textile Union',content:'Invoice 1,281,000 MMK due 2026-07-04. Send official invoice.',time:'2026-07-02 07:00'},
  ],
  auditLogs: [
    {ts:'2026-07-04 09:15',actor:'risk.officer@ewa',role:'Risk Officer',action:'BUDGET_ADJUST',entity:'CORP-002',detail:'Allow amount lowered 22M → 20M',ip:'10.20.4.11'},
    {ts:'2026-07-03 08:10',actor:'system',role:'System',action:'GHOST_EMPLOYEE_FLAG',entity:'EMP-0410',detail:'Missing from roster w/ balance 260,000',ip:'—'},
    {ts:'2026-07-02 16:41',actor:'finance.checker@ewa',role:'Finance Officer',action:'BUDGET_REJECT',entity:'BR-3303',detail:'Reason: repayment history insufficient',ip:'10.20.4.30'},
    {ts:'2026-07-02 11:22',actor:'ops.lead@ewa',role:'Ops Lead',action:'SETTLEMENT_VERIFY',entity:'BCH-5502',detail:'Marked PARTIAL, routed to Finance',ip:'10.20.4.02'},
    {ts:'2026-07-01 10:05',actor:'admin.hr@shwegroup',role:'Admin HR',action:'ROSTER_UPLOAD',entity:'CORP-001',detail:'482 rows staged, diff generated',ip:'103.6.22.4'},
  ],
  users: [
    {id:'U-01',name:'Ryan Aung',email:'ryan.aung@ewa.platform',role:'Platform Admin',scope:'All Tenants',status:'ACTIVE',last:'2 mins ago'},
    {id:'U-02',name:'Nandar Hlaing',email:'nandar.h@ewa.platform',role:'Risk Officer (Maker)',scope:'Myanmar',status:'ACTIVE',last:'40 mins ago'},
    {id:'U-03',name:'Kyaw Thiha',email:'kyaw.t@ewa.platform',role:'Finance Officer (Checker)',scope:'Myanmar',status:'ACTIVE',last:'1 hr ago'},
    {id:'U-04',name:'Ei Ei Phyo',email:'eiei.p@ewa.platform',role:'Ops Lead',scope:'Myanmar',status:'ACTIVE',last:'3 hrs ago'},
    {id:'U-05',name:'Zaw Min Latt',email:'zaw.ml@ewa.platform',role:'Ops Staff (Maker)',scope:'Myanmar',status:'SUSPENDED',last:'6 days ago'},
  ],
};

export const STAGES = [
  {key:'SUBMITTED',label:'Submitted'},
  {key:'KYC_REVIEW',label:'KYC Review'},
  {key:'CREDIT_ASSESSMENT',label:'Credit Assessment'},
  {key:'BUDGET_APPROVAL',label:'Budget Approval'},
  {key:'ACTIVE',label:'Active'},
];

export const fmt = (n: number | string) => typeof n==='number' ? n.toLocaleString('en-US',{maximumFractionDigits:0}) : n;
export const mmk = (n: number | string) => typeof n==='number' ? fmt(n)+' MMK' : n;
