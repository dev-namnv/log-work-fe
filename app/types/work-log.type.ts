import type { Account } from './account.type';
import type { Organization, WorkSchedule } from './organization.type';

export interface WorkLog {
	_id: string;
	account: Account | string;
	organization: Organization | string;
	date: string; // "YYYY-MM-DD"
	checkIn: string; // ISO 8601
	checkOut: string | null; // ISO 8601, null nếu chưa check-out
	hours: number;
	note: string;
	/** Bỏ qua khấu trừ nghỉ trưa */
	skipLunchBreak?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface MonthlyReport {
	month: number;
	year: number;
	workSchedule: WorkSchedule;
	standardHoursPerDay: number;
	standardWorkDays: number;
	totalStandardHours: number;
	totalHours: number;
	loggedDays: number;
	overtimeHours: number;
	missingHours: number;
	attendanceRate: number; // percentage, 2 decimal places
	logs: WorkLog[];
}

export interface MemberWorkLog {
	account: Account;
	logs: WorkLog[];
	totalHours: number;
	loggedDays: number;
	overtimeHours: number;
	missingHours: number;
	attendanceRate: number;
}

export interface OrganizationByReport {
	organization: Organization;
	workSchedule: WorkSchedule;
	standardHoursPerDay: number;
	standardWorkDays: number;
	totalStandardHours: number;
	members: MemberWorkLog[];
}

// ---------------------------------------------------------------------------
// WorkLogShare
// ---------------------------------------------------------------------------

export interface WorkLogShare {
	_id: string;
	token: string;
	account: Account | string;
	organization: { _id: string; name: string } | null;
	month: number;
	year: number;
	label: string;
	expiresAt: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface WorkLogShareMeta {
	_id: string;
	token: string;
	label: string;
	month: number;
	year: number;
	expiresAt: string | null;
	createdAt: string;
}

export interface WorkLogShareView {
	share: WorkLogShareMeta;
	account: Pick<Account, '_id' | 'firstName' | 'lastName' | 'email'>;
	organization: {
		_id: string;
		name: string;
		workSchedule: WorkSchedule;
	} | null;
	month: number;
	year: number;
	workSchedule: WorkSchedule;
	standardHoursPerDay: number;
	standardWorkDays: number;
	totalStandardHours: number;
	totalHours: number;
	loggedDays: number;
	overtimeHours: number;
	missingHours: number;
	attendanceRate: number;
	logs: WorkLog[];
}
