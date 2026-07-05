import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Toaster } from './components/Toaster';
import { LayoutDashboard, Building2, Users, ArrowRightLeft, ScrollText, ShieldAlert, Bell, FileEdit, History, UserCog, Beaker, Settings2, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Companies from './views/Companies';
import Employees from './views/Employees';
import Transactions from './views/Transactions';
import Ledger from './views/Ledger';
import Risk from './views/Risk';
import Notifications from './views/Notifications';
import Forms from './views/Forms';
import Audit from './views/Audit';
import UsersView from './views/Users';
import Research from './views/Research';
import ConfigSystem from './views/ConfigSystem';
import { fmt } from './types';
import { INITIAL_DATA } from './types';

function Shell() {
  const { tabs, activeTabId, openTab, closeTab, closeAllTabs } = useData();
  const [pulseVal, setPulseVal] = useState(84210500);
  const [pulseTime, setPulseTime] = useState('just now');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (tabs.length === 0) {
      openTab('dashboard', 'dashboard', '📊 Dashboard');
    }
  }, [tabs, openTab]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const currentView = activeTab?.view || 'dashboard';

  const toggleGroup = (group: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    } else {
      setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const jitter = Math.floor(Math.random() * 40000) - 20000;
      setPulseVal(84210500 + jitter);
      setPulseTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const navGroups = [
    {
      group: 'Overview',
      items: [{ key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> }]
    },
    {
      group: 'Onboarding & Companies',
      items: [{ key: 'companies', label: 'Companies', icon: <Building2 size={14} />, count: INITIAL_DATA.companies.length }]
    },
    {
      group: 'People',
      items: [{ key: 'employees', label: 'Employees', icon: <Users size={14} />, count: INITIAL_DATA.employees.length }]
    },
    {
      group: 'Money Movement',
      items: [
        { key: 'transactions', label: 'Transactions', icon: <ArrowRightLeft size={14} /> },
        { key: 'ledger', label: 'Ledger & COA', icon: <ScrollText size={14} /> },
        { key: 'risk', label: 'Risk Exposure', icon: <ShieldAlert size={14} /> }
      ]
    },
    {
      group: 'Research & Operations',
      items: [
        { key: 'research', label: 'Research & Tasks', icon: <Beaker size={14} /> }
      ]
    },
    {
      group: 'Platform',
      items: [
        { key: 'config', label: 'System Config', icon: <Settings2 size={14} /> },
        { key: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
        { key: 'forms', label: 'Form Creator', icon: <FileEdit size={14} /> },
        { key: 'audit', label: 'Audit Log', icon: <History size={14} /> },
        { key: 'users', label: 'User Management', icon: <UserCog size={14} /> }
      ]
    }
  ];

  const viewComponents: any = {
    dashboard: Dashboard,
    companies: Companies,
    employees: Employees,
    transactions: Transactions,
    ledger: Ledger,
    risk: Risk,
    research: Research,
    config: ConfigSystem,
    notifications: Notifications,
    forms: Forms,
    audit: Audit,
    users: UsersView
  };

  const titles: any = {
    dashboard: 'Dashboard',
    companies: 'Companies',
    employees: 'Employees',
    transactions: 'Transactions',
    ledger: 'Ledger & Chart of Accounts',
    risk: 'Risk Exposure',
    research: 'Research & Tasks',
    config: 'System Configuration',
    notifications: 'Notifications',
    forms: 'Form Creator',
    audit: 'Audit Log',
    users: 'User Management'
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans text-slate-900 antialiased" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarCollapsed ? 'w-[72px]' : 'w-64'} flex-shrink-0 bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out`}>
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} min-h-[72px]`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center shrink-0">
                <span className="font-bold text-lg">E</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">EWA Admin</h1>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 shrink-0">
            <Menu size={20} />
          </button>
        </div>
        
        <nav className={`flex-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'} space-y-4 overflow-y-auto mt-2`}>
          {navGroups.map((g, i) => (
            <div key={i} className="flex flex-col gap-1">
              {!isSidebarCollapsed && (
                <div 
                  className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1 cursor-pointer hover:text-slate-300"
                  onClick={() => toggleGroup(g.group)}
                >
                  <span className="truncate">{g.group}</span>
                  {collapsedGroups[g.group] ? <ChevronRight size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />}
                </div>
              )}
              {isSidebarCollapsed && i !== 0 && (
                 <div className="h-px bg-slate-800 my-2 w-8 mx-auto" />
              )}
              {(!collapsedGroups[g.group] || isSidebarCollapsed) && g.items.map(it => {
                const isActive = currentView === it.key;
                return (
                  <div
                    key={it.key}
                    className={`group/item flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm transition-all cursor-pointer select-none ${isActive ? 'bg-slate-800 text-white font-medium border-l-4 border-blue-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    onClick={() => openTab(it.key, it.key, it.label)}
                    title={isSidebarCollapsed ? it.label : undefined}
                  >
                    <span className={isActive ? 'text-blue-400' : 'opacity-85'}>{it.icon}</span>
                    {!isSidebarCollapsed && <span className="flex-1 truncate">{it.label}</span>}
                    {!isSidebarCollapsed && (
                      <button
                        type="button"
                        title="Open parallel workspace tab"
                        onClick={(e) => {
                          e.stopPropagation();
                          const suffix = Math.floor(Math.random() * 900) + 100;
                          openTab(it.key, `${it.key}-parallel-${suffix}`, `${it.label} (${suffix})`);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-300 transition-opacity ml-1 cursor-pointer text-[10px] leading-none"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`p-4 mt-auto border-t border-slate-800 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2`}>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs shrink-0 cursor-pointer">RA</div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">Sarah Jenkins</p>
                <p className="text-[10px] text-slate-500 truncate">Senior Research Analyst</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header / Top Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center bg-slate-100 rounded-md px-3 py-1.5 w-96 border border-slate-200">
            <span className="text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search employees, transactions, or policy files..." className="bg-transparent border-none text-xs w-full focus:outline-none ml-2 text-slate-600" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot"></span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">System Online</span>
            </div>
            <button className="p-1.5 rounded-full hover:bg-slate-100 relative">
              <span className="text-slate-500"><Bell size={16} /></span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Status Bar */}
        <div className="flex items-center gap-4 px-6 h-10 shrink-0 border-b border-slate-200 bg-white">
          <div className="font-heading font-bold text-[12.5px] whitespace-nowrap text-slate-700">
            {titles[currentView]}
          </div>
          
          <div className="flex items-center gap-2.5 py-1 px-3 border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-500 flex-1 max-w-[520px] ml-auto rounded-md">
            <span className="w-[7px] h-[7px] bg-green-500 shrink-0 animate-pulse-dot rounded-full"></span>
            <span className="text-green-600 font-semibold tracking-[.02em]">BALANCED</span>
            <span className="text-slate-300">|</span>
            <span>DR <span className="text-blue-600">{fmt(pulseVal)}</span></span>
            <span className="text-slate-300">=</span>
            <span>CR <span className="text-green-600">{fmt(pulseVal)}</span></span>
            <span className="text-slate-300">·</span>
            <span>{pulseTime}</span>
          </div>
        </div>

        {/* Modern Browser-style Tab Bar */}
        <div className="flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 h-9 shrink-0 select-none">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none h-full pt-1.5">
            {tabs.map(t => {
              const isActive = t.id === activeTabId;
              return (
                <div
                  key={t.id}
                  onClick={() => openTab(t.view, t.id, t.title, t.params)}
                  className={`group flex items-center gap-2 px-3 py-1.5 h-full rounded-t-lg transition-all cursor-pointer font-medium text-[11.5px] border-t-2 ${isActive ? 'bg-[#f8fafc] text-slate-800 border-blue-500 shadow-sm font-semibold' : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-transparent'}`}
                >
                  <span className="truncate max-w-[120px]">{t.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(t.id);
                    }}
                    className="opacity-40 group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-800 rounded p-0.5 text-[9px] font-bold"
                    title="Close tab"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => closeAllTabs()}
              className="text-[10px] text-slate-400 hover:text-rose-400 bg-slate-850 hover:bg-slate-800 px-2 py-1 rounded transition-colors font-semibold"
              title="Close all open tabs"
            >
              Close All Tabs
            </button>
          </div>
        </div>

        {/* Viewport with alive background tabs */}
        <div className="flex-1 relative overflow-auto p-6 pb-20 bg-[#f8fafc]">
          {tabs.map(t => {
            const ViewComponent = viewComponents[t.view] || Dashboard;
            const isTabActive = t.id === activeTabId;
            return (
              <div 
                key={t.id} 
                className={isTabActive ? 'block h-full w-full' : 'hidden'}
              >
                <ViewComponent params={t.params} />
              </div>
            );
          })}
        </div>
      </main>
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}
