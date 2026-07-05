import React from 'react';
import { useData } from '../context/DataContext';
import { Badge } from '../components/UI';

export default function Notifications() {
  const { data } = useData();

  return (
    <div className="space-y-4">
      <div className="view-head">
        <h1 className="font-heading font-bold text-[19px] m-0">Notifications</h1>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
        <table className="dt min-w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Content</th><th className="px-4 py-3">Time</th></tr>
          </thead>
          <tbody className="text-[12.5px] text-slate-700">
            {data.notifications.map((n: any) => (
              <tr key={n.id}>
                <td><Badge color={/ALERT|REJECT|PARTIAL/.test(n.status) ? 'red' : 'blue'}>{n.status.replace(/_/g, ' ')}</Badge></td>
                <td className="font-mono text-[12px] text-text-dim">{n.type}</td>
                <td className="font-semibold text-text-main">{n.title}</td>
                <td className="text-[11px] text-text-mute whitespace-normal max-w-[420px]">{n.content}</td>
                <td className="font-mono text-[12px] text-text-dim">{n.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
