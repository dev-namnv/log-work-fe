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
/** Ngưỡng tối thiểu (giờ) để phần vượt được tính là OT. Dưới ngưỡng coi như 0. */
export const OT_MIN_HOURS = 30 / 60;

export function overtimeHours(
	log: Pick<WorkLog, 'items' | 'hours' | 'date'>,
	standardHoursPerDay: number,
): number {
	if (isOpen(log)) return 0; // phiên còn mở -> chưa chốt giờ
	const raw = isWeekend(log.date) ? log.hours : log.hours - standardHoursPerDay;
	// Chỉ tính OT khi vượt >= ngưỡng (tránh lố vài phút cũng báo OT)
	return raw >= OT_MIN_HOURS ? Math.round(raw * 100) / 100 : 0;
}

/** Ngày log rơi vào T7/CN (theo giờ VN) */
export function isWeekend(isoDate: string): boolean {
	const [y, m, d] = toDateString(isoDate).split('-').map(Number);
	const wd = new Date(y, m - 1, d).getDay(); // 0=CN, 6=T7
	return wd === 0 || wd === 6;
}

