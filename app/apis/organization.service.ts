import { http } from '~/apis/http';
import type {
	MessageResponse,
	Organization,
	PaginatedResponse,
} from '~/types/api';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface WorkScheduleDto {
	workStartTime: string; // "HH:mm"
	workEndTime: string; // "HH:mm"
	lunchBreakMinutes: number;
}

export interface CreateOrganizationDto {
	name: string;
	description?: string;
	workSchedule?: WorkScheduleDto;
}

export interface UpdateOrganizationDto {
	name?: string;
	description?: string;
	isActive?: boolean;
	workSchedule?: WorkScheduleDto;
}

export interface SearchOrganizationDto {
	keyword?: string;
	page?: number;
	limit?: number;
}

export interface MemberDto {
	/** MongoDB ObjectId của tài khoản thành viên */
	memberId: string;
}

export interface UpdateWorkScheduleDto {
	workSchedule: WorkScheduleDto;
}

// ---------------------------------------------------------------------------
// OrganizationService
// ---------------------------------------------------------------------------

export class OrganizationService {
	/**
	 * Tạo tổ chức mới. Người tạo trở thành owner.
	 */
	static create(dto: CreateOrganizationDto): Promise<Organization> {
		return http.post<Organization>('/organization', { json: dto });
	}

	/**
	 * Tìm kiếm tổ chức mà người dùng hiện tại là owner hoặc member.
	 */
	static search(
		dto: SearchOrganizationDto = {},
	): Promise<PaginatedResponse<Organization>> {
		return http.post<PaginatedResponse<Organization>>('/organization/search', {
			json: dto,
		});
	}

	/**
	 * Lấy chi tiết tổ chức theo ID.
	 * Owner và members được populate đầy đủ.
	 */
	static getById(id: string): Promise<Organization> {
		return http.get<Organization>(`/organization/${id}/detail`);
	}

	/**
	 * Cập nhật thông tin tổ chức (chỉ owner).
	 */
	static update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
		return http.patch<Organization>(`/organization/${id}`, { json: dto });
	}

	/**
	 * Xoá tổ chức (chỉ owner).
	 */
	static deleteById(id: string): Promise<MessageResponse> {
		return http.delete<MessageResponse>(`/organization/${id}/delete`);
	}

	/**
	 * Thêm thành viên vào tổ chức (chỉ owner).
	 */
	static addMember(id: string, dto: MemberDto): Promise<Organization> {
		return http.post<Organization>(`/organization/${id}/add-member`, {
			json: dto,
		});
	}

	/**
	 * Xoá thành viên khỏi tổ chức (chỉ owner).
	 */
	static removeMember(id: string, dto: MemberDto): Promise<Organization> {
		return http.post<Organization>(`/organization/${id}/remove-member`, {
			json: dto,
		});
	}

	/**
	 * Cập nhật lịch làm việc của tổ chức (chỉ owner).
	 * Backend tự tính lại standardHoursPerDay khi tạo báo cáo.
	 */
	static updateWorkSchedule(
		id: string,
		dto: UpdateWorkScheduleDto,
	): Promise<Organization> {
		return http.patch<Organization>(`/organization/${id}/work-schedule`, {
			json: dto,
		});
	}
}
