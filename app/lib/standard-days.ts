import { HolidayType, type Holiday } from '~/types';

/**
 * Ngày công chuẩn = (T2–T6 trong tháng) − ngày Off + ngày Workday (làm bù).
 * @param month 1–12
 */
export function standardWorkDays(
	year: number,
	month: number,
	holidays: Holiday[],
): number {
	const prefix = `${year}-${String(month).padStart(2, '0')}-`;
	const map = new Map(
		holidays
			.filter((h) => h.date.startsWith(prefix))
			.map((h) => [h.date, h.type]),
	);
	const days = new Date(year, month, 0).getDate();
	let count = 0;
	for (let d = 1; d <= days; d++) {
		const iso = `${prefix}${String(d).padStart(2, '0')}`;
		const type = map.get(iso);
		if (type === HolidayType.Workday) count++; // T7/CN đi làm bù
		else if (type === HolidayType.Off) continue; // lễ / nghỉ bù
		else {
			const dow = new Date(year, month - 1, d).getDay();
			if (dow !== 0 && dow !== 6) count++; // T2–T6
		}
	}
	return count;
}
