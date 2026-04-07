import type { Account } from './account.type';

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
