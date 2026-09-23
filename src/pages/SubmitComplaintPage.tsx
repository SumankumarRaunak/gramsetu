import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ComplaintCategory,
  ComplaintPriority,
} from '../types';
import {
  Upload,
  Camera,
  CheckCircle2,
  FileText,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Printer,
  Sparkles,
  Layers,
  Building2,
  Zap,
  Droplets,
  Lightbulb,
  Route,
  Trash2,
  GraduationCap,
  HeartPulse,
} from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';

export const SubmitComplaintPage: React.FC = () => {
  const { user, addComplaint, setCurrentPage, complaints, language, t } = useApp();

  const [category, setCategory] = useState<ComplaintCategory>('street_light');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [village, setVillage] = useState(user.village || 'Saidpur Ghat');
  const [ward, setWard] = useState('Ward No. 05');
  const [panchayat, setPanchayat] = useState(user.panchayat || 'Runni Saidpur Uttari');
  const [landmark, setLandmark] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('important');
  const [prefSMS, setPrefSMS] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);
  const [evidenceUrl, setEvidenceUrl] = useState<string>('/src/assets/images/street_light_proof_1790113405855.jpg');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { key: ComplaintCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'road', label: t.cat_road, icon: <Route className="w-5 h-5 text-emerald-700" /> },
    { key: 'street_light', label: t.cat_street_light, icon: <Lightbulb className="w-5 h-5 text-emerald-700" /> },
    { key: 'water_supply', label: t.cat_water_supply, icon: <Droplets className="w-5 h-5 text-emerald-700" /> },
    { key: 'drainage', label: t.cat_drainage, icon: <Building2 className="w-5 h-5 text-emerald-700" /> },
    { key: 'garbage', label: t.cat_garbage, icon: <Trash2 className="w-5 h-5 text-slate-600" /> },
    { key: 'school', label: t.cat_school, icon: <GraduationCap className="w-5 h-5 text-emerald-700" /> },
    { key: 'health', label: t.cat_health, icon: <HeartPulse className="w-5 h-5 text-emerald-700" /> },
    { key: 'electricity', label: t.cat_electricity, icon: <Zap className="w-5 h-5 text-emerald-700" /> },
    { key: 'public_area', label: t.cat_public_area, icon: <Layers className="w-5 h-5 text-emerald-700" /> },
    { key: 'other', label: t.cat_other, icon: <FileText className="w-5 h-5 text-slate-600" /> },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const pickSampleImage = async (src: string) => {
    setEvidenceUrl(src);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      setEvidenceFile(
        new File([blob], src.split('/').pop() || 'evidence.jpg', { type: blob.type || 'image/jpeg' })
      );
    } catch {
      setEvidenceFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !village) return;
    if (!user.id) {
      setFormError(
        language === 'hi'
          ? 'शिकायत दर्ज करने के लिए कृपया पहले लॉगिन करें।'
          : 'Please login as a citizen before submitting a complaint.'
      );
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const newId = await addComplaint(
        {
          title,
          description,
          category,
          priority,
          status: 'pending',
          currentAuthority: 'Gram Panchayat Officer',
          submittedBy: {
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            citizenId: user.id,
          },
          location: {
            village,
            ward,
            panchayat,
            block: user.block || 'Runni Saidpur',
            district: user.district || 'Sitamarhi',
            landmark,
          },
          evidenceImageUrl: evidenceUrl,
          contactPreference: {
            sms: prefSMS,
            email: prefEmail,
          },
        },
        evidenceFile ? { file: evidenceFile } : undefined
      );

      setSubmittedId(newId);
      setEvidenceFile(null);
    } catch (err) {
      setFormError(
        language === 'hi'
          ? 'शिकायत दर्ज करने में विफल। कृपया पुनः प्रयास करें।'
          : (err as Error)?.message || 'Failed to register complaint. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const newlyCreatedComplaint = complaints.find((c) => c.id === submittedId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {submittedId && newlyCreatedComplaint ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto text-3xl shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block">
              Official Grievance Registered
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {language === 'hi' ? 'शिकायत सफलतापूर्वक दर्ज हो गई है' : 'Complaint Successfully Registered'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {language === 'hi'
                ? 'आपकी शिकायत संबंधित ग्राम पंचायत पदाधिकारी को भेज दी गई है। 7 दिनों में कार्रवाई न होने पर सिस्टम स्वतः मुखिया जी को अग्रेषित करेगा।'
                : 'Assigned to the Gram Panchayat Officer under the 7-Day Statutory SLA. If action is not taken within 7 days, this file will auto-escalate to the Mukhiya.'}
            </p>
          </div>

          {/* Generated ID Box */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Official Complaint Tracking ID
            </span>
            <span className="text-2xl font-mono font-bold text-emerald-950 block tracking-wider">
              {submittedId}
            </span>
            <span className="text-xs text-slate-500 block pt-0.5">
              Statutory Due Date: <strong className="text-slate-800 font-mono">{newlyCreatedComplaint.dueDate}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowReceipt(true)}
              className="btn btn-dark"
            >
              <Printer className="w-4 h-4" />
              <span>{t.btnDownloadReceipt}</span>
            </button>

            <button
              onClick={() => setCurrentPage('details')}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'टाइमलाइन व स्थिति देखें' : 'View Live Timeline'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setCurrentPage('authority_dashboard')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'hi' ? 'एडमिन कंट्रोल रूम में देखें' : 'View in Admin Console'}</span>
              </button>
            )}
          </div>

          {/* Printable Receipt Modal */}
          <ReceiptModal
            complaint={newlyCreatedComplaint}
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 space-y-2 border-b border-slate-800">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Right to Public Grievance Redressal Form</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t.submitPageHeading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {t.submitPageSub}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Step 1: Category */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                1. {t.formCategory} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1 cursor-pointer ${
                      category === cat.key
                        ? 'border-emerald-700 bg-emerald-50/80 font-bold text-slate-900 shadow-xs ring-1 ring-emerald-700'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{cat.icon}</div>
                    <span className="text-xs leading-tight mt-1">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Title */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                2. {t.formTitle} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.formTitlePlaceholder}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none"
              />
            </div>

            {/* Step 3: Description */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                3. {t.formDesc} *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.formDescPlaceholder}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none leading-relaxed"
              />
            </div>

            {/* Step 4: Location */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>4. {t.formLocation}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.formVillage} *
                  </label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white outline-none"
                    placeholder="Saidpur Ghat"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.formWard} *
                  </label>
                  <input
                    type="text"
                    required
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white outline-none"
                    placeholder="Ward No. 05"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.formPanchayat} *
                  </label>
                  <input
                    type="text"
                    required
                    value={panchayat}
                    onChange={(e) => setPanchayat(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white outline-none"
                    placeholder="Runni Saidpur Uttari"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.formLandmark}
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white outline-none"
                    placeholder="e.g. Near Pole #14, Primary School Gate"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Evidence */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                5. {t.formEvidence}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center hover:border-emerald-700 transition-colors bg-slate-50/50">
                  <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700">Upload Grievance Photograph</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 10MB</p>
                  <label className="mt-2 inline-block px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer shadow-2xs">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  {evidenceUrl ? (
                    <img
                      src={evidenceUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-xs text-slate-400">
                      No Photo
                    </div>
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-800">Attached Evidence Preview</p>
                    <p className="text-[10px] text-slate-500">Quick select sample:</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => pickSampleImage('/src/assets/images/street_light_proof_1790113405855.jpg')}
                        className="px-2 py-0.5 bg-white text-[10px] rounded border border-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        Street Light
                      </button>
                      <button
                        type="button"
                        onClick={() => pickSampleImage('/src/assets/images/water_tap_facility_1790113422572.jpg')}
                        className="px-2 py-0.5 bg-white text-[10px] rounded border border-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        Water Tap
                      </button>
                      <button
                        type="button"
                        onClick={() => pickSampleImage('/src/assets/images/smart_village_hero_1790113390546.jpg')}
                        className="px-2 py-0.5 bg-white text-[10px] rounded border border-slate-300 hover:bg-slate-100 cursor-pointer"
                      >
                        Road
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 & 7: Priority & Contact Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  6. {t.formPriority}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:border-emerald-700 outline-none"
                >
                  <option value="normal">{t.prio_normal}</option>
                  <option value="important">{t.prio_important}</option>
                  <option value="urgent">{t.prio_urgent}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  7. {t.formContactPref}
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefSMS}
                      onChange={(e) => setPrefSMS(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span className="text-xs text-slate-700">{t.formPrefSMS}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefEmail}
                      onChange={(e) => setPrefEmail(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span className="text-xs text-slate-700">{t.formPrefEmail}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full text-sm shadow-md"
              >
                <span>{isSubmitting ? 'Registering Grievance...' : t.btnSubmit}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
