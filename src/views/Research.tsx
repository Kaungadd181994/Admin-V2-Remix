import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, Badge, Drawer, TableToolbar, TablePagination } from '../components/UI';
import { FileText, Plus, UserPlus, FileCheck } from 'lucide-react';

const activeTasks = [
  { id: 'RT-1004', title: 'Q4 Disbursement Risk Mitigation', entity: 'All Corporate', assigned: 'Sarah Jenkins', status: 'IN_PROGRESS', priority: 'HIGH', due: '2026-07-10' },
  { id: 'RT-1005', title: 'Ghost Employee Verification Spike', entity: 'SME Sector', assigned: 'Unassigned', status: 'OPEN', priority: 'CRITICAL', due: '2026-07-06' },
  { id: 'RT-1006', title: 'Late Fee Accrual Policy Review', entity: 'Nexa Tech (CORP-002)', assigned: 'David Chen', status: 'IN_PROGRESS', priority: 'MEDIUM', due: '2026-07-15' }
];

const generatedReports = [
  { id: 'REP-992', title: 'Q3 Financial Exposure Review', author: 'Sarah Jenkins', generated: '2026-07-02', status: 'APPROVED' },
  { id: 'REP-991', title: 'SME Utilization Assessment', author: 'David Chen', generated: '2026-06-28', status: 'APPROVED' },
  { id: 'REP-990', title: 'High Risk Cohort Analysis (May)', author: 'Sarah Jenkins', generated: '2026-06-15', status: 'NEEDS REVIEW' }
];

