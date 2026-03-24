import { cn } from '~/lib/utils';
import type { WorkLog } from '~/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoToHHmm(iso: string | null): string {
	if (!iso) return '—';
	return new Date(iso).toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

/** Convert an ISO string → "YYYY-MM-DD" in Vietnam timezone */
function toVnDateKey(iso: string): string {
	return new Date(iso).toLocaleDateString('en-CA', {
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

/** Monday-first week column index (0=Mon … 6=Sun) for a given Date */
function monFirstWeekday(date: Date): number {
	return (date.getDay() + 6) % 7;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarViewProps {
	logs: WorkLog[];
	month: number; // 1-12
	year: number;
	standardHoursPerDay?: number; // default 8
}

// ---------------------------------------------------------------------------
// CalendarView
// ---------------------------------------------------------------------------

export default function CalendarView({
	logs,
	month,
	year,
	standardHoursPerDay = 8,
}: CalendarViewProps) {
	// Build a map from "YYYY-MM-DD" (Vietnam timezone) → WorkLog for fast lookup
	const logsByDate: Record<string, WorkLog> = {};
	for (const log of logs) {
		const key = toVnDateKey(log.date);
		logsByDate[key] = log;
	}

	const daysInMonth = new Date(year, month, 0).getDate();
	const firstWeekday = monFirstWeekday(new Date(year, month - 1, 1)); // 0=Mon
	const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

	const todayKey = new Date().toLocaleDateString('en-CA', {
		timeZone: 'Asia/Ho_Chi_Minh',
	});

	const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
	const isWeekendCol = [false, false, false, false, false, true, true]; // 5=Sat, 6=Sun

	return (
		<div className="rounded-lg border overflow-hidden">
			{/* Weekday header */}
			<div className="grid grid-cols-7 border-b bg-muted/50">
				{weekdays.map((d, i) => (
					<div
						key={d}
						className={cn(
							'py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground',
							isWeekendCol[i] && 'text-muted-foreground/60',
						)}>
						{d}
					</div>
				))}
			</div>

			{/* Day cells */}
			<div className="grid grid-cols-7">
				{Array.from({ length: totalCells }, (_, idx) => {
					const day = idx - firstWeekday + 1;
					const colIdx = idx % 7;
					const isWeekend = isWeekendCol[colIdx];

					// ── out-of-month cell ──
					if (day < 1 || day > daysInMonth) {
						return (
							<div
								key={idx}
								className={cn(
									'min-h-[64px] border-b border-r last-in-row:border-r-0 p-1',
									'bg-muted/20',
									(colIdx === 6 || day === daysInMonth) && 'border-r-0',
								)}
							/>
						);
					}

					const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
					const log = logsByDate[dateKey];
					const isToday = dateKey === todayKey;
					const isFuture = dateKey > todayKey; // YYYY-MM-DD string comparison is safe
					const isAbsent = !log && !isWeekend && !isFuture;

					// ── color band ──
					let accent = '';
					if (log?.checkOut) {
						if (log.hours >= standardHoursPerDay) accent = 'full';
						else if (log.hours >= standardHoursPerDay / 2) accent = 'half';
						else accent = 'low';
					} else if (log?.checkIn && !log.checkOut) {
						accent = 'in-progress';
					}

					return (
						<div
							key={dateKey}
							className={cn(
								'relative min-h-[64px] border-b border-r p-1 transition-colors',
								// right border — remove on last column
								colIdx === 6 && 'border-r-0',
								// background shading
								isWeekend && !log && 'bg-muted/30',
								isAbsent && 'bg-red-50 dark:bg-red-950/20',
								isWeekend && 'cursor-default',
								// today ring
								isToday && 'ring-2 ring-inset ring-primary/60',
							)}>
							{/* Day number */}
							<span
								className={cn(
									'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold leading-none',
									isToday
										? 'bg-primary text-primary-foreground'
										: isWeekend
											? 'text-muted-foreground/60'
											: isAbsent
												? 'text-red-400'
												: 'text-foreground',
								)}>
								{day}
							</span>

							{/* Log content */}
							{log ? (
								<div
									className={cn(
										'mt-0.5 rounded px-1 py-0.5 text-[10px] leading-tight space-y-0.5',
										accent === 'full' &&
											'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
										accent === 'half' &&
											'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
										accent === 'low' &&
											'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
										accent === 'in-progress' &&
											'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
									)}>
									{/* Times — hidden on very small screens */}
									<span className="hidden sm:flex gap-0.5 items-center">
										<span>{isoToHHmm(log.checkIn)}</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="8"
											height="8"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="shrink-0 opacity-60">
											<path d="M5 12h14" />
											<path d="m12 5 7 7-7 7" />
										</svg>
										<span>
											{log.checkOut ? (
												isoToHHmm(log.checkOut)
											) : (
												<span className="italic opacity-75">đang làm</span>
											)}
										</span>
									</span>
									{/* Hours */}
									<span className="font-medium">
										{log.checkOut ? (
											<>{log.hours.toFixed(1)}h</>
										) : (
											<span className="sm:hidden">•</span>
										)}
									</span>
								</div>
							) : isAbsent ? (
								<div className="mt-0.5 text-[9px] text-red-400/80 font-medium px-0.5 hidden sm:block">
									vắng
								</div>
							) : null}
						</div>
					);
				})}
			</div>

			{/* Legend */}
			<div className="border-t px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 bg-muted/20">
				{[
					{
						label: `≥ ${standardHoursPerDay}h`,
						cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
					},
					{
						label: `${standardHoursPerDay / 2}–${standardHoursPerDay}h`,
						cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
					},
					{
						label: `< ${standardHoursPerDay / 2}h`,
						cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
					},
					{
						label: 'Đang làm',
						cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
					},
					{ label: 'Vắng', cls: 'bg-red-50 text-red-400 dark:bg-red-950/20' },
				].map(({ label, cls }) => (
					<span
						key={label}
						className={cn(
							'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
							cls,
						)}>
						{label}
					</span>
				))}
			</div>
		</div>
	);
}
