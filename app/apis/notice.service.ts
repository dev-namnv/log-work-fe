import { http } from '~/apis/http';
import type {
	MessageResponse,
	Notice,
	NoticeType,
	NoticeVariant,
} from '~/types';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface SendNoticeBaseDto {
	type: NoticeType;
	variant?: NoticeVariant;
	message: string;
	link?: string | null;
}

export interface SendNoticeToUserDto extends SendNoticeBaseDto {
	/** MongoDB ObjectId của tài khoản nhận */
	id: string;
}

export interface SendNoticeToUsersDto extends SendNoticeBaseDto {
	/** Danh sách MongoDB ObjectId của các tài khoản nhận */
	ids: string[];
}

// ---------------------------------------------------------------------------
// NoticeService
// ---------------------------------------------------------------------------

export class NoticeService {
	/**
	 * Lấy tất cả thông báo chưa đọc của người dùng hiện tại.
	 */
	static getAll(): Promise<Notice[]> {
		return http.get<Notice[]>('/notice/all');
	}

	/**
	 * Đánh dấu một thông báo là đã đọc.
	 */
	static markAsRead(id: string): Promise<Notice> {
		return http.patch<Notice>(`/notice/${id}/mask-as-read`);
	}

	/**
	 * Xoá tất cả thông báo của người dùng hiện tại.
	 */
	static clearAll(): Promise<MessageResponse> {
		return http.post<MessageResponse>('/notice/clear-all');
	}

	/**
	 * Gửi thông báo đến toàn bộ người dùng (chỉ Admin).
	 */
	static notifyAll(dto: SendNoticeBaseDto): Promise<MessageResponse> {
		return http.post<MessageResponse>('/notice/notice-to-all-users', {
			json: dto,
		});
	}

	/**
	 * Gửi thông báo đến một người dùng cụ thể (chỉ Admin).
	 */
	static notifyUser(dto: SendNoticeToUserDto): Promise<Notice> {
		return http.post<Notice>('/notice/notice-to-user', { json: dto });
	}

	/**
	 * Gửi thông báo đến nhiều người dùng cụ thể (chỉ Admin).
	 */
	static notifyUsers(dto: SendNoticeToUsersDto): Promise<MessageResponse> {
		return http.post<MessageResponse>('/notice/notice-to-some-users', {
			json: dto,
		});
	}
}
