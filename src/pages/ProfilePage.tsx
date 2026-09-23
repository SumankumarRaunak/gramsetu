import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabaseClient';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Edit,
  Key,
  LogOut,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, logout, language, t } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isUpdatingMobile, setIsUpdatingMobile] = useState(false);

  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editVillage, setEditVillage] = useState(user.village);
  const [editWard, setEditWard] = useState(user.ward);
  const [editPanchayat, setEditPanchayat] = useState(user.panchayat);
  const [editMobile, setEditMobile] = useState(user.mobile);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditVillage(user.village);
    setEditWard(user.ward);
    setEditPanchayat(user.panchayat);
    setEditMobile(user.mobile);
  }, [user.name, user.email, user.village, user.ward, user.panchayat, user.mobile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        name: editName,
        email: editEmail,
        village: editVillage,
        ward: editWard,
        panchayat: editPanchayat,
      });
      setIsEditing(false);
      setStatusMsg('Profile updated successfully.');
    } catch (err) {
      setStatusMsg((err as Error)?.message || 'Failed to update profile.');
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSaveMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editMobile.length >= 10) {
      try {
        await updateUserProfile({ mobile: editMobile });
        setIsUpdatingMobile(false);
        setStatusMsg('Mobile number updated successfully.');
      } catch (err) {
        setStatusMsg((err as Error)?.message || 'Failed to update mobile number.');
      }
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setIsChangingPass(false);
      setStatusMsg('Password changed successfully.');
    } catch (err) {
      setStatusMsg((err as Error)?.message || 'Failed to change password.');
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.profileTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === 'hi'
            ? 'नागरिक पहचान, ग्राम पंचायत अधिकार क्षेत्र एवं संपर्क विवरण'
            : 'Citizen identity credentials, Gram Panchayat jurisdiction, and contact preferences'}
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-8">
        {/* Top Identification Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
              {user.name.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full border border-slate-200 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 capitalize">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Citizen ID: {user.id}</p>
            <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>{user.village}, {user.ward}, {user.district}</span>
            </p>
          </div>
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Full Name
            </span>
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Email Address
            </span>
            <p className="text-sm font-bold text-slate-900 font-mono truncate">{user.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Registered Mobile
            </span>
            <p className="text-sm font-bold text-slate-900 font-mono">
              +91 {user.mobile.slice(0, 2)}******{user.mobile.slice(-2)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Village & Ward
            </span>
            <p className="text-sm font-bold text-slate-900">{user.village} ({user.ward})</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Panchayat
            </span>
            <p className="text-sm font-bold text-slate-900">{user.panchayat}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Block & District
            </span>
            <p className="text-sm font-bold text-slate-900">{user.block}, {user.district}</p>
          </div>
        </div>

        {/* 4 Required Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{t.btnEditProfile}</span>
            </button>

            <button
              onClick={() => setIsChangingPass(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{t.btnChangePassword}</span>
            </button>

            <button
              onClick={() => setIsUpdatingMobile(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t.btnUpdateMobile}</span>
            </button>
          </div>

          <button
            onClick={() => void logout()}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.btnLogout}</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">{t.btnEditProfile}</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Village</label>
                  <input
                    type="text"
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ward</label>
                  <input
                    type="text"
                    value={editWard}
                    onChange={(e) => setEditWard(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">{t.btnChangePassword}</h3>
              <button onClick={() => setIsChangingPass(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Mobile Modal */}
      {isUpdatingMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">{t.btnUpdateMobile}</h3>
              <button onClick={() => setIsUpdatingMobile(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMobile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdatingMobile(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
