import { http } from '~/apis/http';
import type {
	MessageResponse,
	MonthlyReport,
	OrganizationByReport,
	PaginatedResponse,
	WorkLog,
} from '~/types/api';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface CreateWorkLogDto {
	organizationId: string;
	checkIn: string; // ISO 8601
	checkOut: string | null; // ISO 8601, null khi chỉ check-in
	note?: string;
}

export interface UpdateWorkLogDto {
	checkIn?: string; // ISO 8601
	checkOut?: string; // ISO 8601
	note?: string;
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
}
