import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import { useOrgReportQuery } from '~/hooks/use-work-log-queries';
import { cn } from '~/lib/utils';
import type { WorkLog } from '~/types';

export function meta() {
	return [
		{ title: 'Hồ sơ nhân viên — Log Work' },
		{ name: 'description', content: 'Lịch sử chấm công của nhân viên' },
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

function InitialAvatar({
	name,
	size = 'md',
}: {
	name: string;
	size?: 'md' | 'lg';
}) {
	const parts = name.trim().split(' ');
	const initials =
		parts.length >= 2
			? `${parts[0][0]}${parts[parts.length - 1][0]}`
			: parts[0].slice(0, 2);
	return (
		<span
			className={cn(
				'flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0',
				size === 'lg' ? 'h-14 w-14 text-xl' : 'h-9 w-9 text-sm',
			)}>
			{initials.toUpperCase()}
		</span>
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

export default function EmployeeDetailPage() {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const { user, loading: authLoading } = useAuth();
	const authReady = !authLoading && !!user;
	const now = new Date();

	// orgId có thể truyền qua query string từ trang list
	const [orgId, setOrgId] = useState(searchParams.get('orgId') ?? '');
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());

	const { data: orgs } = useOrganizationsQuery(
		{ limit: 100 },
		{ enabled: authReady },
	);

	const effectiveOrgId = orgId || orgs?.data[0]?._id || '';

	const { data: report, isLoading } = useOrgReportQuery(
		{
			organizationId: effectiveOrgId,
			month,
			year,
		},
		{ enabled: authReady && !!effectiveOrgId },
	);

	if (!authLoading && !user) return null;

	// Tìm thành viên trong báo cáo
	const member = report?.members.find((m) => m.account._id === id);

	// Tìm trong danh sách org members (kể cả khi chưa chấm công)
	const allOrgMembers = (() => {
		const org = orgs?.data.find((o) => o._id === effectiveOrgId);
		if (!org) return [];
		const owner = typeof org.owner === 'object' ? org.owner : null;
		const members = org.members.filter(
			(m): m is import('~/types').Account => typeof m === 'object',
		);
		return owner ? [owner, ...members] : members;
	})();
	const account = member?.account ?? allOrgMembers.find((m) => m._id === id);

	const fullName = account
		? `${account.firstName} ${account.lastName}`
		: 'Nhân viên';

	const sortedLogs = member
		? [...member.logs].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)
		: [];

	const rate = member?.attendanceRate ?? 0;
	const rateColor =
		rate >= 90
			? 'text-green-600'
			: rate >= 75
				? 'text-amber-500'
				: 'text-red-500';

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<nav className="text-sm text-muted-foreground flex items-center gap-1">
				<Link
					to="/employees"
					className="hover:text-foreground transition-colors">
					Nhân viên
				</Link>
				<span>/</span>
				<span className="text-foreground">{fullName}</span>
			</nav>

			{/* Profile header */}
			<div className="flex items-center gap-4">
				<InitialAvatar name={fullName} size="lg" />
				<div>
					<h1 className="text-xl font-semibold">{fullName}</h1>
					{account && (
						<p className="text-sm text-muted-foreground">{account.email}</p>
					)}
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Tổ chức
					</label>
					<select
						title="Chọn tổ chức"
						value={effectiveOrgId}
						onChange={(e) => setOrgId(e.target.value)}
						className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
						{orgs?.data.map((o) => (
							<option key={o._id} value={o._id}>
								{o.name}
							</option>
						))}
					</select>
				</div>
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
			</div>

			{/* Stats */}
			{isLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : member ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div className="rounded-lg border p-4 space-y-1">
						<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
							Ngày công
						</p>
						<p className="text-2xl font-bold">
							{member.loggedDays}
							<span className="text-base text-muted-foreground font-normal">
								/{report!.standardWorkDays}
							</span>
						</p>
					</div>
					<div className="rounded-lg border p-4 space-y-1">
						<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
							Tổng giờ
						</p>
						<p className="text-2xl font-bold">
							{member.totalHours.toFixed(1)}
							<span className="text-xs text-muted-foreground font-normal ml-1">
								/ {report!.totalStandardHours.toFixed(1)}h
							</span>
						</p>
					</div>
					<div className="rounded-lg border p-4 space-y-1">
						<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
							Chuyên cần
						</p>
						<p className={cn('text-2xl font-bold', rateColor)}>
							{rate.toFixed(1)}%
						</p>
					</div>
					<div className="rounded-lg border p-4 space-y-1">
						<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
							Bản ghi
						</p>
						<p className="text-2xl font-bold">{member.logs.length}</p>
					</div>
				</div>
			) : !isLoading && effectiveOrgId ? (
				<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
					Nhân viên này chưa chấm công trong tháng {month}/{year}.
				</div>
			) : null}

			{/* Log table */}
			{!isLoading && sortedLogs.length > 0 && (
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
									{member!.totalHours.toFixed(2)}
								</td>
								<td />
							</tr>
						</tfoot>
					</table>
				</div>
			)}
		</div>
	);
}
