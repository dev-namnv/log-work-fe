import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card';
import WorkLogForm from '~/components/work-log/WorkLogForm';
import { useDeleteWorkLogMutation } from '~/hooks/use-work-log-mutations';
import { useWorkLogDetailQuery } from '~/hooks/use-work-log-queries';
import type { Organization } from '~/types';

export function meta() {
	return [
		{ title: 'Chi tiết chấm công — Log Work' },
		{ name: 'description', content: 'Xem và chỉnh sửa bản ghi chấm công' },
	];
}

/** ISO datetime → "HH:mm" theo giờ Việt Nam */
function toTimeString(iso: string | null): string {
	if (!iso) return '';
	return new Date(iso).toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

/** ISO datetime → "YYYY-MM-DD" theo giờ Việt Nam */
function toDateString(iso: string): string {
	return new Date(iso).toLocaleDateString('en-CA', {
		timeZone: 'Asia/Ho_Chi_Minh',
	});
}

function toISO(date: string, time: string): string {
	return new Date(`${date}T${time}:00+07:00`).toISOString();
}

function formatDateVN(iso: string) {
	return new Date(iso).toLocaleDateString('vi-VN', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

export default function WorkLogDetailPage() {
	const { id } = useParams<{ id: string }>();

	const { data: log, isLoading, error } = useWorkLogDetailQuery(id ?? '');
	const deleteMutation = useDeleteWorkLogMutation();

	const [deleteConfirm, setDeleteConfirm] = useState(false);

	const navigate = useNavigate();

	const onStateUpdated = () => {
		setTimeout(() => {
			navigate('/work-logs');
		}, 1500);
	};

	if (isLoading) {
		return (
			<div className="max-w-lg mx-auto space-y-4">
				<div className="h-8 w-48 rounded bg-muted animate-pulse" />
				<div className="h-64 rounded-lg bg-muted animate-pulse" />
			</div>
		);
	}

	if (error || !log) {
		const msg =
			error instanceof ApiException
				? error.message
				: 'Không tìm thấy bản ghi chấm công.';
		return (
			<Alert variant="destructive" className="max-w-lg mx-auto">
				<AlertDescription>{msg}</AlertDescription>
			</Alert>
		);
	}

	const orgName =
		typeof log.organization === 'object'
			? (log.organization as Organization).name
			: log.organization;

	return (
		<div className="max-w-lg mx-auto space-y-6">
			{/* Breadcrumb */}
			<nav className="text-sm text-muted-foreground flex items-center gap-1">
				<Link
					to="/work-logs"
					className="hover:text-foreground transition-colors">
					Chấm công
				</Link>
				<span>/</span>
				<span className="text-foreground">{formatDateVN(log.date)}</span>
			</nav>

			{/* Detail + Edit */}
			<Card>
				<CardHeader>
					<CardTitle>Chi tiết bản ghi</CardTitle>
					<CardDescription>
						Tổ chức:{' '}
						<span className="font-medium text-foreground">{orgName}</span>
						{' · '}
						{log.hours.toFixed(2)} giờ
					</CardDescription>
				</CardHeader>
				<CardContent>
					<WorkLogForm log={log} onSuccess={onStateUpdated} />
				</CardContent>
			</Card>

			{/* Delete */}
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="text-base text-destructive">
						Xóa bản ghi
					</CardTitle>
				</CardHeader>
				<CardContent>
					{!deleteConfirm ? (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setDeleteConfirm(true)}>
							Xóa bản ghi này
						</Button>
					) : (
						<div className="space-y-2">
							<p className="text-sm text-destructive">
								Bạn chắc chắn muốn xóa bản ghi này? Hành động không thể hoàn
								tác.
							</p>
							<div className="flex gap-2">
								<Button
									variant="destructive"
									size="sm"
									disabled={deleteMutation.isPending}
									onClick={() =>
										deleteMutation.mutate(id ?? '', {
											onSuccess: onStateUpdated,
										})
									}>
									{deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setDeleteConfirm(false)}>
									Hủy
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
