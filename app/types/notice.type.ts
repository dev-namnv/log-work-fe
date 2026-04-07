import type { Account } from './account.type';

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
