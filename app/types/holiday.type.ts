export enum HolidayType {
	/** Ngày nghỉ: lễ chính thức hoặc nghỉ bù → trừ khỏi ngày công */
	Off = 'off',
	/** Ngày làm bù: T7/CN phải đi làm (hoán đổi) → cộng vào ngày công */
	Workday = 'workday',
}

export interface Holiday {
	_id: string;
	date: string; // "YYYY-MM-DD"
	name: string;
	type: HolidayType;
	createdAt: string;
	updatedAt: string;
}
