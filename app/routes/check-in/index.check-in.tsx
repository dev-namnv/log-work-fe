import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { ApiException } from '~/apis/http';
import { WorkLogService } from '~/apis/work-log.service';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import {
	useMonthlyReportQuery,
	WORK_LOG_KEYS,
} from '~/hooks/use-work-log-queries';
import { cn } from '~/lib/utils';
import type { WorkLog } from '~/types/api';

export function meta() {
	return [
		{ title: 'Chấm công — Log Work' },
		{ name: 'description', content: 'Check-in / Check-out nhanh' },
	];
}

/** YYYY-MM-DD theo giờ địa phương */
function localDateStr(d: Date = new Date()): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** HH:mm:ss theo giờ địa phương */
function localTimeStr(d: Date = new Date()): string {
	return d.toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
}

/** HH:mm từ ISO (giờ địa phương) */
function isoToLocalHHmm(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleTimeString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

export default function CheckInPage() {
	const { user, loading: authLoading } = useAuth();
	const queryClient = useQueryClient();

	const [now, setNow] = useState(new Date());
	const [selectedOrgId, setSelectedOrgId] = useState('');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const { data: orgs } = useOrganizationsQuery({ limit: 100 });

	const today = localDateStr(now);
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	// Đồng hồ tick mỗi giây
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

	// Báo cáo tháng theo tổ chức → lấy log của hôm nay
	const {
		data: report,
		isLoading: reportLoading,
		refetch,
	} = useMonthlyReportQuery({
		month: currentMonth,
		year: currentYear,
		organizationId: selectedOrgId || undefined,
	});

	const todayLog: WorkLog | undefined = useMemo(() => {
		if (!report) return undefined;
		return report.logs.find(
			(log) => log.date === startOfDay(today).toISOString(),
		);
	}, [report, today]);

	// Mutation: check-in (tạo mới, checkOut = null)
	const checkInMutation = useMutation({
		mutationFn: () =>
			WorkLogService.create({
				organizationId: selectedOrgId,
				checkIn: new Date().toISOString(),
				checkOut: null,
			}),
		onSuccess: () => {
			setErrorMsg(null);
			queryClient.invalidateQueries({
				queryKey: WORK_LOG_KEYS.monthlyReports(),
			});
			refetch();
		},
		onError: (err) => {
			setErrorMsg(
				err instanceof ApiException ? err.message : 'Check-in thất bại.',
			);
		},
	});

	// Mutation: check-out (cập nhật bản ghi hiện tại)
	const checkOutMutation = useMutation({
		mutationFn: (logId: string) =>
			WorkLogService.update(logId, { checkOut: new Date().toISOString() }),
		onSuccess: () => {
			setErrorMsg(null);
			queryClient.invalidateQueries({
				queryKey: WORK_LOG_KEYS.monthlyReports(),
			});
			refetch();
		},
		onError: (err) => {
			setErrorMsg(
				err instanceof ApiException ? err.message : 'Check-out thất bại.',
			);
		},
	});

	if (!authLoading && !user) return null;

	const isPending = checkInMutation.isPending || checkOutMutation.isPending;
	const isCheckedIn = !!todayLog && !todayLog.checkOut;
	const isCheckedOut = !!todayLog && !!todayLog.checkOut;
	console.log('todayLog', todayLog);

	const selectedOrg = orgs?.data.find((o) => o._id === selectedOrgId);

	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-8">
			<div className="w-full max-w-sm space-y-6">
				{/* Đồng hồ */}
				<div className="text-center space-y-1">
					<p className="text-6xl font-mono font-bold tracking-tight tabular-nums">
						{localTimeStr(now)}
					</p>
					<p className="text-sm text-muted-foreground">
						{now.toLocaleDateString('vi-VN', {
							weekday: 'long',
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
						})}
					</p>
				</div>

				{/* Chọn tổ chức */}
				<div className="space-y-1.5">
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

				{/* Trạng thái + nút */}
				<div
					className={cn(
						'rounded-2xl border p-6 text-center space-y-4 transition-colors',
						isCheckedOut &&
							'border-green-500/40 bg-green-50 dark:bg-green-950/20',
						isCheckedIn &&
							'border-amber-500/40 bg-amber-50 dark:bg-amber-950/20',
						!todayLog && !reportLoading && 'border-dashed',
					)}>
					{reportLoading ? (
						<div className="h-16 flex items-center justify-center">
							<span className="text-sm text-muted-foreground animate-pulse">
								Đang tải...
							</span>
						</div>
					) : isCheckedOut ? (
						<>
							<StatusRow
								label="Vào"
								time={isoToLocalHHmm(todayLog!.checkIn)}
								color="text-foreground"
							/>
							<StatusRow
								label="Ra"
								time={isoToLocalHHmm(todayLog!.checkOut!)}
								color="text-green-600"
							/>
							<p className="text-sm font-medium text-green-600">
								✓ Đã chấm công xong · {todayLog!.hours.toFixed(2)} giờ
							</p>
						</>
					) : isCheckedIn ? (
						<>
							<StatusRow
								label="Vào"
								time={isoToLocalHHmm(todayLog!.checkIn)}
								color="text-amber-600"
							/>
							<p className="text-sm text-muted-foreground">Chưa check-out</p>
							<Button
								size="lg"
								className="w-full h-14 text-base bg-amber-500 hover:bg-amber-600 text-white"
								disabled={isPending}
								onClick={() => checkOutMutation.mutate(todayLog!._id)}>
								{isPending ? 'Đang lưu...' : '⏹ Check-out'}
							</Button>
						</>
					) : (
						<>
							<p className="text-sm text-muted-foreground">
								Chưa chấm công hôm nay
							</p>
							<Button
								size="lg"
								className="w-full h-14 text-base bg-primary"
								disabled={isPending || !selectedOrgId}
								onClick={() => checkInMutation.mutate()}>
								{isPending ? 'Đang lưu...' : '▶ Check-in'}
							</Button>
						</>
					)}
				</div>

				{/* Lỗi */}
				{errorMsg && (
					<p className="text-sm text-destructive text-center">{errorMsg}</p>
				)}
			</div>
		</div>
	);
}

function StatusRow({
	label,
	time,
	color,
}: {
	label: string;
	time: string;
	color: string;
}) {
	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-muted-foreground font-medium">{label}</span>
			<span
				className={cn('text-2xl font-mono font-semibold tabular-nums', color)}>
				{time}
			</span>
		</div>
	);
}
