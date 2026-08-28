import { useState } from 'react';
import { NumberInput } from '~/components/ui/number-input';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import { useOrgReportQuery } from '~/hooks/use-work-log-queries';
import { formatCurrency, formatNumber } from '~/lib/number';
import {
	computeSalary,
	DEFAULT_OT_RATES,
	normalizeHoliday,
	type OtRates,
} from '~/lib/payroll';
import { cn } from '~/lib/utils';
import type { MemberWorkLog } from '~/types';

export function meta() {
	return [
		{ title: 'Báo cáo ngày công — Log Work' },
		{ name: 'description', content: 'Tổng hợp ngày công theo tổ chức' },
	];
}

function AttendanceBadge({ rate }: { rate: number }) {
	const color =
		rate >= 90
			? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
			: rate >= 75
				? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
				: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
	return (
		<span
			className={cn(
				'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
				color,
			)}>
			{rate.toFixed(1)}%
		</span>
	);
}

function MemberRow({
	member,
	standardWorkDays,
	totalStandardHours,
	standardHoursPerDay,
	baseSalary,
	otRates,
	holidays,
	onSalaryChange,
}: {
	member: MemberWorkLog;
	standardWorkDays: number;
	totalStandardHours: number;
	standardHoursPerDay: number;
	baseSalary: number;
	otRates: OtRates;
	holidays: Set<string>;
	onSalaryChange: (value: number) => void;
}) {
	const { total: salary, regularHours, otHours } = computeSalary(
		baseSalary,
		member,
		{ totalStandardHours, standardHoursPerDay },
		otRates,
		holidays,
	);
	const h = (n: number) => `${formatNumber(+n.toFixed(1))}h`;
	// Chỉ hiện bậc có giờ; giờ ngày thường luôn hiện
	const breakdown = [
		{ label: 'Thường', val: regularHours, show: true },
		{ label: 'OT thường', val: otHours.weekday, show: otHours.weekday > 0 },
		{ label: 'OT T7/CN', val: otHours.weekend, show: otHours.weekend > 0 },
		{ label: 'OT lễ', val: otHours.holiday, show: otHours.holiday > 0 },
	].filter((b) => b.show);
	return (
		<tr className="border-b last:border-0 hover:bg-muted/40 transition-colors text-sm">
			<td className="py-3 px-4">
				<p className="font-medium">
					{member.account.firstName} {member.account.lastName}
				</p>
				<p className="text-xs text-muted-foreground">{member.account.email}</p>
			</td>
			<td className="py-3 px-4 tabular-nums">
				{member.loggedDays}{' '}
				<span className="text-muted-foreground text-xs">
					/ {standardWorkDays}
				</span>
			</td>
			<td className="py-3 px-4 tabular-nums">
				{member.totalHours.toFixed(2)}{' '}
				<span className="text-muted-foreground text-xs">
					/ {totalStandardHours.toFixed(1)}
				</span>
			</td>
			<td className="py-3 px-4">
				<AttendanceBadge rate={member.attendanceRate} />
			</td>
			<td className="py-3 px-4">
				<NumberInput
					value={baseSalary || null}
					onValueChange={onSalaryChange}
					placeholder="0"
					className="w-32"
				/>
			</td>
			<td className="py-3 px-4 text-right align-top">
				<p className="font-medium tabular-nums whitespace-nowrap">
					{salary > 0 ? formatCurrency(salary) : '—'}
				</p>
				{salary > 0 && (
					<p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums leading-tight">
						{breakdown.map((b) => `${b.label} ${h(b.val)}`).join(' · ')}
					</p>
				)}
			</td>
		</tr>
	);
}

