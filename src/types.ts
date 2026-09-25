export type UserRole = 'admin' | 'citizen' | 'panchayat_officer' | 'mukhiya' | 'block_officer' | 'dm_authority';

export type Language = 'en' | 'hi';

export type ComplaintStatus =
  | 'pending'
  | 'in_progress'
  | 'forwarded'
  | 'verification_pending'
  | 'citizen_confirmed'
  | 'disputed'
  | 'resolved'
  | 'rejected';

export type ComplaintPriority = 'normal' | 'important' | 'urgent';

export type ComplaintCategory =
  | 'road'
  | 'street_light'
  | 'water_supply'
  | 'drainage'
  | 'garbage'
  | 'school'
  | 'health'
  | 'electricity'
  | 'public_area'
  | 'other';

export type AuthorityTier =
  | 'Gram Panchayat Officer'
  | 'Mukhiya'
  | 'Block Officer'
  | 'DM / District Authority';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  village: string;
  ward: string;
  panchayat: string;
  block: string;
  district: string;
  role: UserRole;
  designation?: string;
  avatarUrl?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  timestamp: string; // ISO or formatted
  actor: string;
  actorRole: AuthorityTier | 'Citizen' | 'System Automated Escalation';
  status: ComplaintStatus;
  isEscalation?: boolean;
  escalationReason?: string;
  escalationReasonHi?: string;
  proofImageUrl?: string;
}

export interface OfficialRemark {
  id: string;
  author: string;
  role: AuthorityTier;
  timestamp: string;
  comment: string;
}

export interface Complaint {
  id: string; // e.g. ID-20260923-00125
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  workflowStatus?: string;
  currentAuthority: AuthorityTier;
  submittedBy: {
    name: string;
    mobile: string;
    email: string;
    citizenId: string;
  };
  location: {
    village: string;
    ward: string;
    panchayat: string;
    block: string;
    district: string;
    landmark?: string;
  };
  evidenceImageUrl?: string;
  evidenceVideoUrl?: string;
  contactPreference: {
    sms: boolean;
    email: boolean;
  };
  createdAt: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  daysLeft: number;
  timeline: TimelineEvent[];
  officialRemarks: OfficialRemark[];
  resolutionProofUrl?: string;
  resolutionRemarks?: string;
  resolvedAt?: string;
  closure?: ClosureRecord;
  feedback?: {
    resolvedStatus: 'yes' | 'partially' | 'no';
    rating: number; // 1-5
    comment: string;
    submittedAt: string;
  };
}

export interface ClosureRecord {
  id: number;
  submittedBy?: string;
  submittedByName: string;
  submittedByRole: string;
  photoUrl?: string;
  videoUrl?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPlace?: string;
  submittedAt: string; // server timestamp
  citizenResponse?: 'confirmed' | 'disputed';
  citizenRemarks?: string;
  citizenRespondedAt?: string;
  verifiedByName?: string;
  verifiedByRole?: string;
  verifiedAt?: string;
  closedAt?: string;
}

export interface NotificationItem {
  id: string;
  complaintId: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  timestamp: string;
  type: 'received' | 'forwarded' | 'status_updated' | 'resolved' | 'verification_pending' | 'disputed' | 'closed' | 'feedback_required';
  read: boolean;
}

export interface FAQItem {
  id: string;
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
}
