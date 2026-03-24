import { http } from '~/apis/http';
import type {
	MessageResponse,
	MonthlyReport,
	OrganizationByReport,
	PaginatedResponse,
	WorkLog,
	WorkLogShare,
	WorkLogShareView,
} from '~/types/api';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface CreateWorkLogDto {
	organizationId: string;
	checkIn: string; // ISO 8601
	checkOut: string | null; // ISO 8601, null khi chỉ check-in
	note?: string;
	/** Bỏ qua khấu trừ nghỉ trưa (làm xuyên trưa hoặc chỉ 1 buổi) */
	skipLunchBreak?: boolean;
}

export interface UpdateWorkLogDto {
	checkIn?: string; // ISO 8601
	checkOut?: string; // ISO 8601
	note?: string;
	/** Bỏ qua khấu trừ nghỉ trưa (làm xuyên trưa hoặc chỉ 1 buổi) */
	skipLunchBreak?: boolean;
}

export interface SearchWorkLogDto {
	keyword?: string;
	page?: number;
	limit?: number;
}

export interface MonthlyReportParams {
	month: number; // 1–12
	year: number;
	organizationId?: string;
}

export interface OrgReportDto {
	organizationId: string;
	month: number; // 1–12
	year: number;
}

export interface CreateShareDto {
	month: number;
	year: number;
	organizationId?: string;
	label?: string;
	expiresAt?: string;
}

// ---------------------------------------------------------------------------
// WorkLogService
// ---------------------------------------------------------------------------

export class WorkLogService {
	/**
	 * Tạo bản ghi chấm công cho ngày hiện tại.
	 * Mỗi (account, organization, date) chỉ được tạo một lần.
	 */
	static create(dto: CreateWorkLogDto): Promise<WorkLog> {
		return http.post<WorkLog>('/work-log', { json: dto });
	}

	/**
	 * Tìm kiếm / phân trang bản ghi chấm công của người dùng hiện tại.
	 */
	static search(
		dto: SearchWorkLogDto = {},
	): Promise<PaginatedResponse<WorkLog>> {
		return http.post<PaginatedResponse<WorkLog>>('/work-log/search', {
			json: dto,
		});
	}

	/**
	 * Lấy báo cáo tháng cho người dùng hiện tại.
	 * Tùy chọn lọc theo tổ chức.
	 */
	static getMonthlyReport(params: MonthlyReportParams): Promise<MonthlyReport> {
		return http.get<MonthlyReport>('/work-log/monthly-report', {
			params: params as unknown as Record<
				string,
				string | number | boolean | undefined | null
			>,
		});
	}

	/**
	 * Lấy báo cáo chấm công theo từng thành viên trong tổ chức.
	 */
	static getByOrganization(dto: OrgReportDto): Promise<OrganizationByReport> {
		return http.post<OrganizationByReport>('/work-log/by-organization', {
			json: dto,
		});
	}

	/**
	 * Lấy chi tiết một bản ghi chấm công.
	 */
	static getById(id: string): Promise<WorkLog> {
		return http.get<WorkLog>(`/work-log/${id}/detail`);
	}

	/**
	 * Cập nhật bản ghi chấm công. Giờ làm được tính lại tự động từ checkIn/checkOut.
	 */
	static update(id: string, dto: UpdateWorkLogDto): Promise<WorkLog> {
		return http.patch<WorkLog>(`/work-log/${id}`, { json: dto });
	}

	/**
	 * Xoá bản ghi chấm công.
	 */
	static deleteById(id: string): Promise<MessageResponse> {
		return http.delete<MessageResponse>(`/work-log/${id}/delete`);
	}

	// -----------------------------------------------------------------------
	// Share
	// -----------------------------------------------------------------------

	/**
	 * Tạo link chia sẻ báo cáo tháng.
	 */
	static createShare(dto: CreateShareDto): Promise<WorkLogShare> {
		return http.post<WorkLogShare>('/work-log/share', { json: dto });
	}

	/**
	 * Lấy danh sách tất cả link chia sẻ của người dùng hiện tại.
	 */
	static getShares(): Promise<WorkLogShare[]> {
		return http.get<WorkLogShare[]>('/work-log/share');
	}

	/**
	 * Thu hồi link chia sẻ theo id.
	 */
	static revokeShare(id: string): Promise<MessageResponse> {
		return http.delete<MessageResponse>(`/work-log/share/${id}/delete`);
	}

	/**
	 * Xem báo cáo qua link chia sẻ — không yêu cầu đăng nhập.
	 */
	static viewShare(token: string): Promise<WorkLogShareView> {
		return http.get<WorkLogShareView>(`/work-log/share/${token}/view`);
	}
}
