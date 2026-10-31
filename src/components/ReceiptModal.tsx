import React, { useState } from 'react';
import { Complaint } from '../types';
import { useApp } from '../context/AppContext';
import { Printer, X, CheckCircle2, ShieldCheck, QrCode, MapPin, Calendar, Clock, Download, Landmark } from 'lucide-react';
import { generateComplaintReceiptPdf } from '../lib/pdf';

interface ReceiptModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ complaint, isOpen, onClose }) => {
  const { language, t } = useApp();
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsBusy(true);
    try {
      const bytes = await generateComplaintReceiptPdf(complaint);
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const blob = new Blob([buf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${complaint.id}-acknowledgement.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header bar */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between print:bg-emerald-950">
          <div className="flex items-center gap-3">
            <Landmark className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {language === 'hi' ? 'ग्राम सेतु पावती रसीद' : 'GramSetu Official Acknowledgement Slip'}
              </h3>
              <p className="text-[11px] text-emerald-300">
                Panchayati Raj Department · Govt of Bihar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-slate-300 hover:text-white transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slip Body */}
        <div className="p-6 space-y-6 text-slate-800">
          {/* Top Verification Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                {language === 'hi' ? 'शिकायत क्रमांक (Complaint ID)' : 'Official Complaint ID'}
              </span>
              <span className="text-xl font-mono font-bold text-emerald-950 tracking-wider">
                {complaint.id}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'पोर्टल पर सत्यापित एवं पंजीकृत' : 'Verified & Registered on Portal'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto p-2 bg-white rounded-lg border border-emerald-100 shadow-xs">
              <QrCode className="w-12 h-12 text-slate-800" />
              <div className="text-[10px] text-slate-500 leading-tight">
                <span className="font-semibold text-slate-700 block">QR Authenticated</span>
                <span>Scan to verify live status</span>
              </div>
            </div>
          </div>

          {/* Citizen & Location Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Citizen Name
              </span>
              <p className="font-bold text-slate-900">{complaint.submittedBy.name}</p>
              <p className="text-slate-600 font-mono text-[11px]">Mob: {complaint.submittedBy.mobile}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Jurisdiction Location
              </span>
              <p className="font-bold text-slate-900">{complaint.location.village}, {complaint.location.ward}</p>
              <p className="text-slate-600 text-[11px]">{complaint.location.panchayat}, {complaint.location.district}</p>
            </div>
          </div>

          {/* Grievance Summary */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-slate-500">Problem Category:</span>
              <span className="text-xs font-bold text-emerald-800 capitalize">
                {t[`cat_${complaint.category}` as keyof typeof t] || complaint.category}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Complaint Subject:</span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">{complaint.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted: <strong className="text-slate-800">{complaint.createdAt}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Due Date: <strong className="text-emerald-800">{complaint.dueDate}</strong></span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                  Assigned Authority (Tier 1)
                </span>
                <span className="font-bold">{complaint.currentAuthority}</span>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-emerald-100 rounded text-emerald-800">
                7 Days SLA
              </span>
            </div>
          </div>

          {/* Legal Notice & Helpline */}
          <div className="border-t border-slate-200 pt-3 space-y-1">
            <p className="text-[10px] text-slate-500 italic leading-normal">
              Note: Under Bihar Right to Public Grievance Redressal, if no action is initiated within 7 statutory working days, the case automatically escalates. Keep this ID safe for Web tracking.
            </p>
            <p className="text-[10px] font-mono text-emerald-800 font-bold">
              इमरजेंसी हेल्पलाइन: 9142946979 · ईमेल: suman914294@gmail.com · S K Raunak, SOCSE Dept, Sandip University, Sijoul, Madhubani (847235)
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isBusy}
              className="btn btn-dark"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBusy ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'hi' ? 'रसीद प्रिंट करें' : 'Print Slip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