export default function PayrollReportPage() {
	const { user, loading: authLoading } = useAuth();
	const authReady = !authLoading && !!user;
	const now = new Date();

	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [orgId, setOrgId] = useState('');
	const [otRates, setOtRates] = useState<OtRates>(DEFAULT_OT_RATES);
	const [holidays, setHolidays] = useState<string[]>([]);
	const [holidayInput, setHolidayInput] = useState('');
	const [salaries, setSalaries] = useState<Record<string, number>>({});
	const holidaySet = new Set(holidays);

	const addHoliday = () => {
		const norm = normalizeHoliday(holidayInput);
		if (norm && !holidays.includes(norm)) setHolidays((h) => [...h, norm]);
		setHolidayInput('');
	};

	const { data: orgs, isLoading: orgsLoading } = useOrganizationsQuery(
		{
			limit: 100,
		},
		{ enabled: authReady },
	);

	// Tự chọn tổ chức đầu tiên
	const effectiveOrgId = orgId || orgs?.data[0]?._id || '';

	const { data: report, isLoading: reportLoading } = useOrgReportQuery(
		{
			organizationId: effectiveOrgId,
			month,
			year,
		},
		{ enabled: authReady && !!effectiveOrgId },
	);

	if (!authLoading && !user) return null;

	const isLoading = orgsLoading || reportLoading;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Báo cáo ngày công
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Tổng hợp ngày công của từng thành viên theo tổ chức và tháng.
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
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						% OT thường
					</label>
					<NumberInput
						value={otRates.weekday}
						onValueChange={(v) => setOtRates((r) => ({ ...r, weekday: v }))}
						className="w-20"
						title="% lương giờ tăng ca ngày thường"
					/>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						% OT cuối tuần
					</label>
					<NumberInput
						value={otRates.weekend}
						onValueChange={(v) => setOtRates((r) => ({ ...r, weekend: v }))}
						className="w-20"
						title="% lương giờ tăng ca cuối tuần"
					/>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						% OT lễ
					</label>
					<NumberInput
						value={otRates.holiday}
						onValueChange={(v) => setOtRates((r) => ({ ...r, holiday: v }))}
						className="w-20"
						title="% lương giờ tăng ca ngày lễ"
					/>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Ngày lễ (DD-MM)
					</label>
					<div className="flex min-h-9 w-64 flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1 focus-within:ring-1 focus-within:ring-ring">
						{holidays.map((h) => (
							<span
								key={h}
								className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
								{h}
								<button
									type="button"
									aria-label={`Xoá ${h}`}
									onClick={() =>
										setHolidays((list) => list.filter((x) => x !== h))
									}
									className="text-muted-foreground hover:text-foreground">
									×
								</button>
							</span>
						))}
						<input
							value={holidayInput}
							onChange={(e) => setHolidayInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ',') {
									e.preventDefault();
									addHoliday();
								} else if (
									e.key === 'Backspace' &&
									!holidayInput &&
									holidays.length
								) {
									setHolidays((list) => list.slice(0, -1));
								}
							}}
							onBlur={addHoliday}
							placeholder={holidays.length ? '' : '01-01'}
							title="Nhập ngày lễ dạng DD-MM rồi Enter"
							className="min-w-[3rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						/>
					</div>
				</div>
			</div>

			{/* Summary row */}
			{report && !reportLoading && (
				<div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 px-5 py-4 text-sm">
					<span>
						<span className="text-muted-foreground">Tổ chức: </span>
						<span className="font-semibold">{report.organization.name}</span>
					</span>
					<span>
						<span className="text-muted-foreground">Ngày chuẩn: </span>
						<span className="font-semibold">
							{report.standardWorkDays} ngày
						</span>
					</span>
					<span>
						<span className="text-muted-foreground">Giờ chuẩn/ngày: </span>
						<span className="font-semibold">
							{report.standardHoursPerDay.toFixed(1)} giờ
						</span>
					</span>
					<span>
						<span className="text-muted-foreground">Tổng giờ chuẩn: </span>
						<span className="font-semibold">
							{report.totalStandardHours.toFixed(1)} giờ
						</span>
					</span>
				</div>
			)}

			{/* Table */}
			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : !effectiveOrgId ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
					<p>Vui lòng chọn tổ chức để xem báo cáo.</p>
				</div>
			) : report && report.members.length > 0 ? (
				<div className="rounded-lg border overflow-x-auto">
					<table className="w-full min-w-[760px] table-fixed">
						<colgroup>
							<col className="w-[24%]" />
							<col className="w-[11%]" />
							<col className="w-[13%]" />
							<col className="w-[11%]" />
							<col className="w-[17%]" />
							<col className="w-[24%]" />
						</colgroup>
						<thead>
							<tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
								<th className="py-2.5 px-4 text-left font-medium">Nhân viên</th>
								<th className="py-2.5 px-4 text-left font-medium">Ngày công</th>
								<th className="py-2.5 px-4 text-left font-medium">Giờ thực</th>
								<th className="py-2.5 px-4 text-left font-medium">
									Chuyên cần
								</th>
								<th className="py-2.5 px-4 text-left font-medium">
									Mức lương
								</th>
								<th className="py-2.5 px-4 text-right font-medium">Lương</th>
							</tr>
						</thead>
						<tbody>
							{report.members.map((member) => (
								<MemberRow
									key={member.account._id}
									member={member}
									standardWorkDays={report.standardWorkDays}
									totalStandardHours={report.totalStandardHours}
									standardHoursPerDay={report.standardHoursPerDay}
									baseSalary={salaries[member.account._id] ?? 0}
									otRates={otRates}
									holidays={holidaySet}
									onSalaryChange={(v) =>
										setSalaries((s) => ({ ...s, [member.account._id]: v }))
									}
								/>
							))}
						</tbody>
						<tfoot>
							<tr className="bg-muted/30 text-sm font-medium">
								<td className="py-2.5 px-4">
									{report.members.length} thành viên
								</td>
								<td className="py-2.5 px-4 tabular-nums">
									{report.members.reduce((s, m) => s + m.loggedDays, 0)}
								</td>
								<td className="py-2.5 px-4 tabular-nums">
									{report.members
										.reduce((s, m) => s + m.totalHours, 0)
										.toFixed(2)}
								</td>
								<td />
								<td />
								<td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
									{formatCurrency(
										report.members.reduce(
											(s, m) =>
												s +
												computeSalary(
													salaries[m.account._id] ?? 0,
													m,
													{
														totalStandardHours: report.totalStandardHours,
														standardHoursPerDay: report.standardHoursPerDay,
													},
													otRates,
													holidaySet,
												).total,
											0,
										),
									)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			) : report ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
					<p>
						Tổ chức này chưa có dữ liệu chấm công trong tháng {month}/{year}.
					</p>
				</div>
			) : null}
		</div>
	);
}
