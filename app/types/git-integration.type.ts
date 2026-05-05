export type GitProvider = 'GitHub' | 'GitLab';

export interface GitIntegration {
	_id: string;
	account: string;
	provider: GitProvider;
	providerUserId: string;
	username: string;
	displayName: string;
	webhookSecret: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}
