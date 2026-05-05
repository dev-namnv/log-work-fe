import type { WorkSchedule } from './organization.type';

export interface UserRefOrganization {
	_id: string;
	name: string;
	workSchedule: WorkSchedule;
}

export interface UserRef {
	_id: string;
	account: string;
	lastWorkLogOrganization: UserRefOrganization | null;
	createdAt: string;
	updatedAt: string;
}
