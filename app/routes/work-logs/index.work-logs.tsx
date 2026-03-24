import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/contexts/auth-context';
import {
	useMonthlyReportQuery,
	useWorkLogsQuery,
} from '~/hooks/use-work-log-queries';
import type { WorkLog } from '~/types/api';

export function meta() {
	return [
		{ title: 'Chấm công — Log Work' },
		{ name: 'description', content: 'Danh sách bản ghi chấm công' },
	];
}

function formatDateTime(iso: string) {
	const d = new Date(iso);
	return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
	const d = new Date(iso);
	return d.toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function WorkLogRow({ log }: { log: WorkLog }) {
	return (
		<Link
			to={`/work-logs/${log._id}`}
			className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors text-sm">
			<div className="space-y-0.5">
				<div className="flex items-center gap-2">
					<p className="font-medium">{formatDate(log.date)}</p>
					{log.skipLunchBreak && (
						<span
							title="Không trừ nghỉ trưa"
							className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
							Xuyên trưa
						</span>
					)}
				</div>
				<p className="text-muted-foreground text-xs">
					{log.checkIn ? formatDateTime(log.checkIn) : '—'} →{' '}
					{log.checkOut ? formatDateTime(log.checkOut) : '—'}
				</p>
				{log.note && (
					<p className="text-muted-foreground text-xs italic line-clamp-1">
						{log.note}
					</p>
				)}
			</div>
			<div className="text-right shrink-0 ml-4">
				<span className="font-semibold">{log.hours.toFixed(2)} giờ</span>
			</div>
		</Link>
	);
}

export default function WorkLogsPage() {
	const { user, loading: authLoading } = useAuth();
	const navigate = useNavigate();

	const now = new Date();
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());
	const [keyword, setKeyword] = useState('');
	const [search, setSearch] = useState('');

	const {
		data: logs,
		isLoading: logsLoading,
		error: logsError,
	} = useWorkLogsQuery({
		keyword: search,
		limit: 50,
	});

	const { data: report, isLoading: reportLoading } = useMonthlyReportQuery({
		month,
		year,
	});

	useEffect(() => {
		if (!authLoading && !user) {
			navigate('/auth/login?next=/work-logs', { replace: true });
		}
	}, [user, authLoading, navigate]);

	if (!authLoading && !user) return null;

	function handleSearch(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSearch(keyword);
	}

	const logsErrorMsg =
		logsError instanceof ApiException ? logsError.message : logsError?.message;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Chấm công</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Danh sách bản ghi check-in / check-out của bạn.
					</p>
				</div>
				<Button asChild>
					<Link to="/work-logs/new">+ Thêm bản ghi</Link>
				</Button>
			</div>

			{/* Báo cáo tháng */}
			<div className="flex items-end gap-3 flex-wrap">
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Tháng
					</label>
					<Input
						type="number"
						min={1}
						max={12}
						value={month}
						onChange={(e) => setMonth(Number(e.target.value))}
						className="w-20"
					/>
				</div>
				<div className="space-y-1">
					<label className="text-xs text-muted-foreground font-medium">
						Năm
					</label>
					<Input
						type="number"
						min={2020}
						value={year}
						onChange={(e) => setYear(Number(e.target.value))}
						className="w-28"
					/>
				</div>
			</div>

			{reportLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : report ? (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<Card>
						<CardHeader className="pb-1 pt-4 px-4">
							<CardTitle className="text-xs text-muted-foreground font-medium">
								Ngày công chuẩn
							</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-2xl font-bold">{report.standardWorkDays}</p>
							<p className="text-xs text-muted-foreground">
								{report.totalStandardHours.toFixed(1)} giờ
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-1 pt-4 px-4">
							<CardTitle className="text-xs text-muted-foreground font-medium">
								Đã chấm công
							</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-2xl font-bold">{report.loggedDays}</p>
							<p className="text-xs text-muted-foreground">
								{report.totalHours.toFixed(1)} giờ
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-1 pt-4 px-4">
							<CardTitle className="text-xs text-muted-foreground font-medium">
								Làm thêm
							</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-2xl font-bold text-green-600">
								{report.overtimeHours.toFixed(1)}
							</p>
							<p className="text-xs text-muted-foreground">giờ</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-1 pt-4 px-4">
							<CardTitle className="text-xs text-muted-foreground font-medium">
								Tỷ lệ chuyên cần
							</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4">
							<p className="text-2xl font-bold">
								{report.attendanceRate.toFixed(1)}%
							</p>
							<p className="text-xs text-muted-foreground">
								Thiếu {report.missingHours.toFixed(1)} giờ
							</p>
						</CardContent>
					</Card>
				</div>
			) : null}

			{/* Danh sách */}
			<div className="space-y-3">
				<form onSubmit={handleSearch} className="flex gap-2 max-w-md">
					<Input
						placeholder="Tìm theo ghi chú..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
					/>
					<Button type="submit" variant="outline">
						Tìm
					</Button>
				</form>

				{logsErrorMsg && (
					<Alert variant="destructive">
						<AlertDescription>{logsErrorMsg}</AlertDescription>
					</Alert>
				)}

				{logsLoading ? (
					<div className="space-y-2">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
						))}
					</div>
				) : logs && logs.data.length > 0 ? (
					<div className="space-y-2">
						{logs.data.map((log) => (
							<WorkLogRow key={log._id} log={log} />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
						<p>Chưa có bản ghi chấm công nào.</p>
						<Button asChild variant="outline">
							<Link to="/work-logs/new">Thêm bản ghi đầu tiên</Link>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
