import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ComplaintCategory,
  ComplaintPriority,
} from '../types';
import {
  Camera,
  FileText,
  MapPin,
  ArrowRight,
  ShieldCheck,
  LocateFixed,
} from 'lucide-react';

export const SubmitComplaintPage: React.FC = () => {
  const { user, addComplaint, setCurrentPage, setSelectedComplaintId, language, t } = useApp();

  const [category, setCategory] = useState<ComplaintCategory>('street_light');
  const [description, setDescription] = useState('');
  const [village, setVillage] = useState(user.village || '');
  const [ward, setWard] = useState(user.ward || '');
  const [panchayat, setPanchayat] = useState(user.panchayat || '');
  const [landmark, setLandmark] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('important');
  const [prefSMS, setPrefSMS] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locMsg, setLocMsg] = useState('');

  useEffect(() => {
    if (user.village) setVillage(user.village);
    if (user.ward) setWard(user.ward);
    if (user.panchayat) setPanchayat(user.panchayat);
  }, [user.village, user.ward, user.panchayat]);

  const categories: { key: ComplaintCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'road', label: t.cat_road, icon: <FileText className="w-5 h-5 text-slate-600" /> },
    { key: 'street_light', label: t.cat_street_light, icon: <FileText className="w-5 h-5 text-amber-600" /> },
    { key: 'water_supply', label: t.cat_water_supply, icon: <FileText className="w-5 h-5 text-sky-600" /> },
    { key: 'drainage', label: t.cat_drainage, icon: <FileText className="w-5 h-5 text-cyan-700" /> },
    { key: 'garbage', label: t.cat_garbage, icon: <FileText className="w-5 h-5 text-slate-600" /> },
    { key: 'school', label: t.cat_school, icon: <FileText className="w-5 h-5 text-violet-600" /> },
    { key: 'health', label: t.cat_health, icon: <FileText className="w-5 h-5 text-rose-600" /> },
    { key: 'electricity', label: t.cat_electricity, icon: <FileText className="w-5 h-5 text-yellow-500" /> },
    { key: 'public_area', label: t.cat_public_area, icon: <FileText className="w-5 h-5 text-emerald-600" /> },
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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocMsg(
        language === 'hi'
          ? 'यह ब्राउज़र जियोलोकेशन सपोर्ट नहीं करता।'
          : 'This browser does not support geolocation. You can enter the landmark manually.'
      );
      return;
    }
    setIsLocating(true);
    setLocMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLandmark((prev) => (prev ? prev : `GPS: ${lat}, ${lng}`));
        setLocMsg(
          language === 'hi'
            ? `स्थान प्राप्त हुआ: ${lat}, ${lng}`
            : `Location captured: ${lat}, ${lng}`
        );
        setIsLocating(false);
      },
      (err) => {
        setLocMsg(
          language === 'hi'
            ? 'स्थान अनुमति प्राप्त नहीं हुई। ब्राउज़र में स्थान अनुमति दें (https/localhost आवश्यक) और दोबारा प्रयास करें।'
            : `Location permission was not granted (${err.message}). Allow location access in the browser and try again — or enter the landmark manually.`
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !village) return;
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
           title: categories.find((item) => item.key === category)?.label || category,
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
            block: user.block || '',
            district: user.district || '',
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

      setSelectedComplaintId(newId);
      setCurrentPage('details');
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Right to Public Grievance Redressal Form</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t.submitPageHeading}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            {t.submitPageSub}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Category */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                {t.formCategory} *
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

             {/* Step 2: Complaint description */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                {t.formDesc} *
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

             {/* Step 3: Location */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-emerald-800" />
                <span>{t.formLocation}</span>
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

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-700/40 text-emerald-900 font-semibold text-xs rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>
                    {isLocating
                      ? language === 'hi'
                        ? 'स्थान लिया जा रहा है...'
                        : 'Locating...'
                      : language === 'hi'
                      ? 'मेरा स्थान (GPS) उपयोग करें'
                      : 'Use My Location (GPS)'}
                  </span>
                </button>
                <span
                  className={`text-[11px] ${
                    locMsg.startsWith('Location captured') || locMsg.startsWith('स्थान प्राप्त')
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}
                >
                  {locMsg ||
                    (language === 'hi'
                      ? 'स्थान वैकल्पिक है — लैंडमार्क के रूप में जीपीएस निर्देशांक अपने-आप भर जाएंगे।'
                      : 'Optional — GPS coordinates auto-fill into the landmark field.')}
                </span>
              </div>
            </div>

             {/* Step 4: Evidence */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                {t.formEvidence}
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
                    <p className="text-[10px] text-slate-500">
                      {language === 'hi' ? 'समस्या की तस्वीर अपलोड करें (वैकल्पिक)' : 'Upload a photo of the issue (optional)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

             {/* Step 5 & 6: Priority & Contact Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                {t.formPriority}
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
                  {t.formContactPref}
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
            <div className="pt-4 border-t border-slate-200 space-y-3">
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
  );
};
