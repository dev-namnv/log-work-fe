import { http } from '~/apis/http';
import type { Holiday, HolidayType } from '~/types';

export interface UpsertHolidayDto {
	date: string; // "YYYY-MM-DD"
	name: string;
	type: HolidayType;
}

export class HolidayService {
	/** Danh sách ngày lễ/làm bù trong năm — FE dùng để tính ngày công chuẩn. */
	static listByYear(year: number): Promise<Holiday[]> {
		return http.get<Holiday[]>(`/holidays?year=${year}`);
	}

	/** Admin: thêm ngày lễ. */
	static create(dto: UpsertHolidayDto): Promise<Holiday> {
		return http.post<Holiday>('/holidays', { json: dto });
	}

	/** Admin: sửa ngày lễ. */
	static update(id: string, dto: UpsertHolidayDto): Promise<Holiday> {
		return http.put<Holiday>(`/holidays/${id}`, { json: dto });
	}

	/** Admin: xoá ngày lễ. */
	static remove(id: string): Promise<void> {
		return http.delete<void>(`/holidays/${id}`);
	}
}
