import type { MemberWorkLog } from '~/types';

export type DayType = 'weekday' | 'weekend' | 'holiday';

export interface OtRates {
	weekday: number; // % đơn giá giờ, VD 150
	weekend: number;
	holiday: number;
}

export const DEFAULT_OT_RATES: OtRates = {
	weekday: 150,
	weekend: 200,
	holiday: 300,
};

export interface SalaryBreakdown {
	regularHours: number;
	otHours: Record<DayType, number>;
	total: number;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

// "YYYY-MM-DD" -> loại ngày. holidays chứa "DD-MM" (lặp hằng năm).
function dayType(date: string, holidays: Set<string>): DayType {
	const [y, m, d] = date.split('-').map(Number);
	if (holidays.has(`${pad2(d)}-${pad2(m)}`)) return 'holiday';
	const wd = new Date(y, m - 1, d).getDay(); // 0=CN, 6=T7
	return wd === 0 || wd === 6 ? 'weekend' : 'weekday';
}

/** Token tự do -> "DD-MM" chuẩn hoá, null nếu không hợp lệ */
export function normalizeHoliday(token: string): string | null {
	const m = token.trim().match(/^(\d{1,2})\D+(\d{1,2})$/);
	if (!m) return null;
	const d = Number(m[1]);
	const mo = Number(m[2]);
	if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
	return `${pad2(d)}-${pad2(mo)}`;
}

/**
 * Lương = giờ thường × đơn giá + Σ(giờ OT theo bậc × đơn giá × rate%).
 * OT ngày thường = giờ vượt chuẩn/ngày; cuối tuần & lễ = toàn bộ giờ log.
 * đơn giá = mức lương tháng / tổng giờ chuẩn.
 */
export function computeSalary(
	baseSalary: number,
	member: MemberWorkLog,
	std: { totalStandardHours: number; standardHoursPerDay: number },
	otRates: OtRates,
	holidays: Set<string>,
): SalaryBreakdown {
	const otHours: Record<DayType, number> = { weekday: 0, weekend: 0, holiday: 0 };
	if (!baseSalary || std.totalStandardHours <= 0)
		return { regularHours: 0, otHours, total: 0 };

	for (const log of member.logs ?? []) {
		const t = dayType(log.date, holidays);
		otHours[t] +=
			t === 'weekday' ? Math.max(log.hours - std.standardHoursPerDay, 0) : log.hours;
	}

	const totalOt = otHours.weekday + otHours.weekend + otHours.holiday;
	const regularHours = Math.max(member.totalHours - totalOt, 0);
	const hourly = baseSalary / std.totalStandardHours;
	const otPay =
		(hourly *
			(otHours.weekday * otRates.weekday +
				otHours.weekend * otRates.weekend +
				otHours.holiday * otRates.holiday)) /
		100;
	return { regularHours, otHours, total: hourly * regularHours + otPay };
}
