import React, { createContext, useContext, useState, ReactNode } from 'react';
import { INITIAL_DATA } from '../types';

export interface Tab {
  id: string;
  title: string;
  view: string;
  params?: any;
}

interface DataContextType {
  data: typeof INITIAL_DATA;
  updateData: (newData: Partial<typeof INITIAL_DATA>) => void;
  toasts: any[];
  addToast: (title: string, message: string, kind?: 'ok' | 'warn' | 'error') => void;
  pushAudit: (action: string, entity: string, detail: string, actor?: string) => void;
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  openTab: (view: string, id?: string, title?: string, params?: any) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
}

export const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [toasts, setToasts] = useState<any[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'dashboard', title: 'Dashboard', view: 'dashboard' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard');

  const updateData = (newData: Partial<typeof INITIAL_DATA>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };
  
  const addToast = (title: string, message: string, kind: 'ok' | 'warn' | 'error' = 'ok') => {
    const id = Date.now();
    setToasts(t => [...t, { id, title, message, kind }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, 3200);
  };

  const pushAudit = (action: string, entity: string, detail: string, actor = 'current.user@ewa') => {
    const newLog = {
      ts: new Date().toISOString().slice(0,16).replace('T',' '),
      actor, role: 'Session User', action, entity, detail, ip: '—'
    };
    setData(prev => ({ ...prev, auditLogs: [newLog, ...prev.auditLogs] }));
  };

  const openTab = (view: string, id?: string, title?: string, params?: any) => {
    const tabId = id || view;
    const tabTitle = title || view.charAt(0).toUpperCase() + view.slice(1);
    setTabs(prev => {
      if (prev.some(t => t.id === tabId)) {
        return prev;
      }
      return [...prev, { id: tabId, title: tabTitle, view, params }];
    });
    setActiveTabId(tabId);
  };

  const closeTab = (id: string) => {
    setTabs(prev => {
      const nextTabs = prev.filter(t => t.id !== id);
      if (nextTabs.length === 0) {
        setActiveTabId('dashboard');
        return [{ id: 'dashboard', title: 'Dashboard', view: 'dashboard' }];
      }
      if (activeTabId === id) {
        const closedIndex = prev.findIndex(t => t.id === id);
        const nextActiveIndex = Math.max(0, closedIndex - 1);
        const fallbackTab = nextTabs[nextActiveIndex] || nextTabs[0];
        setActiveTabId(fallbackTab.id);
      }
      return nextTabs;
    });
  };

  const closeAllTabs = () => {
    setTabs([{ id: 'dashboard', title: 'Dashboard', view: 'dashboard' }]);
    setActiveTabId('dashboard');
  };

  return (
    <DataContext.Provider value={{ 
      data, updateData, toasts, addToast, pushAudit,
      tabs, activeTabId, setActiveTabId, openTab, closeTab, closeAllTabs
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
