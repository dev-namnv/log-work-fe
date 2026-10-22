import { isoToHHmm } from '~/lib/date';
import { cn } from '~/lib/utils';
import { isOpen, isWeekend, overtimeHours } from '~/lib/work-log';
import type { WorkLog } from '~/types';

/**
 * Liệt kê giờ Vào (hoặc Ra) của mọi phiên trong ngày, mỗi phiên 1 dòng.
 * @param log bản ghi chấm công
 * @param side 'in' = giờ vào, 'out' = giờ ra
 */
export function SessionTimes({ log, side }: { log: WorkLog; side: 'in' | 'out' }) {
	const items = log.items ?? [];
	if (!items.length) return <span className="text-muted-foreground">—</span>;
	return (
		<div className="flex flex-col gap-0.5 tabular-nums">
			{items.map((it, i) => {
				if (side === 'in') return <span key={i}>{isoToHHmm(it.checkIn)}</span>;
				return it.checkOut ? (
					<span key={i}>{isoToHHmm(it.checkOut)}</span>
				) : (
					<span key={i} className="text-amber-500 text-xs">
						Chưa ra
					</span>
				);
			})}
		</div>
	);
}

/**
 * Badge nhận biết ngày đặc biệt: OT (vượt giờ chuẩn / cuối tuần), Làm bù (ngày lễ type Workday).
 * @param log bản ghi
 * @param standardHoursPerDay giờ chuẩn/ngày để tính OT
 * @param isMakeup ngày này là lễ làm bù (từ holidays map) - optional
 */
export function DayBadges({
	log,
	standardHoursPerDay,
	isMakeup,
}: {
	log: WorkLog;
	standardHoursPerDay: number;
	isMakeup?: boolean;
}) {
	const ot = overtimeHours(log, standardHoursPerDay);
	const weekend = isWeekend(log.date);
	return (
		<>
			{isMakeup && <Badge cls="indigo">Làm bù</Badge>}
			{ot > 0 && !isOpen(log) && (
				<Badge cls="green">
					{weekend ? 'OT cuối tuần' : 'OT'} +{ot.toFixed(1)}h
				</Badge>
			)}
			{log.skipLunchBreak && <Badge cls="amber">Xuyên trưa</Badge>}
		</>
	);
}

const BADGE_CLS = {
	green:
		'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
	amber:
		'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
	indigo:
		'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
} as const;

function Badge({
	cls,
	children,
}: {
	cls: keyof typeof BADGE_CLS;
	children: React.ReactNode;
}) {
	return (
		<span
			className={cn(
				'ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
				BADGE_CLS[cls],
			)}>
			{children}
		</span>
	);
}
