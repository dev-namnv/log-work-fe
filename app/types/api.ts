// ---------------------------------------------------------------------------
// Shared API response shapes
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface ApiError {
	statusCode: number;
	message: string;
	error?: string;
}

export interface MessageResponse {
	message: string;
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export type AccountRole = 'USER' | 'ADMIN';

export interface AccountMetadata {
	sendMail: boolean;
	sendTelegram: boolean;
}

export interface Account {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: AccountRole;
	isVerified: boolean;
	telegramChatId: string | null;
	metadata: AccountMetadata;
	languages: string[];
	createdAt: string;
	updatedAt: string;
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export interface WorkSchedule {
	workStartTime: string; // "HH:mm"
	workEndTime: string; // "HH:mm"
	lunchBreakMinutes: number;
}

export interface Organization {
	_id: string;
	name: string;
	description: string;
	workSchedule: WorkSchedule;
	owner: Account | string;
	members: (Account | string)[];
	createdAt: string;
	updatedAt: string;
}

// ---------------------------------------------------------------------------
// WorkLog
// ---------------------------------------------------------------------------

export interface WorkLog {
	_id: string;
	account: Account | string;
	organization: Organization | string;
	date: string; // "YYYY-MM-DD"
	checkIn: string; // ISO 8601
	checkOut: string; // ISO 8601
	hours: number;
	note: string;
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
// Notice
// ---------------------------------------------------------------------------

export type NoticeType = 'Registered' | 'Application' | 'Error' | 'Work Log';
export type NoticeVariant = 'default' | 'success' | 'warning' | 'error';

export interface Notice {
	_id: string;
	account: Account | string;
	type: NoticeType;
	variant: NoticeVariant;
	message: string;
	link: string | null;
	isRead: boolean;
	createdAt: string;
	updatedAt: string;
}
