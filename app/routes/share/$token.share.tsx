import { useState } from 'react';
import { useParams } from 'react-router';
import CalendarView from '~/components/work-log/CalendarView';
import { useShareViewQuery } from '~/hooks/use-work-log-queries';
import { cn } from '~/lib/utils';
import type { WorkLog } from '~/types/api';

export function meta() {
	return [
		{ title: 'Báo cáo chấm công — Log Work' },
		{ name: 'description', content: 'Xem báo cáo chấm công được chia sẻ' },
	];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoToHHmm(iso: string | null): string {
	if (!iso) return '—';
	return new Date(iso).toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

function isoToDDMM(iso: string): string {
	return new Date(iso).toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
	});
}

function isoToWeekday(iso: string): string {
	return new Date(iso).toLocaleDateString('vi-VN', { weekday: 'short' });
}

function StatCard({
	label,
	value,
	sub,
	accent,
}: {
	label: string;
	value: string;
	sub?: string;
	accent?: string;
}) {
	return (
		<div className="rounded-lg border p-4 space-y-1">
			<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
				{label}
			</p>
			<p className={cn('text-2xl font-bold', accent)}>{value}</p>
			{sub && <p className="text-xs text-muted-foreground">{sub}</p>}
		</div>
	);
}

function LogRow({ log }: { log: WorkLog }) {
	const isIncomplete = !log.checkOut;
	return (
		<tr className="border-b last:border-0 hover:bg-muted/40 transition-colors text-sm">
			<td className="py-2.5 px-3 whitespace-nowrap">
				<span className="font-medium">{isoToDDMM(log.date)}</span>
				<span className="text-muted-foreground ml-1.5 text-xs">
					{isoToWeekday(log.date)}
				</span>
				{log.skipLunchBreak && (
					<span
						title="Không trừ nghỉ trưa"
						className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
						Xuyên trưa
					</span>
				)}
			</td>
			<td className="py-2.5 px-3 tabular-nums">{isoToHHmm(log.checkIn)}</td>
			<td className="py-2.5 px-3 tabular-nums">
				{isIncomplete ? (
					<span className="text-amber-500">Chưa ra</span>
				) : (
					isoToHHmm(log.checkOut)
				)}
			</td>
			<td className="py-2.5 px-3 tabular-nums text-right font-medium">
				{log.checkOut ? (
					<span
						className={cn(
							log.hours < 4
								? 'text-red-500'
								: log.hours < 8
									? 'text-amber-500'
									: 'text-green-600',
						)}>
						{log.hours.toFixed(2)}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</td>
			<td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate">
				{log.note || '—'}
			</td>
		</tr>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ShareViewPage() {
	const { token } = useParams<{ token: string }>();
	const { data, isLoading, isError, error } = useShareViewQuery(token ?? '');
	const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

	// --------------- Loading -----------------
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex flex-col items-center gap-3 text-muted-foreground">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="animate-spin">
						<path d="M21 12a9 9 0 1 1-6.219-8.56" />
					</svg>
					<p className="text-sm">Đang tải báo cáo…</p>
				</div>
			</div>
		);
	}

	// --------------- Error / expired -----------------
	if (isError) {
		const status = (error as { status?: number })?.status;
		const is410 = status === 410;
		return (
			<div className="min-h-screen bg-background flex items-center justify-center px-4">
				<div className="max-w-sm w-full text-center space-y-3">
					<div className="flex justify-center">
						<span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-red-500">
								<circle cx="12" cy="12" r="10" />
								<path d="m15 9-6 6" />
								<path d="m9 9 6 6" />
							</svg>
						</span>
					</div>
					<h1 className="text-lg font-semibold">
						{is410 ? 'Link đã hết hạn' : 'Không tìm thấy'}
					</h1>
					<p className="text-sm text-muted-foreground">
						{is410
							? 'Link chia sẻ này đã bị thu hồi hoặc đã hết hạn.'
							: 'Link chia sẻ không tồn tại hoặc đã bị xoá.'}
					</p>
				</div>
			</div>
		);
	}

	if (!data) return null;

	const { share, account, organization, month, year } = data;
	const fullName = `${account.firstName} ${account.lastName}`;
	const orgName = organization?.name ?? 'Tất cả tổ chức';
	const rateColor =
		data.attendanceRate >= 90
			? 'text-green-600'
			: data.attendanceRate >= 75
				? 'text-amber-500'
				: 'text-red-500';

	const sortedLogs = [...data.logs].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);

	return (
		<div className="min-h-screen bg-background">
			{/* Minimal header */}
			<header className="border-b border-border bg-background/95 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex h-12 max-w-screen-lg items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-2">
						<div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-primary-foreground">
								<path d="M9 11l3 3L22 4" />
								<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
							</svg>
						</div>
						<span className="text-sm font-semibold">Log Work</span>
					</div>
					<span className="text-xs text-muted-foreground">
						Báo cáo được chia sẻ
					</span>
				</div>
			</header>

			<main className="mx-auto max-w-screen-lg px-4 sm:px-6 py-8 space-y-6">
				{/* Subject */}
				<div className="rounded-lg border bg-muted/30 px-5 py-4">
					<h1 className="font-semibold text-base">{share.label}</h1>
					<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
						<span>{fullName}</span>
						<span>·</span>
						<span>{account.email}</span>
						<span>·</span>
						<span>{orgName}</span>
						<span>·</span>
						<span>
							Tháng {month}/{year}
						</span>
						{share.expiresAt && (
							<>
								<span>·</span>
								<span>
									Hết hạn{' '}
									{new Date(share.expiresAt).toLocaleDateString('vi-VN')}
								</span>
							</>
						)}
					</div>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<StatCard
						label="Ngày công / Chuẩn"
						value={`${data.loggedDays} / ${data.standardWorkDays}`}
						sub={`${data.totalHours.toFixed(1)} / ${data.totalStandardHours.toFixed(1)} giờ`}
					/>
					<StatCard
						label="Tỷ lệ chuyên cần"
						value={`${data.attendanceRate.toFixed(1)}%`}
						accent={rateColor}
					/>
					<StatCard
						label="Làm thêm giờ"
						value={`${data.overtimeHours.toFixed(1)} giờ`}
						accent={data.overtimeHours > 0 ? 'text-green-600' : undefined}
					/>
					<StatCard
						label="Thiếu giờ"
						value={`${data.missingHours.toFixed(1)} giờ`}
						accent={data.missingHours > 0 ? 'text-red-500' : 'text-green-600'}
					/>
				</div>

				{/* Work schedule info */}
				<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
					<span>
						Giờ làm:{' '}
						<span className="text-foreground font-medium">
							{data.workSchedule.workStartTime} –{' '}
							{data.workSchedule.workEndTime}
						</span>
					</span>
					<span>
						Nghỉ trưa:{' '}
						<span className="text-foreground font-medium">
							{data.workSchedule.lunchBreakMinutes} phút
						</span>
					</span>
					<span>
						Chuẩn/ngày:{' '}
						<span className="text-foreground font-medium">
							{data.standardHoursPerDay.toFixed(1)} giờ
						</span>
					</span>
				</div>

				{/* Log table */}
				{sortedLogs.length > 0 ? (
					<div className="space-y-3">
						{/* View toggle */}
						<div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
							<button
								type="button"
								onClick={() => setViewMode('list')}
								className={cn(
									'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
									viewMode === 'list'
										? 'bg-background text-foreground shadow-xs'
										: 'text-muted-foreground hover:text-foreground',
								)}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<line x1="8" x2="21" y1="6" y2="6" />
									<line x1="8" x2="21" y1="12" y2="12" />
									<line x1="8" x2="21" y1="18" y2="18" />
									<line x1="3" x2="3.01" y1="6" y2="6" />
									<line x1="3" x2="3.01" y1="12" y2="12" />
									<line x1="3" x2="3.01" y1="18" y2="18" />
								</svg>
								Danh sách
							</button>
							<button
								type="button"
								onClick={() => setViewMode('calendar')}
								className={cn(
									'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
									viewMode === 'calendar'
										? 'bg-background text-foreground shadow-xs'
										: 'text-muted-foreground hover:text-foreground',
								)}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="13"
									height="13"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
									<line x1="16" x2="16" y1="2" y2="6" />
									<line x1="8" x2="8" y1="2" y2="6" />
									<line x1="3" x2="21" y1="10" y2="10" />
								</svg>
								Lịch
							</button>
						</div>

						{viewMode === 'calendar' ? (
							<CalendarView
								logs={sortedLogs}
								month={month}
								year={year}
								standardHoursPerDay={data.standardHoursPerDay}
							/>
						) : (
							<div className="rounded-lg border overflow-x-auto">
								<table className="w-full min-w-[480px]">
									<thead>
										<tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
											<th className="py-2.5 px-3 text-left font-medium">
												Ngày
											</th>
											<th className="py-2.5 px-3 text-left font-medium">Vào</th>
											<th className="py-2.5 px-3 text-left font-medium">Ra</th>
											<th className="py-2.5 px-3 text-right font-medium">
												Giờ
											</th>
											<th className="py-2.5 px-3 text-left font-medium">
												Ghi chú
											</th>
										</tr>
									</thead>
									<tbody>
										{sortedLogs.map((log) => (
											<LogRow key={log._id} log={log} />
										))}
									</tbody>
									<tfoot>
										<tr className="bg-muted/30 text-sm font-medium">
											<td className="py-2.5 px-3" colSpan={3}>
												Tổng
											</td>
											<td className="py-2.5 px-3 tabular-nums text-right">
												{data.totalHours.toFixed(2)}
											</td>
											<td />
										</tr>
									</tfoot>
								</table>
							</div>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
						<p>
							Không có dữ liệu chấm công trong tháng {month}/{year}.
						</p>
					</div>
				)}

				{/* Footer note */}
				<p className="text-xs text-center text-muted-foreground pb-4">
					Báo cáo được tạo bởi{' '}
					<span className="text-foreground font-medium">Log Work</span> · Chia
					sẻ ngày{' '}
					{new Date(share.createdAt).toLocaleDateString('vi-VN', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
					})}
				</p>
			</main>
		</div>
	);
}
