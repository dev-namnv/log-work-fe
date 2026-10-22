import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiException } from '~/apis/http';
import { WorkLogService } from '~/apis/work-log.service';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import {
	useMonthlyReportQuery,
	WORK_LOG_KEYS,
} from '~/hooks/use-work-log-queries';
import {
	isoToDateShort,
	isoToHHmm,
	localDateStr,
	localTimeStr,
} from '~/lib/date';
import { cn } from '~/lib/utils';
import {
	firstCheckIn,
	isOpen,
	lastCheckOut,
	sessionCount,
} from '~/lib/work-log';
import type { WorkLog } from '~/types';

export function meta() {
	return [
		{ title: 'Tổng quan — Log Work' },
		{ name: 'description', content: 'Chấm công nhanh và tổng quan tháng' },
	];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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
		<div className="rounded-lg border p-3 space-y-0.5">
			<p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
				{label}
			</p>
			<p className={cn('text-xl font-bold', accent)}>{value}</p>
			{sub && <p className="text-xs text-muted-foreground">{sub}</p>}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
	const { user, loading: authLoading } = useAuth();
	const authReady = !authLoading && !!user;
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const [now, setNow] = useState(new Date());
	const [selectedOrgId, setSelectedOrgId] = useState('');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	// Chỉ gọi API nếu đã login
	const { data: orgs } = useOrganizationsQuery(
		{ limit: 100 },
		{ enabled: authReady },
	);

	const todayVN = localDateStr(now);
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	// Tick đồng hồ mỗi giây
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	// Tự chọn tổ chức đầu tiên khi load
	useEffect(() => {
		if (orgs?.data && orgs.data.length > 0 && !selectedOrgId) {
			setSelectedOrgId(orgs.data[0]._id);
		}
	}, [orgs, selectedOrgId]);

	const {
		data: report,
		isLoading: reportLoading,
		refetch,
	} = useMonthlyReportQuery(
		{
			month: currentMonth,
			year: currentYear,
			organizationId: selectedOrgId || undefined,
		},
		{ enabled: authReady && !!selectedOrgId },
	);

	// Log hôm nay (so sánh theo ngày VN)
	const todayLog: WorkLog | undefined = useMemo(() => {
		if (!report) return undefined;
		return report.logs.find(
			(log) => localDateStr(new Date(log.date)) === todayVN,
		);
	}, [report, todayVN]);

	const displayTodayLog = todayLog;

	// Check-in (lần đầu tạo log, lần sau push phiên OT) -> refetch report
	const checkInMutation = useMutation({
		mutationFn: () =>
			WorkLogService.clockCheckIn({ organizationId: selectedOrgId }),
		onSuccess: () => {
			setErrorMsg(null);
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.all });
			refetch();
		},
		onError: (err) => {
			setErrorMsg(
				err instanceof ApiException ? err.message : 'Check-in thất bại.',
			);
		},
	});

	// Check-out (đóng phiên cuối) -> refetch report
	const checkOutMutation = useMutation({
		mutationFn: () =>
			WorkLogService.clockCheckOut({ organizationId: selectedOrgId }),
		onSuccess: () => {
			setErrorMsg(null);
			queryClient.invalidateQueries({ queryKey: WORK_LOG_KEYS.all });
			refetch();
		},
		onError: (err) => {
			setErrorMsg(
				err instanceof ApiException ? err.message : 'Check-out thất bại.',
			);
		},
	});

	// Chưa đăng nhập
	if (!authLoading && !user) {
		return (
			<div className="space-y-6 py-8">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Chào mừng đến với Log Work
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Hệ thống quản lý chấm công đơn giản, hiệu quả.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button asChild>
						<Link to="/auth/login">Đăng nhập</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/auth/register">Tạo tài khoản</Link>
					</Button>
				</div>
			</div>
		);
	}

	const isPending = checkInMutation.isPending || checkOutMutation.isPending;
	const isCheckedIn = !!displayTodayLog && isOpen(displayTodayLog); // phiên đang mở
	const isCheckedOut = !!displayTodayLog && !isOpen(displayTodayLog); // đã đóng (có thể OT)
	const selectedOrg = orgs?.data.find((o) => o._id === selectedOrgId);

	// 5 log gần nhất (sort desc)
	const recentLogs = report
		? [...report.logs]
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
				.slice(0, 5)
		: [];

	function onGotoWorkLogDetail(log: WorkLog) {
		navigate(`/work-logs/${log._id}`);
	}

	return (
		<>
			{/* Mobile: check-in trước, stats sau. Desktop: 2 cột */}
			<div className="space-y-6 lg:grid lg:grid-cols-[360px_1fr] lg:gap-6 lg:space-y-0 lg:items-start">
				{/* ── Cột trái: Check-in card ── */}
				<div className="space-y-4">
					{/* Đồng hồ */}
					<div className="text-center space-y-0.5">
						<p className="text-5xl font-mono font-bold tracking-tight tabular-nums">
							{localTimeStr(now)}
						</p>
						<p className="text-sm text-muted-foreground">
							{now.toLocaleDateString('vi-VN', {
								weekday: 'long',
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								timeZone: 'Asia/Ho_Chi_Minh',
							})}
						</p>
					</div>

					{/* Chọn tổ chức */}
					<div className="space-y-1">
						<label
							htmlFor="org-select"
							className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Tổ chức
						</label>
						<select
							id="org-select"
							title="Chọn tổ chức"
							value={selectedOrgId}
							onChange={(e) => {
								setSelectedOrgId(e.target.value);
								setErrorMsg(null);
							}}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
							{orgs?.data.map((org) => (
								<option key={org._id} value={org._id}>
									{org.name}
								</option>
							))}
						</select>
						{selectedOrg && (
							<p className="text-xs text-muted-foreground">
								{selectedOrg.workSchedule.workStartTime} –{' '}
								{selectedOrg.workSchedule.workEndTime} · nghỉ trưa{' '}
								{selectedOrg.workSchedule.lunchBreakMinutes} phút
							</p>
						)}
					</div>

					{/* Trạng thái + nút hành động */}
					<div
						className={cn(
							'rounded-2xl border p-5 space-y-4 transition-colors',
							isCheckedOut &&
								'border-green-500/40 bg-green-50 dark:bg-green-950/20',
							isCheckedIn &&
								'border-amber-500/40 bg-amber-50 dark:bg-amber-950/20',
							!displayTodayLog && !reportLoading && 'border-dashed',
						)}>
						{reportLoading ? (
							<div className="h-16 flex items-center justify-center">
								<span className="text-sm text-muted-foreground animate-pulse">
									Đang tải...
								</span>
							</div>
						) : isCheckedOut ? (
							<>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground font-medium">Vào</span>
									<span className="text-2xl font-mono font-semibold tabular-nums">
										{isoToHHmm(firstCheckIn(displayTodayLog!)!)}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground font-medium">Ra</span>
									<span className="text-2xl font-mono font-semibold tabular-nums text-green-600">
										{isoToHHmm(lastCheckOut(displayTodayLog!)!)}
									</span>
								</div>
								<p className="text-sm font-medium text-green-600 text-center">
									✓ Đã chấm công xong · {displayTodayLog!.hours.toFixed(2)} giờ
									{sessionCount(displayTodayLog!) > 1 &&
										` · ${sessionCount(displayTodayLog!)} phiên`}
								</p>
								<Button
									size="lg"
									className="w-full h-14 text-base"
									disabled={isPending}
									onClick={() => checkInMutation.mutate()}>
									{isPending ? 'Đang lưu...' : '▶ Check-in lại (OT/bù)'}
								</Button>
							</>
						) : isCheckedIn ? (
							<>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground font-medium">Vào</span>
									<span className="text-2xl font-mono font-semibold tabular-nums text-amber-600">
										{isoToHHmm(firstCheckIn(displayTodayLog!)!)}
									</span>
								</div>
								<p className="text-sm text-muted-foreground text-center">
									Chưa check-out
								</p>
								<Button
									size="lg"
									className="w-full h-14 text-base bg-amber-500 hover:bg-amber-600 text-white"
									disabled={isPending}
									onClick={() => checkOutMutation.mutate()}>
									{isPending ? 'Đang lưu...' : '⏹ Check-out'}
								</Button>
							</>
						) : (
							<>
								<p className="text-sm text-muted-foreground text-center">
									Chưa chấm công hôm nay
								</p>
								<Button
									size="lg"
									className="w-full h-14 text-base"
									disabled={isPending || !selectedOrgId}
									onClick={() => checkInMutation.mutate()}>
									{isPending ? 'Đang lưu...' : '▶ Check-in'}
								</Button>
							</>
						)}
					</div>

					{errorMsg && (
						<p className="text-sm text-destructive text-center">{errorMsg}</p>
					)}
				</div>

				{/* ── Cột phải: Thống kê + log gần đây ── */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-base">
							Tháng {currentMonth}/{currentYear}
						</h2>
						<Link
							to="/reports/attendance"
							className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
							Xem báo cáo đầy đủ →
						</Link>
					</div>

					{/* Stat cards */}
					{reportLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="h-16 rounded-lg bg-muted animate-pulse"
								/>
							))}
						</div>
					) : report ? (
						<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
							<StatCard
								label="Ngày công"
								value={`${report.loggedDays}/${report.standardWorkDays}`}
								sub={`${report.totalHours.toFixed(1)}/${report.totalStandardHours.toFixed(1)} giờ`}
							/>
							<StatCard
								label="Chuyên cần"
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
								label="Làm thêm"
								value={`${report.overtimeHours.toFixed(1)}h`}
								accent={report.overtimeHours > 0 ? 'text-green-600' : undefined}
							/>
							<StatCard
								label="Thiếu giờ"
								value={`${report.missingHours.toFixed(1)}h`}
								accent={
									report.missingHours > 0 ? 'text-red-500' : 'text-green-600'
								}
							/>
						</div>
					) : null}

					{/* Log gần đây */}
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Gần đây
						</p>
						{reportLoading ? (
							<div className="space-y-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<div
										key={i}
										className="h-10 rounded-lg bg-muted animate-pulse"
									/>
								))}
							</div>
						) : recentLogs.length > 0 ? (
							<div className="rounded-lg border overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50 text-xs text-muted-foreground">
											<th className="py-2 px-3 text-left font-medium">Ngày</th>
											<th className="py-2 px-3 text-left font-medium">Vào</th>
											<th className="py-2 px-3 text-left font-medium">Ra</th>
											<th className="py-2 px-3 text-right font-medium">Giờ</th>
										</tr>
									</thead>
									<tbody>
										{recentLogs.map((log) => (
											<tr
												onClick={() => onGotoWorkLogDetail(log)}
												key={log._id}
												className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer">
												<td className="py-2 px-3 font-medium">
													{isoToDateShort(log.date)}
												</td>
												<td className="py-2 px-3 tabular-nums">
													{isoToHHmm(firstCheckIn(log))}
												</td>
												<td className="py-2 px-3 tabular-nums">
													{isOpen(log) ? (
														<span className="text-amber-500 text-xs">
															Chưa ra
														</span>
													) : (
														isoToHHmm(lastCheckOut(log))
													)}
												</td>
												<td className="py-2 px-3 tabular-nums text-right font-medium">
													{!isOpen(log) ? (
														<span
															className={cn(
																log.hours < 4
																	? 'text-red-500'
																	: log.hours < 8
																		? 'text-amber-500'
																		: 'text-green-600',
															)}>
															{log.hours.toFixed(1)}h
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : report ? (
							<p className="text-sm text-muted-foreground py-4 text-center">
								Chưa có bản ghi nào trong tháng này.
							</p>
						) : null}

						{recentLogs.length > 0 && (
							<Link
								to="/work-logs"
								className="block text-xs text-muted-foreground hover:text-foreground text-center pt-1 transition-colors hover:underline underline-offset-4">
								Xem tất cả →
							</Link>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
