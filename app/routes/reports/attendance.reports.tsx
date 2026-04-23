import { useState } from 'react';
import CalendarView from '~/components/work-log/CalendarView';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import {
	useCreateShareMutation,
	useRevokeShareMutation,
} from '~/hooks/use-work-log-mutations';
import {
	useMonthlyReportQuery,
	useShareLinksQuery,
} from '~/hooks/use-work-log-queries';
import { cn } from '~/lib/utils';
import type { WorkLog, WorkLogShare } from '~/types';

export function meta() {
	return [
		{ title: 'Báo cáo chuyên cần — Log Work' },
		{ name: 'description', content: 'Báo cáo chuyên cần cá nhân theo tháng' },
	];
}

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
	const hours = log.checkOut ? log.hours : null;
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
				{hours !== null ? (
					<span
						className={cn(
							hours < 4
								? 'text-red-500'
								: hours < 8
									? 'text-amber-500'
									: 'text-green-600',
						)}>
						{hours.toFixed(2)}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				)}
			</td>
			<td
				className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate"
				title={log.note || undefined}>
				{log.note || '—'}
			</td>
		</tr>
	);
}

// ---------------------------------------------------------------------------
// Share panel helpers
// ---------------------------------------------------------------------------

function formatShareUrl(token: string): string {
	if (typeof window === 'undefined') return `/share/${token}`;
	return `${window.location.origin}/share/${token}`;
}

function isExpired(expiresAt: string | null): boolean {
	if (!expiresAt) return false;
	return new Date(expiresAt) < new Date();
}

interface SharePanelProps {
	onClose: () => void;
	defaultMonth: number;
	defaultYear: number;
	defaultOrgId: string;
	orgOptions: { _id: string; name: string }[];
}

