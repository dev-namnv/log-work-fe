import { http } from '~/apis/http';
import type { Account, MessageResponse, PaginatedResponse } from '~/types/api';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface SearchAccountDto {
	keyword?: string;
	page?: number;
	limit?: number;
}

// ---------------------------------------------------------------------------
// AccountService — Admin only endpoints
// ---------------------------------------------------------------------------

export class AccountService {
	/**
	 * Tìm kiếm và phân trang tài khoản (chỉ Admin).
	 */
	static search(
		dto: SearchAccountDto = {},
	): Promise<PaginatedResponse<Account>> {
		return http.post<PaginatedResponse<Account>>('/account/search', {
			json: dto,
		});
	}

	/**
	 * Lấy chi tiết tài khoản theo ID (chỉ Admin).
	 */
	static getById(id: string): Promise<Account> {
		return http.get<Account>(`/account/${id}/detail`);
	}

	/**
	 * Xoá vĩnh viễn tài khoản theo ID (chỉ Admin).
	 */
	static deleteById(id: string): Promise<MessageResponse> {
		return http.delete<MessageResponse>(`/account/${id}/delete`);
	}
}
