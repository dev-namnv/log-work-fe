import { http } from '~/apis/http';
import type { UserRef } from '~/types';

export interface UpdateUserRefDto {
	lastWorkLogOrganization?: string | null;
}

export class UserRefService {
	/**
	 * Lấy dữ liệu tham chiếu của user hiện tại.
	 * Trả về null nếu user chưa tạo WorkLog lần nào.
	 */
	static get(): Promise<UserRef | null> {
		return http.get<UserRef | null>('/user-ref');
	}

	/**
	 * Cập nhật dữ liệu tham chiếu của user hiện tại.
	 * Chỉ các field được truyền mới được cập nhật.
	 */
	static patch(dto: UpdateUserRefDto): Promise<UserRef> {
		return http.patch<UserRef>('/user-ref', { json: dto });
	}
}
