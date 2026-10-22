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
