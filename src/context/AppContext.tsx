import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AuthorityTier,
  Complaint,
  ComplaintStatus,
  Language,
  NotificationItem,
  UserProfile,
  UserRole,
} from '../types';
import { translations } from '../translations';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  AuthorityRow,
  callForward,
  callReject,
  callSubmitFeedback,
  callUpdateStatus,
  callVerify,
  fetchAuthorities,
  fetchComplaints,
  fetchUserProfile,
  getCategories,
  insertComplaint,
  resolveDbId,
  uiCategoryToSlug,
  updateAuthorityProfile,
  updateCitizenProfile,
  uploadEvidence,
} from '../lib/api';
import { ROLE_TIER } from '../lib/roleTiers';

export type PageId =
  | 'landing'
  | 'register'
  | 'login'
  | 'dashboard'
  | 'submit'
  | 'track'
  | 'details'
  | 'my_complaints'
  | 'notifications'
  | 'profile'
  | 'feedback_help'
  | 'authority_dashboard';

export interface AuthorityProfile extends AuthorityRow {
  id: string;
}

interface AppContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  complaints: Complaint[];
  selectedComplaintId: string | null;
  setSelectedComplaintId: (id: string | null) => void;
  notifications: NotificationItem[];
  addComplaint: (
    data: Omit<Complaint, 'id' | 'createdAt' | 'dueDate' | 'daysLeft' | 'timeline' | 'officialRemarks'>,
    options?: { file?: File }
  ) => Promise<string>;
  updateComplaintStatus: (
    id: string,
    status: ComplaintStatus,
    newAuthority?: AuthorityTier,
    remark?: string,
    proofUrl?: string
  ) => Promise<void>;
  forwardComplaint: (id: string, targetTier: AuthorityTier | string, reason: string) => Promise<void>;
  verifyComplaint: (id: string, remark?: string) => Promise<void>;
  rejectComplaint: (id: string, remark?: string) => Promise<void>;
  simulateAutoEscalation: (id: string) => Promise<void>;
  submitFeedback: (id: string, rating: number, status: 'yes' | 'partially' | 'no', comment: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateUserProfile: (updated: Partial<UserProfile>) => Promise<void>;
  login: (identifier: string, password: string) => Promise<UserRole>;
  register: (fields: {
    fullName: string;
    email: string;
    mobile: string;
    village: string;
    ward: string;
    panchayat: string;
    block: string;
    district: string;
    password: string;
  }) => Promise<{ needsEmailConfirm: boolean }>;
  logout: () => Promise<void>;
  refreshComplaints: () => Promise<void>;
  authorities: AuthorityProfile[];
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  t: typeof translations.en;
  selectedComplaint: Complaint | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const guestUser: UserProfile = {
  id: '',
  name: 'Guest Citizen',
  email: '',
  mobile: '',
  village: '',
  ward: '',
  panchayat: '',
  block: '',
  district: '',
  role: 'citizen',
};

const READ_NOTIF_KEY = 'smart_village_read_notifs_v1';

const PAGE_PATH: Partial<Record<PageId, string>> = {
  landing: '/',
  dashboard: '/dashboard',
  submit: '/submit',
  track: '/track',
  my_complaints: '/my-complaints',
  notifications: '/notifications',
  profile: '/profile',
  feedback_help: '/feedback-help',
  register: '/register',
  login: '/login',
  authority_dashboard: '/authority',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = useMemo<PageId>(() => {
    const { pathname } = location;
    if (pathname === '/') return 'landing';
    if (pathname.startsWith('/details/')) return 'details';
    for (const [page, path] of Object.entries(PAGE_PATH)) {
      if (pathname === path) return page as PageId;
    }
    return 'landing';
  }, [location.pathname]);

  const [selectedComplaintId, setSelectedState] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  const setSelectedComplaintId = useCallback((cid: string | null) => {
    selectedIdRef.current = cid;
    setSelectedState(cid);
  }, []);

  const setCurrentPage = useCallback(
    (page: PageId) => {
      if (page === 'details') {
        const cid = selectedIdRef.current;
        if (cid) navigate(`/details/${encodeURIComponent(cid)}`);
        return;
      }
      navigate(PAGE_PATH[page] ?? '/');
    },
    [navigate]
  );

  useEffect(() => {
    const m = location.pathname.match(/^\/details\/([^/]+)$/);
    if (m) {
      const cid = decodeURIComponent(m[1]);
      if (cid && cid !== selectedIdRef.current) {
        selectedIdRef.current = cid;
        setSelectedState(cid);
      }
    }
  }, [location.pathname]);

  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<UserProfile>(guestUser);
  const [role, setRole] = useState<UserRole>('citizen');
  const [session, setSession] = useState<Session | null>(null);
  const [authorityId, setAuthorityId] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [authorities, setAuthorities] = useState<AuthorityProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readNotifs, setReadNotifs] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(READ_NOTIF_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const notificationsRef = useRef<NotificationItem[]>([]);

  const t = translations[language];

  // -------------------------------------------------------------------------
  // Auth session + profile loading
  // -------------------------------------------------------------------------

  const loadProfileForUser = useCallback(async (userRecord: Session['user'] | null | undefined) => {
    if (!userRecord) {
      setUser(guestUser);
      setRole('citizen');
      setAuthorityId(null);
      setIsLoading(false);
      return;
    }
    try {
      const found = await fetchUserProfile(userRecord.id);
      if (found?.role === 'admin') {
        const p = found.profile as { name: string; email: string; phone?: string };
        setUser({
          id: userRecord.id,
          name: p.name,
          email: p.email,
          mobile: p.phone || '',
          village: '',
          ward: '',
          panchayat: '',
          block: '',
          district: '',
          role: 'admin',
        });
        setRole('admin');
        setAuthorityId(null);
      } else if (found?.role === 'authority') {
        const p = found.profile as { name: string; email: string; phone?: string; designation?: string };
        const uiRole = ROLE_TIER[(p as Record<string, string>).role] || 'block_officer';
        setUser({
          id: userRecord.id,
          name: p.name,
          email: p.email,
          mobile: p.phone || '',
          village: '',
          ward: '',
          panchayat: '',
          block: '',
          district: '',
          role: uiRole,
          designation: p.designation,
        });
        setRole(uiRole);
        setAuthorityId(found.authorityId || null);
      } else if (found?.role === 'citizen') {
        const p = found.profile as { full_name: string; email: string; phone?: string } & Record<string, string>;
        setUser({
          id: userRecord.id,
          name: p.full_name,
          email: p.email,
          mobile: p.phone || '',
          village: p.village || '',
          ward: p.ward || '',
          panchayat: p.panchayat || '',
          block: p.block || '',
          district: p.district || '',
          role: 'citizen',
        });
        setRole('citizen');
        setAuthorityId(null);
      } else {
        // Auth user without a profile row yet: self-heal by creating one.
        const meta = (userRecord.user_metadata || {}) as Record<string, string>;
        await supabase.from('users').insert({
          id: userRecord.id,
          full_name: meta.full_name || meta.name || 'New Citizen',
          email: userRecord.email || '',
          phone: meta.phone || '',
          village: '',
          ward: '',
          panchayat: '',
          block: '',
          district: '',
        });
        setUser({
          id: userRecord.id,
          name: meta.full_name || 'New Citizen',
          email: userRecord.email || '',
          mobile: meta.phone || '',
          village: '',
          ward: '',
          panchayat: '',
          block: '',
          district: '',
          role: 'citizen',
        });
        setRole('citizen');
        setAuthorityId(null);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load profile', err);
      setUser(guestUser);
      setRole('citizen');
      setAuthorityId(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfileForUser(data.session?.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfileForUser(newSession?.user);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfileForUser]);

  const isAuthenticated = !!session;

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const refreshComplaints = useCallback(async () => {
    const scope = role === 'admin' ? 'admin' : role === 'citizen' ? 'citizen' : 'authority';
    try {
      const list = await fetchComplaints({
        scope,
        userId: role === 'citizen' ? user.id : undefined,
        authorityId: scope === 'authority' ? authorityId : null,
      });
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load complaints', err);
      setComplaints([]);
    }
  }, [role, user.id, authorityId]);

  const refreshAuthorities = useCallback(async () => {
    try {
      const rows = await fetchAuthorities();
      setAuthorities(rows as AuthorityProfile[]);
    } catch (err) {
      console.error('Failed to load authorities', err);
      setAuthorities([]);
    }
  }, []);

  useEffect(() => {
    refreshComplaints();
  }, [refreshComplaints]);

  useEffect(() => {
    refreshAuthorities();
  }, [refreshAuthorities]);

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId);

  // -------------------------------------------------------------------------
  // Notifications (derived from complaint timeline events)
  // -------------------------------------------------------------------------

  const notifications = useMemo<NotificationItem[]>(() => {
    if (role !== 'citizen') return notificationsRef.current;
    const items: NotificationItem[] = [];
    const notifType: Record<string, NotificationItem['type']> = {
      SUBMITTED: 'received',
      UNDER_REVIEW: 'received',
      VERIFIED: 'status_updated',
      FORWARDED: 'forwarded',
      ASSIGNED: 'forwarded',
      IN_PROGRESS: 'status_updated',
      RESOLVED: 'resolved',
      CLOSED: 'resolved',
      REJECTED: 'status_updated',
    };
    const labelEn: Record<string, string> = {
      SUBMITTED: 'Complaint Received',
      UNDER_REVIEW: 'Complaint Under Review',
      VERIFIED: 'Complaint Verified',
      FORWARDED: 'Complaint Forwarded',
      ASSIGNED: 'Complaint Assigned',
      IN_PROGRESS: 'Status Update: In Progress',
      RESOLVED: 'Complaint Resolved',
      CLOSED: 'Complaint Closed',
      REJECTED: 'Complaint Status Update',
    };
    for (const c of complaints) {
      const events = [...c.timeline];
      events.forEach((ev, idx) => {
        if (idx === 0 && ev.status === 'pending') return; // skip initial submission
        const key = ev.title;
        const nid = `n-${c.id}-${idx}`;
        items.push({
          id: nid,
          complaintId: c.id,
          title: labelEn[ev.title] || key,
          titleHi: ev.titleHi,
          message: ev.description,
          messageHi: ev.descriptionHi,
          timestamp: ev.timestamp,
          type: notifType[key] || 'status_updated',
          read: readNotifs.has(nid),
        });
      });
    }
    notificationsRef.current = items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return notificationsRef.current;
  }, [complaints, role, readNotifs]);

  const persistReadNotifs = (next: Set<string>) => {
    setReadNotifs(new Set(next));
    localStorage.setItem(READ_NOTIF_KEY, JSON.stringify([...next]));
  };

  const markNotificationRead = (id: string) => {
    const next = new Set(readNotifs);
    next.add(id);
    persistReadNotifs(next);
  };

  const markAllNotificationsRead = () => {
    const next = new Set(notifications.map((n) => n.id));
    persistReadNotifs(next);
  };

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------

  const login = useCallback(
    async (identifier: string, password: string): Promise<UserRole> => {
      if (!identifier.includes('@')) {
        throw new Error('Please enter your registered email to sign in.');
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });
      if (error) throw error;
      const p = await fetchUserProfile(data.user.id);
      if (p?.role === 'admin') {
        setCurrentPage('authority_dashboard');
        return 'admin';
      }
      if (p?.role === 'authority') {
        setCurrentPage('authority_dashboard');
        return ROLE_TIER[(p.profile as Record<string, string>).role] || 'block_officer';
      }
      setCurrentPage('dashboard');
      return 'citizen';
    },
    []
  );

  const register = useCallback(
    async (fields: {
      fullName: string;
      email: string;
      mobile: string;
      village: string;
      ward: string;
      panchayat: string;
      block: string;
      district: string;
      password: string;
    }): Promise<{ needsEmailConfirm: boolean }> => {
      const { data, error } = await supabase.auth.signUp({
        email: fields.email.trim(),
        password: fields.password,
        options: {
          data: {
            full_name: fields.fullName,
            phone: fields.mobile,
            role: 'citizen',
          },
        },
      });
      if (error) throw error;

      const needsEmailConfirm = !data.session;
      if (data.session && data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          full_name: fields.fullName,
          email: fields.email.trim(),
          phone: fields.mobile,
          village: fields.village,
          ward: fields.ward,
          panchayat: fields.panchayat,
          block: fields.block,
          district: fields.district,
        });
        await loadProfileForUser(data.user);
      }
      return { needsEmailConfirm };
    },
    [loadProfileForUser]
  );

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('signOut error', error.message);
    } catch (err) {
      console.warn('signOut failed', err);
    }
    setUser(guestUser);
    setRole('citizen');
    setAuthorityId(null);
    setComplaints([]);
    setSelectedComplaintId(null);
    setCurrentPage('landing');
  }, []);

  // -------------------------------------------------------------------------
  // Complaint actions
  // -------------------------------------------------------------------------

  const addComplaint = useCallback(
    async (
      data: Omit<Complaint, 'id' | 'createdAt' | 'dueDate' | 'daysLeft' | 'timeline' | 'officialRemarks'>,
      options?: { file?: File }
    ): Promise<string> => {
      if (!session?.user) throw new Error('Please login to submit a complaint.');

      let photoPath = '';
      if (options?.file) {
        photoPath = await uploadEvidence(options.file, session.user.id);
      } else if (data.evidenceImageUrl && data.evidenceImageUrl.startsWith('data:')) {
        // Convert inline data URL to a File for storage
        const blob = await (await fetch(data.evidenceImageUrl)).blob();
        const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        photoPath = await uploadEvidence(file, session.user.id);
      }

      const categories = await getCategories();
      const slug = uiCategoryToSlug(data.category);
      const cat = categories.find((c) => c.slug === slug);

      const cid = await insertComplaint({
        userId: session.user.id,
        categoryId: cat?.id ?? null,
        categoryName: cat?.name || data.category,
        title: data.title,
        description: data.description,
        village: data.location.village,
        ward: data.location.ward,
        panchayat: data.location.panchayat,
        block: data.location.block,
        district: data.location.district,
        landmark: data.location.landmark || '',
        photoPath,
        priority: data.priority || 'normal',
      });

      await refreshComplaints();
      setSelectedComplaintId(cid);
      return cid;
    },
    [session, refreshComplaints]
  );

  const updateComplaintStatus = useCallback(
    async (
      id: string,
      status: ComplaintStatus,
      _newAuthority?: AuthorityTier,
      remark?: string,
      proofUrl?: string
    ) => {
      const dbId = resolveDbId(id);
      if (!dbId) throw new Error('Complaint not found');
      await callUpdateStatus(dbId, status, remark, proofUrl);
      await refreshComplaints();
    },
    [refreshComplaints]
  );

  const resolveForwardTarget = useCallback(
    (target: string): string | null => {
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(target)) {
        return authorities.find((a) => a.id === target)?.id || null;
      }
      const tier = target as AuthorityTier;
      if (tier === 'Mukhiya') return authorities.find((a) => a.role === 'MUKHIYA' && a.is_active)?.id || null;
      if (tier === 'Gram Panchayat Officer')
        return authorities.find((a) => a.role === 'PANCHAYAT' && a.is_active)?.id || null;
      if (tier === 'DM / District Authority')
        return (
          authorities.find((a) => /district/i.test(a.designation) && a.is_active)?.id ||
          authorities.find((a) => a.role === 'OFFICER' && a.is_active)?.id ||
          null
        );
      // Block Officer
      return (
        authorities.find((a) => /block/i.test(a.designation) && a.is_active)?.id ||
        authorities.find((a) => a.role === 'OFFICER' && a.is_active)?.id ||
        null
      );
    },
    [authorities]
  );

  const forwardComplaint = useCallback(
    async (id: string, targetTier: AuthorityTier | string, reason: string) => {
      const dbId = resolveDbId(id);
      if (!dbId) throw new Error('Complaint not found');
      const targetId = resolveForwardTarget(targetTier);
      if (!targetId) throw new Error('No active authority available for this forwarding level');
      await callForward(dbId, targetId, reason || undefined);
      await refreshComplaints();
    },
    [refreshComplaints, resolveForwardTarget]
  );

  const verifyComplaint = useCallback(
    async (id: string, remark?: string) => {
      const dbId = resolveDbId(id);
      if (!dbId) throw new Error('Complaint not found');
      await callVerify(dbId, remark);
      await refreshComplaints();
    },
    [refreshComplaints]
  );

  const rejectComplaint = useCallback(
    async (id: string, remark?: string) => {
      const dbId = resolveDbId(id);
      if (!dbId) throw new Error('Complaint not found');
      await callReject(dbId, remark);
      await refreshComplaints();
    },
    [refreshComplaints]
  );

  const simulateAutoEscalation = useCallback(
    async (id: string) => {
      const c = complaints.find((x) => x.id === id);
      if (!c) return;
      let next: AuthorityTier | null = null;
      let reason = 'Deadline exceeded (7 days rule)';
      if (c.currentAuthority === 'Gram Panchayat Officer') {
        next = 'Mukhiya';
        reason = 'Deadline exceeded (7 days non-action by Gram Panchayat Officer)';
      } else if (c.currentAuthority === 'Mukhiya') {
        next = 'Block Officer';
        reason = 'Mukhiya review window exceeded. Escalated to Block Development Officer (BDO).';
      } else if (c.currentAuthority === 'Block Officer') {
        next = 'DM / District Authority';
        reason = 'Block Officer resolution window expired. Escalated to District Magistrate (DM).';
      }
      if (next) await forwardComplaint(id, next, reason);
    },
    [complaints, forwardComplaint]
  );

  const submitFeedback = useCallback(
    async (id: string, rating: number, _status: 'yes' | 'partially' | 'no', comment: string) => {
      const dbId = resolveDbId(id);
      if (!dbId) throw new Error('Complaint not found');
      await callSubmitFeedback(dbId, rating, comment);
      await refreshComplaints();
    },
    [refreshComplaints]
  );

  // -------------------------------------------------------------------------
  // Profile + authority management
  // -------------------------------------------------------------------------

  const updateUserProfile = useCallback(
    async (updated: Partial<UserProfile>) => {
      if (!session?.user) throw new Error('Not authenticated');
      const next = { ...user, ...updated };
      setUser(next);
      if (role === 'citizen') {
        await updateCitizenProfile(session.user.id, {
          full_name: updated.name,
          phone: updated.mobile,
          village: updated.village,
          ward: updated.ward,
          panchayat: updated.panchayat,
          block: updated.block,
          district: updated.district,
        });
      } else if (role !== 'admin' && authorityId) {
        await updateAuthorityProfile(authorityId, {
          name: updated.name,
          phone: updated.mobile,
        });
      }
    },
    [session, user, role, authorityId]
  );

  // -------------------------------------------------------------------------

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        language,
        setLanguage,
        user,
        setUser,
        complaints,
        selectedComplaintId,
        setSelectedComplaintId,
        notifications,
        addComplaint,
        updateComplaintStatus,
        forwardComplaint,
        verifyComplaint,
        rejectComplaint,
        simulateAutoEscalation,
        submitFeedback,
        markNotificationRead,
        markAllNotificationsRead,
        updateUserProfile,
        login,
        register,
        logout,
        refreshComplaints,
        authorities,
        role,
        isAuthenticated,
        isLoading,
        t,
        selectedComplaint,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// keep AppContextType public for consumers that need it
export type { AppContextType };