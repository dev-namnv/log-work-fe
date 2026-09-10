export enum HolidayType {
	/** Ngày nghỉ: lễ chính thức hoặc nghỉ bù → trừ khỏi ngày công */
	Off = 'Off',
	/** Ngày làm bù: T7/CN phải đi làm (hoán đổi) → cộng vào ngày công */
	Workday = 'Workday',
}

export interface Holiday {
	_id: string;
	date: string; // "YYYY-MM-DD"
	name: string;
	type: HolidayType;
	createdAt: string;
	updatedAt: string;
}
