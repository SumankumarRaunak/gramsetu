import { UserRole } from '../types';

// Maps the DB authorities.role enum columns (PANCHAYAT/MUKHIYA/OFFICER/DEPARTMENT)
// to the UI role labels used across the app.
export const ROLE_TIER: Record<string, UserRole> = {
  PANCHAYAT: 'panchayat_officer',
  MUKHIYA: 'mukhiya',
  OFFICER: 'block_officer',
  DEPARTMENT: 'dm_authority',
};