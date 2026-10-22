import { toDateString } from '~/lib/date';
import type { WorkLog } from '~/types';

/** Giờ vào đầu tiên trong ngày (ISO), null nếu chưa có phiên nào */
export function firstCheckIn(log: Pick<WorkLog, 'items'>): string | null {
	return log.items?.[0]?.checkIn ?? null;
}

/** Giờ ra cuối cùng trong ngày (ISO), null nếu phiên cuối còn mở */
export function lastCheckOut(log: Pick<WorkLog, 'items'>): string | null {
	const items = log.items;
	if (!items?.length) return null;
	return items[items.length - 1].checkOut ?? null;
}

/** Ngày còn phiên đang mở (đã vào, chưa ra) -> true */
export function isOpen(log: Pick<WorkLog, 'items'>): boolean {
	const items = log.items;
	return !!items?.length && !items[items.length - 1].checkOut;
}

/** Số phiên trong ngày (để hiện badge khi > 1) */
export function sessionCount(log: Pick<WorkLog, 'items'>): number {
	return log.items?.length ?? 0;
}

/** Giờ OT của ngày thường = giờ vượt chuẩn/ngày. T7/CN tính toàn bộ giờ là OT. */
export function overtimeHours(
	log: Pick<WorkLog, 'items' | 'hours' | 'date'>,
	standardHoursPerDay: number,
): number {
	if (isOpen(log)) return 0; // phiên còn mở -> chưa chốt giờ
	if (isWeekend(log.date)) return log.hours;
	return Math.max(0, Math.round((log.hours - standardHoursPerDay) * 100) / 100);
}

/** Ngày log rơi vào T7/CN (theo giờ VN) */
export function isWeekend(isoDate: string): boolean {
	const [y, m, d] = toDateString(isoDate).split('-').map(Number);
	const wd = new Date(y, m - 1, d).getDay(); // 0=CN, 6=T7
	return wd === 0 || wd === 6;
}

