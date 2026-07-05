import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

export const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center font-semibold whitespace-nowrap border transition-colors focus-visible:outline-2 focus-visible:outline-primary cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed rounded-lg shadow-sm";
  const variants: any = {
    default: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    primary: "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700",
    ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 shadow-none",
    danger: "border-red-500 text-red-600 bg-transparent hover:bg-red-50",
    success: "border-green-500 text-green-600 bg-transparent hover:bg-green-50",
  };
  const sizes: any = {
    default: "h-9 px-4 text-[12.5px] gap-2",
    sm: "h-7 px-3 text-[11.5px] gap-1.5",
    h10: "h-10 px-4 text-[13px] gap-2",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, color = 'grey', className = '' }: { children: ReactNode, color?: string, className?: string }) => {
  const colors: any = {
    green: "bg-green-100 text-green-700",
    amber: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    grey: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded text-[11px] font-medium border border-transparent ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACTIVE:'green',DISBURSED:'green',MATCHED:'green',APPROVED:'green',VERIFIED:'green',
    RISK_WARNING:'amber',PARTIAL:'amber',PENDING:'amber',PENDING_RISK:'amber',PENDING_OPS:'amber',
    PENDING_FINANCE:'amber',PENDING_SETTLE:'amber',PENDING_HR:'amber',PROCESSING:'amber',
    BLACKLISTED:'red',FAILED:'red',SUSPENSE:'red',REJECTED:'red',FROZEN:'red',KYC_RETURNED:'red',MISSING:'red',SUSPENDED:'red',
  };
  let color = 'grey';
  for (const key in map) {
    if (status.includes(key)) { color = map[key]; break; }
  }
  return <Badge color={color}>{status.replace(/_/g, ' ')}</Badge>;
};

export const Drawer = ({ isOpen, onClose, children, mode = 'right' }: { isOpen: boolean, onClose: () => void, children: ReactNode, mode?: 'right' | 'center' }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`fixed inset-0 bg-slate-900/60 z-50 flex backdrop-blur-sm ${mode === 'center' ? 'items-center justify-center' : 'items-stretch justify-end'}`} onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-white overflow-auto shadow-xl ${mode === 'center' ? 'w-[min(520px,92vw)] max-h-[88vh] border border-slate-200 rounded-xl animate-pop-in' : 'w-[min(760px,92vw)] h-full border-l border-slate-200 animate-slide-in'}`}>
        {children}
      </div>
    </div>
  );
};

export const TableToolbar = ({ search, setSearch, placeholder = "Search...", searchFields = [], filters, onExport, onAdvancedFilter, count }: any) => {
  return (
    <div className="space-y-2 mb-4 w-full">
      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9 shadow-sm w-full">
            <span className="text-slate-400 text-sm">🔍</span>
            <input type="text" placeholder={placeholder} className="bg-transparent border-none flex-1 text-[13px] text-slate-800 outline-none" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {searchFields.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              <span className="text-[9.5px] text-slate-400 font-medium">Active search index:</span>
              {searchFields.map((field: string, idx: number) => (
                <span key={idx} className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-mono border border-slate-200/40">{field}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          <Button variant="ghost" onClick={onAdvancedFilter} className="!text-blue-600 font-medium text-xs">⚙️ Advanced Filter</Button>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500 text-xs font-medium bg-slate-200 px-2.5 py-1 rounded-full">{count} records</span>
          <Button variant="default" onClick={onExport}>⬇ Export CSV</Button>
        </div>
      </div>
    </div>
  );
};

export const TablePagination = ({ total, maxPerPage = 100 }: { total: number, maxPerPage?: number }) => {
  return (
    <div className="flex items-center justify-between mt-3 px-1 border-t border-slate-200 pt-3">
      <div className="text-[11.5px] text-slate-500">
        Showing 1 to {Math.min(total, maxPerPage)} of {total} records. (Max {maxPerPage}/page)
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled>Prev</Button>
        <Button size="sm" disabled={total <= maxPerPage}>Next</Button>
      </div>
    </div>
  );
};

export const Toggle = ({ isOn, onToggle }: { isOn: boolean, onToggle: () => void }) => {
  return (
    <div className={`w-9 h-5 rounded-full border relative shrink-0 cursor-pointer transition-colors ${isOn ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-300'}`} onClick={onToggle}>
      <i className={`absolute top-[1px] w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isOn ? 'left-[17px]' : 'left-[1px]'}`}></i>
    </div>
  );
};