function SharePanel({
	onClose,
	defaultMonth,
	defaultYear,
	defaultOrgId,
	orgOptions,
}: SharePanelProps) {
	const [month, setMonth] = useState(defaultMonth);
	const [year, setYear] = useState(defaultYear);
	const [orgId, setOrgId] = useState(defaultOrgId);
	const [label, setLabel] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const { data: shares = [] as WorkLogShare[], isLoading: sharesLoading } =
		useShareLinksQuery();
	const createShare = useCreateShareMutation();
	const revokeShare = useRevokeShareMutation();

	function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		createShare.mutate({
			month,
			year,
			organizationId: orgId || undefined,
			label: label || undefined,
			expiresAt: expiresAt || undefined,
		});
	}

	function handleCopy(share: WorkLogShare) {
		const url = formatShareUrl(share.token);
		navigator.clipboard.writeText(url).then(() => {
			setCopiedId(share._id);
			setTimeout(() => setCopiedId(null), 2000);
		});
	}

	// Filter to active + non-expired shares
	const activeShares = shares.filter(
		(s: WorkLogShare) => s.isActive && !isExpired(s.expiresAt),
	);
	const inactiveShares = shares.filter(
		(s: WorkLogShare) => !s.isActive || isExpired(s.expiresAt),
	);

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden
			/>
			{/* Slide-over */}
			<aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-xl border-l border-border overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
					<h2 className="font-semibold text-base">Chia sẻ báo cáo</h2>
					<button
						type="button"
						title="Đóng"
						onClick={onClose}
						className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{/* Create form */}
					<div className="px-5 py-4 border-b border-border">
						<p className="text-sm font-medium mb-3">Tạo link mới</p>
						<form onSubmit={handleCreate} className="space-y-3">
							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1">
									<label className="text-xs text-muted-foreground">Tháng</label>
									<select
										title="Chọn tháng"
										value={month}
										onChange={(e) => setMonth(Number(e.target.value))}
										className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
										{Array.from({ length: 12 }, (_, i) => (
											<option key={i + 1} value={i + 1}>
												Tháng {i + 1}
											</option>
										))}
									</select>
								</div>
								<div className="space-y-1">
									<label className="text-xs text-muted-foreground">Năm</label>
									<select
										title="Chọn năm"
										value={year}
										onChange={(e) => setYear(Number(e.target.value))}
										className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
										{[2024, 2025, 2026, 2027].map((y) => (
											<option key={y} value={y}>
												{y}
											</option>
										))}
									</select>
								</div>
							</div>
							{orgOptions.length > 0 && (
								<div className="space-y-1">
									<label className="text-xs text-muted-foreground">
										Tổ chức (tùy chọn)
									</label>
									<select
										title="Chọn tổ chức"
										value={orgId}
										onChange={(e) => setOrgId(e.target.value)}
										className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
										<option value="">Tất cả tổ chức</option>
										{orgOptions.map((o) => (
											<option key={o._id} value={o._id}>
												{o.name}
											</option>
										))}
									</select>
								</div>
							)}
							<div className="space-y-1">
								<label className="text-xs text-muted-foreground">
									Nhãn (tùy chọn)
								</label>
								<input
									type="text"
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									placeholder="VD: Báo cáo T3/2026 — Nguyễn Văn A"
									maxLength={100}
									className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs text-muted-foreground">
									Hết hạn (tùy chọn)
								</label>
								<input
									type="date"
									title="Ngày hết hạn"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
									className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								/>
							</div>
							<button
								type="submit"
								disabled={createShare.isPending}
								className="w-full h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
								{createShare.isPending ? 'Đang tạo…' : 'Tạo link chia sẻ'}
							</button>
							{createShare.isError && (
								<p className="text-xs text-red-500">
									Tạo link thất bại. Vui lòng thử lại.
								</p>
							)}
						</form>
					</div>

					{/* Link list */}
					<div className="px-5 py-4 space-y-2">
						<p className="text-sm font-medium">Link đang hoạt động</p>
						{sharesLoading ? (
							<div className="space-y-2">
								{[1, 2].map((i) => (
									<div
										key={i}
										className="h-16 rounded-lg bg-muted animate-pulse"
									/>
								))}
							</div>
						) : activeShares.length === 0 ? (
							<p className="text-sm text-muted-foreground py-4 text-center">
								Chưa có link nào.
							</p>
						) : (
							activeShares.map((share: WorkLogShare) => (
								<ShareLinkCard
									key={share._id}
									share={share}
									copied={copiedId === share._id}
									onCopy={() => handleCopy(share)}
									onRevoke={() => revokeShare.mutate(share._id)}
									revoking={
										revokeShare.isPending && revokeShare.variables === share._id
									}
								/>
							))
						)}

						{inactiveShares.length > 0 && (
							<>
								<p className="text-sm font-medium pt-2 text-muted-foreground">
									Đã hết hạn / Thu hồi
								</p>
								{inactiveShares.map((share: WorkLogShare) => (
									<ShareLinkCard
										key={share._id}
										share={share}
										copied={copiedId === share._id}
										onCopy={() => handleCopy(share)}
										onRevoke={() => revokeShare.mutate(share._id)}
										revoking={
											revokeShare.isPending &&
											revokeShare.variables === share._id
										}
										dimmed
									/>
								))}
							</>
						)}
					</div>
				</div>
			</aside>
		</>
	);
}

