import { supabase } from './supabaseClient';
import {
  AuthorityTier,
  ClosureRecord,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  OfficialRemark,
  TimelineEvent,
} from '../types';

// ---------------------------------------------------------------------------
// Database row shapes
// ---------------------------------------------------------------------------

export interface ComplaintRow {
  id: number;
  complaint_id: string;
  user_id: string | null;
  category_id: number | null;
  title: string;
  description: string;
  village: string;
  ward: string;
  panchayat: string;
  district: string;
  block: string;
  landmark: string;
  photo_url: string;
  status: string;
  current_authority_id: string | null;
  current_authority_name: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  submitter_name: string;
  submitter_mobile: string;
  submitter_email: string;
  category_name: string;
  priority: string;
}

export interface TimelineRow {
  complaint_id: number;
  status: string;
  remarks: string;
  changed_by: string;
  changed_by_role: string;
  photo_url: string;
  created_at: string;
}

export interface AuthorityRow {
  id: string;
  user_id: string | null;
  name: string;
  designation: string;
  role: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export interface FeedbackRow {
  complaint_id: number;
  rating: number;
  comment: string;
  submitted_at: string;
}

export interface ClosureRow {
  id: number;
  complaint_id: number;
  submitted_by: string | null;
  submitted_by_name: string;
  submitted_by_role: string;
  photo_url: string;
  video_url: string;
  location_lat: number | null;
  location_lng: number | null;
  location_place: string;
  submitted_at: string;
  citizen_response: string | null;
  citizen_remarks: string;
  citizen_responded_at: string | null;
  verified_by_name: string;
  verified_by_role: string;
  verified_at: string | null;
  closed_at: string | null;
}

// ---------------------------------------------------------------------------
// Status / category mapping
// ---------------------------------------------------------------------------

const DB_TO_UI_STATUS: Record<string, ComplaintStatus> = {
  SUBMITTED: 'pending',
  UNDER_REVIEW: 'pending',
  VERIFIED: 'pending',
  FORWARDED: 'forwarded',
  ASSIGNED: 'forwarded',
  IN_PROGRESS: 'in_progress',
  VERIFICATION_PENDING: 'verification_pending',
  CITIZEN_CONFIRMED: 'citizen_confirmed',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
  CLOSED: 'resolved',
  REJECTED: 'rejected',
};

export const STATUS_LABELS: Record<string, { en: string; hi: string }> = {
  SUBMITTED: { en: 'Complaint Submitted', hi: 'शिकायत सफलतापूर्वक दर्ज की गई' },
  UNDER_REVIEW: { en: 'Under Review', hi: 'समीक्षा प्रक्रिया में' },
  VERIFIED: { en: 'Complaint Verified by Admin', hi: 'शिकायत एडमिन द्वारा सत्यापित' },
  FORWARDED: { en: 'Forwarded to Official', hi: 'संबंधित अधिकारी को अग्रेषित' },
  ASSIGNED: { en: 'Assigned to Field Officer', hi: 'क्षेत्रीय अधिकारी को सौंपा गया' },
  IN_PROGRESS: { en: 'Action In Progress', hi: 'कार्रवाई प्रक्रियाधीन' },
  VERIFICATION_PENDING: {
    en: 'Work Completed – Verification Pending',
    hi: 'कार्य पूर्ण – सत्यापन लंबित',
  },
  CITIZEN_CONFIRMED: {
    en: 'Citizen Confirmed – Awaiting Final Closure',
    hi: 'नागरिक द्वारा पुष्टि – अंतिम समापन लंबित',
  },
  DISPUTED: {
    en: 'Issue Reported – Higher Authority Review Queue',
    hi: 'समस्या सूचित – उच्चाधिकारी समीक्षा कतार',
  },
  RESOLVED: { en: 'Problem Solved', hi: 'समस्या हल हो गई' },
  CLOSED: { en: 'Complaint Closed', hi: 'शिकायत बंद' },
  REJECTED: { en: 'Complaint Rejected', hi: 'शिकायत खारिज की गई' },
};

export const UItoDbStatus = (status: ComplaintStatus): string => {
  switch (status) {
    case 'pending':
      return 'UNDER_REVIEW';
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'forwarded':
      return 'FORWARDED';
    case 'verification_pending':
      return 'VERIFICATION_PENDING';
    case 'citizen_confirmed':
      return 'CITIZEN_CONFIRMED';
    case 'disputed':
      return 'DISPUTED';
    case 'resolved':
      return 'CLOSED';
    case 'rejected':
      return 'REJECTED';
  }
};

const CATEGORY_SLUG_TO_UI: Record<string, ComplaintCategory> = {
  street_light: 'street_light',
  water_supply: 'water_supply',
  road: 'road',
  drainage: 'drainage',
  garbage: 'garbage',
  electricity: 'electricity',
  public_infrastructure: 'public_area',
  other: 'other',
};

export const uiCategoryToSlug = (cat: ComplaintCategory): string => {
  switch (cat) {
    case 'road':
      return 'road';
    case 'street_light':
      return 'street_light';
    case 'water_supply':
      return 'water_supply';
    case 'drainage':
      return 'drainage';
    case 'garbage':
      return 'garbage';
    case 'electricity':
      return 'electricity';
    case 'public_area':
      return 'public_infrastructure';
    case 'school':
      return 'other';
    case 'health':
      return 'other';
    case 'other':
      return 'other';
  }
};

export const uiCategoryLabel = (cat: ComplaintCategory): string => {
  const map: Record<ComplaintCategory, string> = {
    road: 'Road',
    street_light: 'Street Light',
    water_supply: 'Water Supply',
    drainage: 'Drainage',
    garbage: 'Garbage / Sanitation',
    electricity: 'Electricity',
    public_area: 'Public Infrastructure',
    school: 'School',
    health: 'Health',
    other: 'Other',
  };
  return map[cat];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const dateOnly = (iso?: string | null): string => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

// Registry mapping public CID ("CID2026/09/00001") -> numeric DB id, so RPCs
// and client actions can resolve ids without exposing the numeric sequence.
const dbIdByCid = new Map<string, number>();
const cidByDbId = new Map<number, string>();

export function registerComplaintId(cid: string, dbId: number): void {
  dbIdByCid.set(cid, dbId);
  cidByDbId.set(dbId, cid);
}

export function resolveDbId(cid: string): number | undefined {
  return dbIdByCid.get(cid);
}

export function resolveCid(dbId: number): string | undefined {
  return cidByDbId.get(dbId);
}

const mapTier = (authorityName: string, designation: string, dbRole: string): AuthorityTier => {
  const n = `${authorityName} ${designation}`.toLowerCase();
  if (dbRole === 'MUKHIYA' || n.includes('mukhiya')) return 'Mukhiya';
  if (n.includes('district') || n.includes('dm')) return 'DM / District Authority';
  if (n.includes('block') || dbRole === 'OFFICER') return 'Block Officer';
  return 'Gram Panchayat Officer';
};

const toAuthorityTier = (name: string): AuthorityTier => {
  const n = (name || '').toLowerCase();
  if (n.includes('mukhiya')) return 'Mukhiya';
  if (n.includes('district') || n.includes('dm')) return 'DM / District Authority';
  if (n.includes('block') || n.includes('bdo')) return 'Block Officer';
  return 'Gram Panchayat Officer';
};

const publicUrl = (path: string): string =>
  path ? supabase.storage.from('complaints').getPublicUrl(path).data.publicUrl : '';

const fmtTs = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

let categoryCache: { id: number; slug: string; name: string }[] | null = null;

export async function getCategories(): Promise<{ id: number; slug: string; name: string }[]> {
  if (categoryCache) return categoryCache;
  const { data, error } = await supabase.from('categories').select('id,name,slug').order('id');
  if (error) throw error;
  categoryCache = (data as { id: number; name: string; slug: string }[]) || [];
  return categoryCache;
}

export async function fetchCategories(): Promise<string[]> {
  return (await getCategories()).map((c) => c.slug);
}

export async function fetchAuthorities(): Promise<AuthorityRow[]> {
  const { data, error } = await supabase
    .from('authorities')
    .select('id,user_id,name,designation,role,email,phone,is_active')
    .order('name');
  if (error) throw error;
  return (data as AuthorityRow[]) || [];
}

export async function fetchFeedback(complaintIds: number[]): Promise<Record<number, FeedbackRow>> {
  if (!complaintIds.length) return {};
  const { data, error } = await supabase
    .from('feedback')
    .select('complaint_id,rating,comment,submitted_at')
    .in('complaint_id', complaintIds);
  if (error) throw error;
  const map: Record<number, FeedbackRow> = {};
  for (const f of (data as FeedbackRow[]) || []) map[f.complaint_id] = f;
  return map;
}

export async function fetchComplaints(opts: {
  scope: 'citizen' | 'authority' | 'admin';
  userId?: string;
  authorityId?: string | null;
}): Promise<Complaint[]> {
  let query = supabase
    .from('complaints')
    .select(
      'id,complaint_id,user_id,category_id,title,description,village,ward,panchayat,district,block,landmark,' +
        'photo_url,status,current_authority_id,current_authority_name,created_at,updated_at,resolved_at,closed_at,' +
        'submitter_name,submitter_mobile,submitter_email,category_name,priority'
    )
    .order('created_at', { ascending: false });

  if (opts.scope === 'citizen' && opts.userId) {
    query = query.eq('user_id', opts.userId);
  } else if (opts.scope === 'authority' && opts.authorityId) {
    query = query.eq('current_authority_id', opts.authorityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = ((data as unknown) ?? []) as ComplaintRow[];

  const timeline = await fetchTimelines(rows.map((r) => r.id));
  const feedback = await fetchFeedback(rows.map((r) => r.id));
  const closures = await fetchClosures(rows.map((r) => r.id));
  const categories = await getCategories();
  const catById = new Map(categories.map((c) => [c.id, c]));

  const now = Date.now();
  return rows.map((row) => {
    registerComplaintId(row.complaint_id, row.id);

    const cat = row.category_id != null ? catById.get(row.category_id) : undefined;
    const uiCat: ComplaintCategory = cat
      ? CATEGORY_SLUG_TO_UI[cat.slug] || 'other'
      : (CATEGORY_SLUG_TO_UI[row.category_name?.toLowerCase().replace(/[^a-z_]/g, '_')] ?? 'other');
    const status = DB_TO_UI_STATUS[row.status] || 'pending';
    const createdAt = new Date(row.created_at);
    const due = new Date(createdAt.getTime() + 7 * 86400000);
    const events = (timeline[row.id] || []).map((t, i): TimelineEvent => {
      const label = STATUS_LABELS[t.status] || { en: t.status, hi: t.status };
      const remarks = t.remarks || t.changed_by || 'Official update';
      return {
        id: `tl-${row.id}-${i}`,
        title: label.en,
        titleHi: label.hi,
        description: remarks,
        descriptionHi: remarks,
        timestamp: fmtTs(t.created_at),
        actor: t.changed_by || 'System',
        actorRole: (t.changed_by_role as TimelineEvent['actorRole']) || 'System Automated Escalation',
        status: DB_TO_UI_STATUS[t.status] || 'pending',
        proofImageUrl: t.photo_url ? publicUrl(t.photo_url) : undefined,
      };
    });

    const remarks: OfficialRemark[] = (timeline[row.id] || [])
      .filter((t) => t.remarks && t.changed_by_role !== 'Citizen')
      .map((t, i) => ({
        id: `rem-${row.id}-${i}`,
        author: t.changed_by || 'Official',
        role: mapTier(t.changed_by, t.changed_by_role, t.changed_by_role),
        timestamp: fmtTs(t.created_at),
        comment: t.remarks,
      }));

    const resolution = (timeline[row.id] || []).find(
      (t) => (t.status === 'RESOLVED' || t.status === 'VERIFICATION_PENDING') && t.photo_url
    );
    const resolutionRemarks = (timeline[row.id] || []).find(
      (t) => t.status === 'RESOLVED' || t.status === 'VERIFICATION_PENDING'
    );

    const fb = feedback[row.id];
    const closure = closures[row.id]?.[0];

    const toClosure = (k: ClosureRow): ClosureRecord => ({
      id: k.id,
      submittedBy: k.submitted_by || undefined,
      submittedByName: k.submitted_by_name,
      submittedByRole: k.submitted_by_role,
      photoUrl: k.photo_url ? publicUrl(k.photo_url) : undefined,
      videoUrl: k.video_url ? publicUrl(k.video_url) : undefined,
      locationLat: k.location_lat,
      locationLng: k.location_lng,
      locationPlace: k.location_place,
      submittedAt: fmtTs(k.submitted_at),
      citizenResponse: k.citizen_response === 'CONFIRMED' ? 'confirmed' : k.citizen_response === 'DISPUTED' ? 'disputed' : undefined,
      citizenRemarks: k.citizen_remarks || undefined,
      citizenRespondedAt: k.citizen_responded_at ? fmtTs(k.citizen_responded_at) : undefined,
      verifiedByName: k.verified_by_name || undefined,
      verifiedByRole: k.verified_by_role || undefined,
      verifiedAt: k.verified_at ? fmtTs(k.verified_at) : undefined,
      closedAt: k.closed_at ? fmtTs(k.closed_at) : undefined,
    });

    const priority = row.priority === 'normal' || row.priority === 'important' || row.priority === 'urgent'
      ? (row.priority as ComplaintPriority)
      : 'normal';

    return {
      id: row.complaint_id,
      title: row.title,
      description: row.description,
      category: uiCat,
      priority,
      status,
      currentAuthority: toAuthorityTier(row.current_authority_name || ''),
      submittedBy: {
        name: row.submitter_name || 'Citizen',
        mobile: row.submitter_mobile || '',
        email: row.submitter_email || '',
        citizenId: row.user_id || '',
      },
      location: {
        village: row.village,
        ward: row.ward,
        panchayat: row.panchayat,
        block: row.block,
        district: row.district,
        landmark: row.landmark,
      },
      evidenceImageUrl: row.photo_url ? publicUrl(row.photo_url) : undefined,
      contactPreference: { sms: true, email: !!row.submitter_email },
      createdAt: dateOnly(row.created_at),
      dueDate: dateOnly(due.toISOString()),
      daysLeft: Math.ceil((due.getTime() - now) / 86400000),
      timeline: events,
      officialRemarks: remarks,
      resolutionProofUrl: resolution?.photo_url ? publicUrl(resolution.photo_url) : undefined,
      resolutionRemarks: resolutionRemarks?.remarks || '',
      resolvedAt: dateOnly(row.resolved_at),
      closure: closure ? toClosure(closure) : undefined,
      feedback: fb
        ? {
            resolvedStatus: fb.rating >= 4 ? 'yes' : fb.rating === 3 ? 'partially' : 'no',
            rating: fb.rating,
            comment: fb.comment,
            submittedAt: fmtTs(fb.submitted_at),
          }
        : undefined,
    };
  });
}

async function fetchTimelines(complaintIds: number[]): Promise<Record<number, TimelineRow[]>> {
  if (!complaintIds.length) return {};
  const { data, error } = await supabase
    .from('complaint_status')
    .select('complaint_id,status,remarks,changed_by,changed_by_role,photo_url,created_at')
    .in('complaint_id', complaintIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const map: Record<number, TimelineRow[]> = {};
  for (const t of (data as TimelineRow[]) || []) {
    (map[t.complaint_id] = map[t.complaint_id] || []).push(t);
  }
  return map;
}

async function fetchClosures(complaintIds: number[]): Promise<Record<number, ClosureRow[]>> {
  if (!complaintIds.length) return {};
  const { data, error } = await supabase
    .from('complaint_closure')
    .select(
      'id,complaint_id,submitted_by,submitted_by_name,submitted_by_role,photo_url,video_url,' +
        'location_lat,location_lng,location_place,submitted_at,citizen_response,citizen_remarks,' +
        'citizen_responded_at,verified_by_name,verified_by_role,verified_at,closed_at'
    )
    .in('complaint_id', complaintIds)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  const map: Record<number, ClosureRow[]> = {};
  for (const k of ((data as unknown) ?? []) as ClosureRow[]) {
    (map[k.complaint_id] = map[k.complaint_id] || []).push(k);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public tracking (no login)
// ---------------------------------------------------------------------------

export async function trackComplaintPublic(complaintId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('get_public_complaint', { p_complaint_id: complaintId });
  if (error) throw error;
  return (data as Record<string, unknown> | null) ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function insertComplaint(input: {
  userId: string;
  categoryId: number | null;
  categoryName: string;
  title: string;
  description: string;
  village: string;
  ward: string;
  panchayat: string;
  block: string;
  district: string;
  landmark: string;
  photoPath: string;
  priority: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: input.userId,
      category_id: input.categoryId,
      category_name: input.categoryName,
      title: input.title,
      description: input.description,
      village: input.village,
      ward: input.ward,
      panchayat: input.panchayat,
      block: input.block,
      district: input.district,
      landmark: input.landmark,
      photo_url: input.photoPath,
      priority: input.priority,
      submitter_name: '',
      submitter_mobile: '',
      submitter_email: '',
    })
    .select('id,complaint_id')
    .single();
  if (error) throw error;
  return (data as { complaint_id: string }).complaint_id;
}

export async function uploadEvidence(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('complaints').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function callVerify(complaintId: number, remarks?: string): Promise<void> {
  const { error } = await supabase.rpc('verify_complaint', { p_complaint_id: complaintId, p_remarks: remarks });
  if (error) throw error;
}

export async function callReject(complaintId: number, remarks?: string): Promise<void> {
  const { error } = await supabase.rpc('reject_complaint', { p_complaint_id: complaintId, p_remarks: remarks });
  if (error) throw error;
}

export async function callForward(complaintId: number, toAuthorityId: string, remarks?: string): Promise<void> {
  const { error } = await supabase.rpc('forward_complaint', {
    p_complaint_id: complaintId,
    p_to_authority: toAuthorityId,
    p_remarks: remarks,
  });
  if (error) throw error;
}

export async function callUpdateStatus(
  complaintId: number,
  status: ComplaintStatus,
  remarks?: string,
  photoUrl?: string
): Promise<void> {
  const { error } = await supabase.rpc('update_complaint_status', {
    p_complaint_id: complaintId,
    p_status: UItoDbStatus(status),
    p_remarks: remarks,
    p_photo_url: photoUrl,
  });
  if (error) throw error;
}

export async function callSubmitFeedback(complaintId: number, rating: number, comment?: string): Promise<void> {
  const { error } = await supabase.rpc('submit_feedback', {
    p_complaint_id: complaintId,
    p_rating: rating,
    p_comment: comment,
  });
  if (error) throw error;
}

export interface VerificationEvidence {
  photoUrl: string;
  videoUrl?: string;
  lat?: number | null;
  lng?: number | null;
  place?: string;
  remarks?: string;
}

export async function callSubmitForVerification(
  complaintId: number,
  evidence: VerificationEvidence
): Promise<void> {
  const { error } = await supabase.rpc('submit_for_verification', {
    p_complaint_id: complaintId,
    p_photo_url: evidence.photoUrl,
    p_video_url: evidence.videoUrl || '',
    p_lat: evidence.lat ?? null,
    p_lng: evidence.lng ?? null,
    p_place: evidence.place || '',
    p_remarks: evidence.remarks || '',
  });
  if (error) throw error;
}

export async function callRespondVerification(
  complaintId: number,
  response: 'CONFIRMED' | 'DISPUTED',
  remarks?: string
): Promise<void> {
  const { error } = await supabase.rpc('citizen_respond_verification', {
    p_complaint_id: complaintId,
    p_response: response,
    p_remarks: remarks || '',
  });
  if (error) throw error;
}

export async function callCloseComplaint(complaintId: number, remarks?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_close_complaint', {
    p_complaint_id: complaintId,
    p_remarks: remarks || '',
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

export async function fetchUserProfile(authUserId: string): Promise<{
  role: 'citizen' | 'admin' | 'authority';
  authorityId?: string;
  profile: Record<string, unknown>;
} | null> {
  const admin = await supabase.from('admins').select('id,name,email,phone,role').eq('id', authUserId).maybeSingle();
  if (admin.data) {
    return { role: 'admin', profile: admin.data };
  }

  const authority = await supabase
    .from('authorities')
    .select('id,user_id,name,designation,role,email,phone')
    .eq('user_id', authUserId)
    .maybeSingle();
  if (authority.data) {
    return { role: 'authority', authorityId: (authority.data as AuthorityRow).id, profile: authority.data };
  }

  const citizen = await supabase.from('users').select('*').eq('id', authUserId).maybeSingle();
  if (citizen.data) {
    return { role: 'citizen', profile: citizen.data };
  }

  return null;
}

export async function updateCitizenProfile(authUserId: string, fields: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('users').update(fields).eq('id', authUserId);
  if (error) throw error;
}

export async function updateAuthorityProfile(authAuthorityId: string, fields: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('authorities').update(fields).eq('id', authAuthorityId);
  if (error) throw error;
}

export async function createAuthorityProfile(fields: {
  name: string;
  designation: string;
  role: string;
  email: string;
  phone: string;
}): Promise<void> {
  const { error } = await supabase.from('authorities').insert(fields);
  if (error) throw error;
}

export async function toggleAuthorityActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('authorities').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}