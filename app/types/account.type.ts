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