function ShareLinkCard({
	share,
	copied,
	onCopy,
	onRevoke,
	revoking,
	dimmed,
}: {
	share: WorkLogShare;
	copied: boolean;
	onCopy: () => void;
	onRevoke: () => void;
	revoking: boolean;
	dimmed?: boolean;
}) {
	const orgName =
		share.organization && typeof share.organization === 'object'
			? share.organization.name
			: 'Tất cả tổ chức';

	return (
		<div
			className={cn(
				'rounded-lg border p-3 space-y-1.5 text-sm',
				dimmed && 'opacity-50',
			)}>
			<p className="font-medium leading-tight line-clamp-1">{share.label}</p>
			<p className="text-xs text-muted-foreground">
				T{share.month}/{share.year} · {orgName}
				{share.expiresAt && (
					<>
						{' '}
						· Hết hạn {new Date(share.expiresAt).toLocaleDateString('vi-VN')}
					</>
				)}
			</p>
			<div className="flex items-center gap-2 pt-0.5">
				<button
					type="button"
					onClick={onCopy}
					className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md border text-xs font-medium hover:bg-accent transition-colors">
					{copied ? (
						<>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round">
								<path d="M20 6 9 17l-5-5" />
							</svg>
							Đã sao chép
						</>
					) : (
						<>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
								<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
							</svg>
							Sao chép link
						</>
					)}
				</button>
				{share.isActive && (
					<button
						type="button"
						onClick={onRevoke}
						disabled={revoking}
						className="h-7 px-2.5 rounded-md border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
						{revoking ? '…' : 'Thu hồi'}
					</button>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AttendanceReportPage() {
	const { user, loading: authLoading } = useAuth();
	const authReady = !authLoading && !!user;
	const now = new Date();

	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [orgId, setOrgId] = useState('');
	const [shareOpen, setShareOpen] = useState(false);
	const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

	const { data: orgs } = useOrganizationsQuery(
		{ limit: 100 },
		{ enabled: authReady },
	);
	const { data: report, isLoading } = useMonthlyReportQuery(
		{
			month,
			year,
			organizationId: orgId || undefined,
		},
		{ enabled: authReady },
	);

	if (!authLoading && !user) return null;

	const sortedLogs = report
		? [...report.logs].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)
		: [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Báo cáo chuyên cần
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Theo dõi lịch sử chấm công của bạn theo tháng.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShareOpen(true)}
					className="shrink-0 flex items-center gap-1.5 h-9 rounded-md border px-3 text-sm font-medium hover:bg-accent transition-colors">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round">
						<circle cx="18" cy="5" r="3" />
						<circle cx="6" cy="12" r="3" />
						<circle cx="18" cy="19" r="3" />
						<line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
						<line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
					</svg>
					Chia sẻ
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Tháng
					</label>
					<select
						title="Chọn tháng"
						value={month}
						onChange={(e) => setMonth(Number(e.target.value))}
						className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
						{Array.from({ length: 12 }, (_, i) => (
							<option key={i + 1} value={i + 1}>
								Tháng {i + 1}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Năm
					</label>
					<select
						title="Chọn năm"
						value={year}
						onChange={(e) => setYear(Number(e.target.value))}
						className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
						{[2024, 2025, 2026, 2027].map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Tổ chức
					</label>
					<select
						title="Chọn tổ chức"
						value={orgId}
						onChange={(e) => setOrgId(e.target.value)}
						className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
						<option value="">Tất cả</option>
						{orgs?.data.map((o) => (
							<option key={o._id} value={o._id}>
								{o.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Stats */}
			{isLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : report ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<StatCard
						label="Ngày công / Chuẩn"
						value={`${report.loggedDays} / ${report.standardWorkDays}`}
						sub={`${report.totalHours.toFixed(1)} / ${report.totalStandardHours.toFixed(1)} giờ`}
					/>
					<StatCard
						label="Tỷ lệ chuyên cần"
						value={`${report.attendanceRate.toFixed(1)}%`}
						accent={
							report.attendanceRate >= 90
								? 'text-green-600'
								: report.attendanceRate >= 75
									? 'text-amber-500'
									: 'text-red-500'
						}
					/>
					<StatCard
						label="Làm thêm giờ"
						value={`${report.overtimeHours.toFixed(1)} giờ`}
						accent={report.overtimeHours > 0 ? 'text-green-600' : undefined}
					/>
					<StatCard
						label="Thiếu giờ"
						value={`${report.missingHours.toFixed(1)} giờ`}
						accent={report.missingHours > 0 ? 'text-red-500' : 'text-green-600'}
					/>
				</div>
			) : null}

			{/* Lịch sử */}
			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="h-10 rounded bg-muted animate-pulse" />
					))}
				</div>
			) : report ? (
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

					{sortedLogs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
							<p>
								Không có dữ liệu chấm công trong tháng {month}/{year}.
							</p>
						</div>
					) : viewMode === 'calendar' ? (
						<CalendarView
							logs={sortedLogs}
							month={month}
							year={year}
							standardHoursPerDay={report.standardHoursPerDay}
						/>
					) : (
						<div className="rounded-lg border overflow-x-auto">
							<table className="w-full min-w-[480px]">
								<thead>
									<tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
										<th className="py-2.5 px-3 text-left font-medium">Ngày</th>
										<th className="py-2.5 px-3 text-left font-medium">Vào</th>
										<th className="py-2.5 px-3 text-left font-medium">Ra</th>
										<th className="py-2.5 px-3 text-right font-medium">Giờ</th>
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
											{report.totalHours.toFixed(2)}
										</td>
										<td />
									</tr>
								</tfoot>
							</table>
						</div>
					)}
				</div>
			) : null}

			{/* Share panel */}
			{shareOpen && (
				<SharePanel
					onClose={() => setShareOpen(false)}
					defaultMonth={month}
					defaultYear={year}
					defaultOrgId={orgId}
					orgOptions={orgs?.data ?? []}
				/>
			)}
		</div>
	);
}
