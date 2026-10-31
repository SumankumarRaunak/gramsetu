import React from 'react';
import { useApp } from '../context/AppContext';
import logoImage from '../assets/images/logo.jpg';
import { ShieldCheck, Phone, Mail, MapPin, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, t } = useApp();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Government Identity with Seal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-emerald-600/40 bg-emerald-950 flex items-center justify-center shrink-0">
                <img
                  src={logoImage}
                  alt="GramSetu Seal"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm tracking-tight">GramSetu</h4>
                <p className="text-[11px] text-emerald-400 font-medium">GramSetu Portal</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering rural citizens with direct, transparent, and multi-tier accountable governance across Gram Panchayats.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 rounded-lg text-[11px] text-slate-300 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Right to Public Grievance Redressal Act</span>
            </div>
          </div>

          {/* Col 2: 4-Tier Administrative Escalation */}
          <div>
            <h5 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Escalation Ladder</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Tier 1: Gram Panchayat Officer (Sachiv)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Tier 2: Mukhiya (Panchayat Head)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Tier 3: Block Development Officer (BDO)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Tier 4: District Magistrate (DM Collectorate)</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h5 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Citizen Services</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setCurrentPage('submit')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t.btnSubmitComplaint}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('track')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t.btnTrackComplaint}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('my_complaints')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t.navMyComplaints}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('feedback_help')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('authority_dashboard')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Gram Panchayat Officer Console</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Emergency Helpline */}
          <div>
            <h5 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Emergency Helpline</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <a href="tel:9142946979" className="text-white font-bold block font-mono text-sm hover:text-emerald-400 transition-colors">
                    9142946979
                  </a>
                  <span className="text-[11px] text-emerald-400 font-medium">इमरजेंसी हेल्पलाइन (S K Raunak)</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <a href="mailto:suman914294@gmail.com" className="text-slate-300 hover:text-white transition-colors block font-mono text-xs">
                    suman914294@gmail.com
                  </a>
                  <span className="text-[10px] text-slate-500">Official Support Email</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-300 block leading-snug">
                    S K Raunak, SOCSE Department, Sandip University sijoul Madhubani Bihar 847235
                  </span>
                  <span className="text-[10px] text-slate-500">District: Madhubani · PIN: 847235</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
          <p>© 2026 GramSetu Grievance Governance. Government of Bihar. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with care for rural empowerment</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