export default function Research() {
  const { data } = useData();
  const [tab, setTab] = useState('active');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  
  const [selectedActive, setSelectedActive] = useState<string[]>([]);
  const toggleActive = (id: string) => setSelectedActive(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllActive = (ids: string[]) => setSelectedActive(prev => prev.length === ids.length ? [] : ids);

  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const toggleReport = (id: string) => setSelectedReports(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllReports = (ids: string[]) => setSelectedReports(prev => prev.length === ids.length ? [] : ids);

  const filteredActive = activeTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const filteredReports = generatedReports.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold font-heading m-0 text-slate-800">Research & Analytics</h2>
        </div>
        <Button variant="primary" onClick={() => setIsNewTaskOpen(true)}>
          <Plus size={14} /> New Research Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex gap-1 border-b border-slate-200 pb-2">
            <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'active' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('active'); setSearch(''); }}>Active Tasks ({filteredActive.length})</button>
            <button className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${tab === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} onClick={() => { setTab('reports'); setSearch(''); }}>Generated Reports ({filteredReports.length})</button>
          </div>

          <TableToolbar 
            search={search} 
            setSearch={setSearch} 
            count={tab === 'active' ? filteredActive.length : filteredReports.length}
            onExport={() => alert('Exporting...')}
            onAdvancedFilter={() => setAdvancedFilterOpen(true)}
            filters={<></>}
          />

          {tab === 'active' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
              <table className="dt min-w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedActive.length === filteredActive.length && filteredActive.length > 0} onChange={() => toggleAllActive(filteredActive.map(x=>x.id))} /></th>
                    <th className="px-4 py-3">ID</th><th className="px-4 py-3">Task Title</th><th className="px-4 py-3">Target Entity</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[12.5px] text-slate-700">
                  {filteredActive.map(t => (
                    <tr key={t.id} className={selectedActive.includes(t.id) ? 'bg-blue-50/50' : ''}>
                      <td className="px-4"><input type="checkbox" checked={selectedActive.includes(t.id)} onChange={() => toggleActive(t.id)} /></td>
                      <td className="font-mono text-[12px] text-text-dim">{t.id}</td>
                      <td className="font-medium text-slate-800">{t.title}</td>
                      <td>{t.entity}</td>
                      <td className={`font-medium ${t.assigned === 'Unassigned' ? 'text-red-500' : 'text-slate-700'}`}>{t.assigned}</td>
                      <td><Badge color={t.priority === 'CRITICAL' ? 'red' : t.priority === 'HIGH' ? 'amber' : 'blue'}>{t.priority}</Badge></td>
                      <td className="font-mono text-[12px] text-text-dim">{t.due}</td>
                      <td><Badge color={t.status === 'IN_PROGRESS' ? 'blue' : 'grey'}>{t.status.replace('_', ' ')}</Badge></td>
                      <td className="text-right pr-4">
                        <Button variant="default" size="sm" onClick={() => { setSelectedTask(t); setIsAssignOpen(true); }}>
                          Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination total={filteredActive.length} maxPerPage={100} />
            </div>
          )}

          {tab === 'reports' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
              <table className="dt min-w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-8"><input type="checkbox" checked={selectedReports.length === filteredReports.length && filteredReports.length > 0} onChange={() => toggleAllReports(filteredReports.map(x=>x.id))} /></th>
                    <th className="px-4 py-3">Report ID</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">Generated</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[12.5px] text-slate-700">
                  {filteredReports.map(r => (
                    <tr key={r.id} className={selectedReports.includes(r.id) ? 'bg-blue-50/50' : ''}>
                      <td className="px-4"><input type="checkbox" checked={selectedReports.includes(r.id)} onChange={() => toggleReport(r.id)} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.title}</td>
                      <td className="px-4 py-3">{r.author}</td>
                      <td className="px-4 py-3">{r.generated}</td>
                      <td className="px-4 py-3"><Badge color={r.status === 'APPROVED' ? 'green' : 'amber'}>{r.status}</Badge></td>
                      <td className="px-4 py-3 text-right pr-4"><Button size="sm" variant={r.status === 'APPROVED' ? 'ghost' : 'default'}>{r.status === 'APPROVED' ? 'View' : 'Review'}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination total={filteredReports.length} maxPerPage={100} />
            </div>
          )}
        </div>

        {/* Analyst Workspace Summary */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
              Analyst Workload
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">Live</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">SJ</div>
                  <span className="text-xs font-medium text-slate-700">Sarah Jenkins</span>
                </div>
                <span className="text-xs text-slate-500">2 active tasks</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">DC</div>
                  <span className="text-xs font-medium text-slate-700">David Chen</span>
                </div>
                <span className="text-xs text-slate-500">1 active task</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">AL</div>
                  <span className="text-xs font-medium text-slate-700">Aung Lin</span>
                </div>
                <span className="text-xs text-slate-500">0 active tasks</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
             <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Notes</h3>
             <div className="space-y-3">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-600 m-0">"High volatility detected in Retail sector employees during mid-month cycles. Recommending a 15% reduction in auto-approval threshold."</p>
                 <div className="text-[10px] text-slate-400 mt-2 text-right">— Sarah J. (2 hours ago)</div>
               </div>
             </div>
          </div>
        </div>
      </div>

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

      <Drawer isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} mode="center">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 m-0">Create Research Task</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Task Title</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" placeholder="e.g., Risk Audit for Acme Corp" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Entity / Scope</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
                <option>All Corporate</option>
                <option>SME Sector</option>
                {data.companies.map((c: any) => <option key={c.id}>{c.name} ({c.id})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description & Goals</label>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 min-h-[100px]" placeholder="Provide context and required outcomes..."></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsNewTaskOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsNewTaskOpen(false)}>Create Task</Button>
          </div>
        </div>
      </Drawer>

      <Drawer isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} mode="center">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 m-0">Assign Research Analyst</h2>
          {selectedTask && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-xs font-mono text-slate-400 mb-1">{selectedTask.id}</div>
              <div className="font-bold text-sm text-slate-800">{selectedTask.title}</div>
            </div>
          )}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <input type="radio" name="analyst" className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-slate-800">Sarah Jenkins</span>
              </div>
              <span className="text-xs text-slate-500">2 active tasks</span>
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <input type="radio" name="analyst" className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-slate-800">David Chen</span>
              </div>
              <span className="text-xs text-slate-500">1 active task</span>
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <input type="radio" name="analyst" className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-slate-800">Aung Lin</span>
              </div>
              <span className="text-xs text-slate-500">0 active tasks</span>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsAssignOpen(false)}>Assign Task</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
