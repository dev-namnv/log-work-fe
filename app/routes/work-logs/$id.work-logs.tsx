import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/contexts/auth-context';
import {
	useDeleteWorkLogMutation,
	useUpdateWorkLogMutation,
} from '~/hooks/use-work-log-mutations';
import { useWorkLogDetailQuery } from '~/hooks/use-work-log-queries';
import type { Organization } from '~/types/api';

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
	const { user } = useAuth();

	const { data: log, isLoading, error } = useWorkLogDetailQuery(id ?? '');
	const updateMutation = useUpdateWorkLogMutation(id ?? '');
	const deleteMutation = useDeleteWorkLogMutation();

	const [updateError, setUpdateError] = useState<string | null>(null);
	const [updateSuccess, setUpdateSuccess] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState(false);
	const [skipLunchBreak, setSkipLunchBreak] = useState<boolean | undefined>(
		undefined,
	);

	// Đồng bộ giá trị sau khi log được load
	useEffect(() => {
		if (log && skipLunchBreak === undefined) {
			setSkipLunchBreak(log.skipLunchBreak ?? false);
		}
	}, [log, skipLunchBreak]);

	// Reset success message vào lần kế tiếp
	useEffect(() => {
		if (updateSuccess) {
			const t = setTimeout(() => setUpdateSuccess(false), 3000);
			return () => clearTimeout(t);
		}
	}, [updateSuccess]);

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

	const dateStr = toDateString(log.date);

	function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setUpdateError(null);
		setUpdateSuccess(false);
		const data = new FormData(e.currentTarget);
		const date = data.get('date') as string;
		const checkInTime = data.get('checkInTime') as string;
		const checkOutTime = data.get('checkOutTime') as string;

		updateMutation.mutate(
			{
				checkIn: toISO(date, checkInTime),
				checkOut: toISO(date, checkOutTime),
				note: (data.get('note') as string) || undefined,
				skipLunchBreak: skipLunchBreak ?? false,
			},
			{
				onSuccess: () => setUpdateSuccess(true),
				onError: (err) => {
					setUpdateError(
						err instanceof ApiException ? err.message : 'Đã có lỗi xảy ra.',
					);
				},
			},
		);
	}

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
					<form onSubmit={handleUpdate} className="space-y-4">
						{updateError && (
							<Alert variant="destructive">
								<AlertDescription>{updateError}</AlertDescription>
							</Alert>
						)}
						{updateSuccess && (
							<Alert>
								<AlertDescription>Cập nhật thành công.</AlertDescription>
							</Alert>
						)}

						{/* Ngày */}
						<div className="space-y-1.5">
							<Label htmlFor="date">Ngày</Label>
							<Input
								id="date"
								name="date"
								type="date"
								defaultValue={dateStr}
								required
							/>
						</div>

						{/* Giờ */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="checkInTime">Giờ vào</Label>
								<Input
									id="checkInTime"
									name="checkInTime"
									type="time"
									defaultValue={toTimeString(log.checkIn)}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="checkOutTime">Giờ ra</Label>
								<Input
									id="checkOutTime"
									name="checkOutTime"
									type="time"
									defaultValue={toTimeString(log.checkOut)}
									required
								/>
							</div>
						</div>
						{/* Bỏ qua nghỉ trưa */}
						<label className="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								checked={skipLunchBreak ?? false}
								onChange={(e) => setSkipLunchBreak(e.target.checked)}
								className="h-4 w-4 shrink-0 rounded border-input accent-primary cursor-pointer"
							/>
							<span className="space-y-0.5 align-start flex flex-col">
								<span className="text-sm font-medium leading-none group-hover:text-foreground">
									Bỏ qua nghỉ trưa
								</span>
								<span className="block text-xs text-muted-foreground">
									Không trừ thời gian nghỉ trưa (làm xuyên trưa hoặc chỉ 1 buổi)
								</span>
							</span>
						</label>
						{/* Ghi chú */}
						<div className="space-y-1.5">
							<Label htmlFor="note">Ghi chú</Label>
							<textarea
								id="note"
								name="note"
								rows={3}
								defaultValue={log.note ?? ''}
								placeholder="Ghi chú tùy chọn..."
								className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
							/>
						</div>

						<Button type="submit" disabled={updateMutation.isPending}>
							{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
						</Button>
					</form>
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
									onClick={() => deleteMutation.mutate(id ?? '')}>
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
