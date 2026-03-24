import { useState } from 'react';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import { useMonthlyReportQuery } from '~/hooks/use-work-log-queries';
import { cn } from '~/lib/utils';
import type { WorkLog } from '~/types/api';

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
			<td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate">
				{log.note || '—'}
			</td>
		</tr>
	);
}

export default function AttendanceReportPage() {
	const { user, loading: authLoading } = useAuth();
	const now = new Date();

	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [orgId, setOrgId] = useState('');

	const { data: orgs } = useOrganizationsQuery({ limit: 100 });
	const { data: report, isLoading } = useMonthlyReportQuery({
		month,
		year,
		organizationId: orgId || undefined,
	});

	if (!authLoading && !user) return null;

	const sortedLogs = report
		? [...report.logs].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)
		: [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Báo cáo chuyên cần
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Theo dõi lịch sử chấm công của bạn theo tháng.
				</p>
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
			) : sortedLogs.length > 0 ? (
				<div className="rounded-lg border overflow-x-auto">
					<table className="w-full min-w-[480px]">
						<thead>
							<tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
								<th className="py-2.5 px-3 text-left font-medium">Ngày</th>
								<th className="py-2.5 px-3 text-left font-medium">Vào</th>
								<th className="py-2.5 px-3 text-left font-medium">Ra</th>
								<th className="py-2.5 px-3 text-right font-medium">Giờ</th>
								<th className="py-2.5 px-3 text-left font-medium">Ghi chú</th>
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
									{report!.totalHours.toFixed(2)}
								</td>
								<td />
							</tr>
						</tfoot>
					</table>
				</div>
			) : report ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
					<p>
						Không có dữ liệu chấm công trong tháng {month}/{year}.
					</p>
				</div>
			) : null}
		</div>
	);
}
