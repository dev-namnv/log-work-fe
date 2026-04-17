import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import { useOrgReportQuery } from '~/hooks/use-work-log-queries';
import { cn } from '~/lib/utils';
import type { Account, MemberWorkLog } from '~/types';

export function meta() {
	return [
		{ title: 'Nhân viên — Log Work' },
		{ name: 'description', content: 'Danh sách nhân viên theo tổ chức' },
	];
}

function InitialAvatar({ name }: { name: string }) {
	const parts = name.trim().split(' ');
	const initials =
		parts.length >= 2
			? `${parts[0][0]}${parts[parts.length - 1][0]}`
			: parts[0].slice(0, 2);
	return (
		<span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
			{initials.toUpperCase()}
		</span>
	);
}

function MemberCard({
	member,
	orgId,
	standardWorkDays,
}: {
	member: MemberWorkLog;
	orgId: string;
	standardWorkDays: number;
}) {
	const rate = member.attendanceRate;
	const rateColor =
		rate >= 90
			? 'text-green-600'
			: rate >= 75
				? 'text-amber-500'
				: 'text-red-500';
	const fullName = `${member.account.firstName} ${member.account.lastName}`;

	return (
		<Link
			to={`/employees/${member.account._id}?orgId=${orgId}`}
			className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors">
			<InitialAvatar name={fullName} />
			<div className="flex-1 min-w-0">
				<p className="font-medium text-sm">{fullName}</p>
				<p className="text-xs text-muted-foreground truncate">
					{member.account.email}
				</p>
			</div>
			<div className="text-right shrink-0 space-y-0.5">
				<p className={cn('text-sm font-semibold tabular-nums', rateColor)}>
					{rate.toFixed(1)}%
				</p>
				<p className="text-xs text-muted-foreground tabular-nums">
					{member.loggedDays}/{standardWorkDays} ngày ·{' '}
					{member.totalHours.toFixed(1)}h
				</p>
			</div>
		</Link>
	);
}

export default function EmployeesPage() {
	const { user, loading: authLoading } = useAuth();
	const navigate = useNavigate();
	const now = new Date();

	const [orgId, setOrgId] = useState('');
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());

	const { data: orgs } = useOrganizationsQuery({ limit: 100 });

	// Tự chọn tổ chức đầu tiên
	useEffect(() => {
		if (orgs?.data && orgs.data.length > 0 && !orgId) {
			setOrgId(orgs.data[0]._id);
		}
	}, [orgs, orgId]);

	const effectiveOrgId = orgId || orgs?.data[0]?._id || '';

	const { data: report, isLoading } = useOrgReportQuery({
		organizationId: effectiveOrgId,
		month,
		year,
	});

	useEffect(() => {
		if (!authLoading && !user) {
			navigate('/auth/login?next=/employees', { replace: true });
		}
	}, [user, authLoading, navigate]);

	if (!authLoading && !user) return null;

	// Thành viên không có trong báo cáo (chưa chấm công tháng đó)
	const selectedOrg = orgs?.data.find((o) => o._id === effectiveOrgId);
	const reportMemberIds = new Set(report?.members.map((m) => m.account._id));
	const allMembers: Account[] = [
		...(typeof selectedOrg?.owner === 'object' ? [selectedOrg.owner] : []),
		...(selectedOrg?.members.filter(
			(m): m is Account => typeof m === 'object',
		) ?? []),
	];
	const absentMembers = allMembers.filter((m) => !reportMemberIds.has(m._id));

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Nhân viên</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Danh sách nhân viên và tình hình chấm công theo tổ chức.
				</p>
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

			{/* List */}
			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : report && report.members.length > 0 ? (
				<div className="space-y-3">
					<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
						Đã chấm công ({report.members.length})
					</p>
					<div className="space-y-2">
						{report.members.map((member) => (
							<MemberCard
								key={member.account._id}
								member={member}
								orgId={effectiveOrgId}
								standardWorkDays={report.standardWorkDays}
							/>
						))}
					</div>

					{absentMembers.length > 0 && (
						<>
							<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-2">
								Chưa chấm công ({absentMembers.length})
							</p>
							<div className="space-y-2">
								{absentMembers.map((m) => (
									<Link
										key={m._id}
										to={`/employees/${m._id}?orgId=${effectiveOrgId}`}
										className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 hover:bg-muted/50 transition-colors opacity-60">
										<InitialAvatar name={`${m.firstName} ${m.lastName}`} />
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm">
												{m.firstName} {m.lastName}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{m.email}
											</p>
										</div>
										<p className="text-xs text-muted-foreground">0 ngày công</p>
									</Link>
								))}
							</div>
						</>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
					<p>
						Chưa có dữ liệu chấm công trong tháng {month}/{year}.
					</p>
					{selectedOrg && allMembers.length > 0 && (
						<p className="text-sm">
							{allMembers.length} thành viên trong tổ chức chưa chấm công.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
