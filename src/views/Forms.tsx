import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button, Toggle } from '../components/UI';

const FIELD_TYPES = ['Text','Number','Email','Phone','Date','Dropdown','Radio','Checkbox','File Upload','Signature Pad','NRC Scanner','Selfie Capture'];

export default function Forms() {
  const { pushAudit, addToast } = useData();
  const [fields, setFields] = useState<any[]>([
    {id:1,label:'NRC Number',type:'NRC Scanner',required:true},
    {id:2,label:'Bank Statement (6mo)',type:'File Upload',required:true},
    {id:3,label:'Signature',type:'Signature Pad',required:true},
  ]);
  const [fieldSeq, setFieldSeq] = useState(4);

  const addField = (type: string) => {
    setFields([...fields, { id: fieldSeq, label: type + ' Field', type, required: false }]);
    setFieldSeq(fieldSeq + 1);
  };

  const removeField = (id: number) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const toggleRequired = (id: number) => {
    setFields(fields.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  const handlePublish = () => {
    pushAudit('FORM_PUBLISHED','KYC-FORM', `v3 published with ${fields.length} fields`);
    addToast('Form published', 'Company KYC Form v3 is now active for CORPORATE tenants.');
  };

  const schema = {
    form: 'company_kyc_v3',
    fields: fields.map(f => ({ id: 'f'+f.id, label: f.label, type: f.type, required: f.required }))
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-heading font-bold text-[19px] m-0 mb-1">Form Creator</h1>
          <p className="m-0 text-text-dim text-[12.5px] max-w-[640px]">Build dynamic KYC / KYB forms for a company or tenant. No-code — assign per company type, preview, and publish.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="primary" onClick={handlePublish}>Publish Version</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_320px] gap-4 min-h-[520px]">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Field Palette</div>
          {FIELD_TYPES.map(t => (
            <div key={t} className="px-3 py-2 border border-slate-200 mb-2 rounded-lg text-xs font-medium bg-slate-50 flex items-center gap-2 cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all text-slate-700" onClick={() => addField(t)}>
              ＋ {t}
            </div>
          ))}
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Company KYC Form — v3 (draft)</div>
          {fields.length > 0 ? (
            fields.map(f => (
              <div key={f.id} className="border border-slate-200 bg-slate-50 p-3 mb-3 rounded-lg flex items-center justify-between gap-3 shadow-sm hover:border-blue-300 transition-colors">
                <div>
                  <div className="font-bold text-sm text-slate-800">{f.label}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">{f.type} {f.required ? '· required' : '· optional'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle isOn={f.required} onToggle={() => toggleRequired(f.id)} />
                  <button className="bg-transparent border-none text-slate-400 text-[16px] cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeField(f.id)}>✕</button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg"><div className="text-2xl mb-2">⚏</div>No fields yet — add from the palette.</div>
          )}
          <div className="text-xs font-medium text-slate-500 mt-3 text-center">Click a palette item to add it here. Toggle "required" or remove a field.</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">JSON Schema Preview</div>
          <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-green-400 whitespace-pre-wrap flex-1 overflow-auto m-0 shadow-inner">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
