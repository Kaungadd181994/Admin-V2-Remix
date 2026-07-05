import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, StatusBadge, TableToolbar, TablePagination, Drawer } from '../components/UI';

export default function Users() {
  const { data, updateData, pushAudit, addToast } = useData();
  const [search, setSearch] = useState('');
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) => setSelected(prev => prev.length === ids.length ? [] : ids);

  const filtered = data.users.filter((u: any) => (u.name + u.email + u.role).toLowerCase().includes(search.toLowerCase()));

  const handleAddUser = () => {
    const newId = 'U-0' + (data.users.length + 1);
    const newUser = { id: newId, name: 'New Team Member', email: 'new.user@ewa.platform', role: 'Ops Staff (Maker)', scope: 'Myanmar', status: 'ACTIVE', last: 'just now' };
    updateData({ users: [...data.users, newUser] });
    pushAudit('USER_CREATE', newId, 'New Team Member added');
    addToast('User created', 'Invitation email queued.');
  };

  const toggleStatus = (id: string) => {
    const u = data.users.find(x => x.id === id);
    if (!u) return;
    const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateData({ users: data.users.map(x => x.id === id ? { ...x, status: newStatus } : x) });
    pushAudit('USER_STATUS_CHANGE', u.id, 'Set to ' + newStatus);
    addToast('User updated', `${u.name} is now ${newStatus}.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0 mb-1">User Management</h1>
          <p className="m-0 text-text-dim text-[12.5px] max-w-[640px]">Internal platform users: Admin, Risk, Finance and Operations, each scoped by role.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="primary" onClick={handleAddUser}>+ Add User</Button>
        </div>
      </div>

      <TableToolbar 
        search={search} 
        setSearch={setSearch} 
        count={filtered.length}
        onExport={() => addToast('Exporting Data', 'Downloading CSV...', 'ok')}
        onAdvancedFilter={() => setAdvancedFilterOpen(true)}
        filters={<></>}
      />

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm p-1">
        <table className="dt min-w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={() => toggleAll(filtered.map((x: any)=>x.id))} /></th>
              <th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last Active</th><th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px] text-slate-700">
            {filtered.map((u: any) => (
              <tr key={u.id} className={selected.includes(u.id) ? 'bg-blue-50/50' : ''}>
                <td className="px-4"><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} /></td>
                <td><span className="font-semibold text-text-main">{u.name}</span><div className="text-[11px] text-text-mute mt-0.5">{u.id}</div></td>
                <td className="font-mono text-[12px] text-text-dim">{u.email}</td>
                <td>{u.role}</td>
                <td>{u.scope}</td>
                <td><StatusBadge status={u.status} /></td>
                <td className="font-mono text-[12px] text-text-dim">{u.last}</td>
                <td className="flex gap-2 justify-end pr-4">
                  <Button size="sm" onClick={() => toggleStatus(u.id)}>{u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</Button>
                  <Button size="sm" variant="ghost">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination total={filtered.length} maxPerPage={100} />
      </div>

      <Drawer isOpen={advancedFilterOpen} onClose={() => setAdvancedFilterOpen(false)} mode="right">
        <div className="flex items-start justify-between p-4.5 px-5 border-b border-line sticky top-0 bg-panel z-10">
          <div><h2 className="m-0 mb-1 text-[16px] font-heading font-bold">Advanced Filters</h2><div className="text-[11.5px] text-text-mute">Refine table results</div></div>
          <button className="w-[30px] h-[30px] border border-line bg-panel-2 flex items-center justify-center text-text-dim hover:text-text-main cursor-pointer shrink-0" onClick={() => setAdvancedFilterOpen(false)}>✕</button>
        </div>
        <div className="p-4.5 px-5 space-y-4">
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Role</label><select className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary"><option>All</option><option>Admin</option><option>Risk</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-[10.5px] text-text-mute uppercase tracking-[.05em]">Status</label><select className="h-9 bg-panel-2 border border-line text-text-main px-2.5 text-[12.5px] outline-none focus:border-primary"><option>All</option><option>Active</option></select></div>
          <div className="flex gap-2 mt-4 pt-2">
            <Button variant="primary" onClick={() => setAdvancedFilterOpen(false)}>Apply Filters</Button>
            <Button variant="ghost" onClick={() => setAdvancedFilterOpen(false)}>Clear</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
