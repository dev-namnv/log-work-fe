import { http } from '~/apis/http';
import type { GitIntegration, MessageResponse } from '~/types';

export const GitIntegrationService = {
	/**
	 * Lấy danh sách tất cả tài khoản Git đã liên kết
	 */
	getAll(): Promise<GitIntegration[]> {
		return http.get('/git-integration');
	},

	/**
	 * Lấy URL OAuth để liên kết tài khoản GitHub
	 */
	getGithubOAuthUrl(): Promise<{ url: string }> {
		return http.get('/git-integration/github/oauth-url');
	},

	/**
	 * Lấy URL OAuth để liên kết tài khoản GitLab
	 */
	getGitlabOAuthUrl(): Promise<{ url: string }> {
		return http.get('/git-integration/gitlab/oauth-url');
	},

	/**
	 * Hủy liên kết một tài khoản Git
	 */
	deleteById(id: string): Promise<MessageResponse> {
		return http.delete(`/git-integration/${id}/delete`);
	},

	/**
	 * Đồng bộ dữ liệu chấm công từ các tài khoản Git đã liên kết
	 */
	sync(subDays?: number): Promise<MessageResponse> {
		return http.post('/git-integration/sync', { params: { subDays } });
	},
};
