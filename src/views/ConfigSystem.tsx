import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, Badge, Drawer, Toggle, TableToolbar, TablePagination } from '../components/UI';
import { Settings, Plus, Percent, ShieldCheck } from 'lucide-react';

const mockFees = [
  { id: 'CFG-F01', name: 'Standard Tier A Fee', type: 'Flat Fee', value: '1,500 MMK', condition: 'Txn < 100,000', status: 'ACTIVE' },
  { id: 'CFG-F02', name: 'Standard Tier B Fee', type: 'Percentage', value: '2.5%', condition: 'Txn >= 100,000', status: 'ACTIVE' },
  { id: 'CFG-D01', name: 'Holiday Promo (April)', type: 'Discount', value: '-500 MMK', condition: 'Date inside April', status: 'INACTIVE' }
];

const mockLimits = [
  { id: 'CFG-L01', name: 'Max Monthly Txn', type: 'Velocity', value: '4 Txns / cycle', condition: 'REJECT', status: 'ACTIVE' },
  { id: 'CFG-L02', name: 'High Amount Flag', type: 'Amount Limit', value: '> 500,000 MMK', condition: 'MANUAL_REVIEW', status: 'ACTIVE' },
  { id: 'CFG-L03', name: 'Min Tenure Req', type: 'Tenure', value: '< 3 Months', condition: 'REJECT', status: 'ACTIVE' }
];

export default function ConfigSystem() {
  const { data } = useData();
  const [tab, setTab] = useState('fees');
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const toggleFee = (id: string) => setSelectedFees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllFees = (ids: string[]) => setSelectedFees(prev => prev.length === ids.length ? [] : ids);

  const [selectedLimits, setSelectedLimits] = useState<string[]>([]);
  const toggleLimit = (id: string) => setSelectedLimits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllLimits = (ids: string[]) => setSelectedLimits(prev => prev.length === ids.length ? [] : ids);

  const filteredFees = mockFees.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredLimits = mockLimits.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold font-heading m-0 text-slate-800">System Configuration & Policies</h2>
          <p className="m-0 text-slate-500 text-[12.5px] max-w-[640px] mt-1">Define global rules, fee structures, discounts, and validation limits. Map these to specific companies or globally.</p>
        </div>
        <Button variant="primary" onClick={() => setIsNewRuleOpen(true)}>
          <Plus size={14} /> Create Rule
        </Button>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 pb-2">
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'fees' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('fees'); setSearch(''); }}>Fees & Discounts</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'limits' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('limits'); setSearch(''); }}>Velocity & Limitations</button>
        <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'mapping' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => setTab('mapping')}>Company Mapping</button>
      </div>

      {(tab === 'fees' || tab === 'limits') && (
        <TableToolbar 
          search={search} 
          setSearch={setSearch} 
          count={tab === 'fees' ? filteredFees.length : filteredLimits.length}
          onExport={() => alert('Exporting...')}
          onAdvancedFilter={() => setAdvancedFilterOpen(true)}
          filters={<></>}
        />
      )}

      {tab === 'fees' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
          <table className="dt min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedFees.length === filteredFees.length && filteredFees.length > 0} onChange={() => toggleAllFees(filteredFees.map(x=>x.id))} /></th>
                <th className="px-4 py-3">Rule ID</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Trigger Condition</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] text-slate-700">
              {filteredFees.map(f => (
                <tr key={f.id} className={selectedFees.includes(f.id) ? 'bg-blue-50/50' : ''}>
                  <td className="px-4"><input type="checkbox" checked={selectedFees.includes(f.id)} onChange={() => toggleFee(f.id)} /></td>
                  <td className="font-mono text-[12px] text-text-dim">{f.id}</td><td className="font-medium text-slate-800">{f.name}</td><td>{f.type}</td><td className="font-mono text-[12px] text-text-dim">{f.value}</td><td>{f.condition}</td><td><Badge color={f.status === 'ACTIVE' ? 'green' : 'grey'}>{f.status}</Badge></td>
                  <td className="text-right pr-4"><Button size="sm">Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination total={filteredFees.length} maxPerPage={100} />
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
                <tr key={f.id} className={selectedLimits.includes(f.id) ? 'bg-blue-50/50' : ''}>
                  <td className="px-4"><input type="checkbox" checked={selectedLimits.includes(f.id)} onChange={() => toggleLimit(f.id)} /></td>
                  <td className="font-mono text-[12px] text-text-dim">{f.id}</td><td className="font-medium text-slate-800">{f.name}</td><td>{f.type}</td><td className="font-mono text-[12px] text-text-dim">{f.value}</td><td className={f.condition==='REJECT'?'text-red-600 font-medium':'text-amber-600 font-medium'}>{f.condition}</td><td><Badge color={f.status === 'ACTIVE' ? 'green' : 'grey'}>{f.status}</Badge></td>
                  <td className="text-right pr-4"><Button size="sm">Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination total={filteredLimits.length} maxPerPage={100} />
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
                     <span className="text-sm font-medium text-slate-700">Custom Corporate Discount</span>
                     <Toggle isOn={false} onToggle={() => {}} />
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

      <Drawer isOpen={isNewRuleOpen} onClose={() => setIsNewRuleOpen(false)} mode="center">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 m-0">Create Configuration Rule</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rule Name</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" placeholder="e.g., VIP Discount" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rule Category</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
                <option>Fee</option>
                <option>Discount</option>
                <option>Velocity Limit</option>
                <option>Validation Policy</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Rule Type</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
                  <option>Flat Amount</option>
                  <option>Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Value</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" placeholder="e.g. 500" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsNewRuleOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsNewRuleOpen(false)}>Save Rule</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
