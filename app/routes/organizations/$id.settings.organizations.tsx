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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/contexts/auth-context';
import {
	useUpdateOrganizationMutation,
	useUpdateWorkScheduleMutation,
} from '~/hooks/use-organization-mutations';
import { useOrganizationDetailQuery } from '~/hooks/use-organization-queries';

export function meta() {
	return [
		{ title: 'Cài đặt tổ chức — Log Work' },
		{ name: 'description', content: 'Cấu hình lịch làm việc của tổ chức' },
	];
}

export default function OrganizationSettingsPage() {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();
	const navigate = useNavigate();

	const { data: org, isLoading, error } = useOrganizationDetailQuery(id ?? '');
	const updateInfoMutation = useUpdateOrganizationMutation(id ?? '');
	const updateScheduleMutation = useUpdateWorkScheduleMutation(id ?? '');

	const [infoError, setInfoError] = useState<string | null>(null);
	const [infoSuccess, setInfoSuccess] = useState(false);
	const [scheduleError, setScheduleError] = useState<string | null>(null);
	const [scheduleSuccess, setScheduleSuccess] = useState(false);

	if (isLoading) {
		return (
			<div className="max-w-lg mx-auto space-y-4">
				<div className="h-8 w-48 rounded bg-muted animate-pulse" />
				<div className="h-40 rounded-lg bg-muted animate-pulse" />
			</div>
		);
	}

	if (error || !org) {
		const msg =
			error instanceof ApiException ? error.message : 'Không tìm thấy tổ chức.';
		return (
			<Alert variant="destructive" className="max-w-lg mx-auto">
				<AlertDescription>{msg}</AlertDescription>
			</Alert>
		);
	}

	const isOwner =
		typeof org.owner === 'object'
			? org.owner._id === user?._id
			: org.owner === user?._id;

	if (!isOwner) {
		navigate(`/organizations/${id}`, { replace: true });
		return null;
	}

	function handleUpdateInfo(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setInfoError(null);
		setInfoSuccess(false);
		const data = new FormData(e.currentTarget);
		updateInfoMutation.mutate(
			{
				name: data.get('name') as string,
				description: (data.get('description') as string) || undefined,
			},
			{
				onSuccess: () => setInfoSuccess(true),
				onError: (err) => {
					setInfoError(
						err instanceof ApiException ? err.message : 'Đã có lỗi xảy ra.',
					);
				},
			},
		);
	}

	function handleUpdateSchedule(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setScheduleError(null);
		setScheduleSuccess(false);
		const data = new FormData(e.currentTarget);
		updateScheduleMutation.mutate(
			{
				workSchedule: {
					workStartTime: data.get('workStartTime') as string,
					workEndTime: data.get('workEndTime') as string,
					lunchBreakMinutes: Number(data.get('lunchBreakMinutes')),
				},
			},
			{
				onSuccess: () => setScheduleSuccess(true),
				onError: (err) => {
					setScheduleError(
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
					to="/organizations"
					className="hover:text-foreground transition-colors">
					Tổ chức
				</Link>
				<span>/</span>
				<Link
					to={`/organizations/${id}`}
					className="hover:text-foreground transition-colors line-clamp-1 max-w-[160px]">
					{org.name}
				</Link>
				<span>/</span>
				<span className="text-foreground">Cài đặt</span>
			</nav>

			{/* Thông tin chung */}
			<Card>
				<CardHeader>
					<CardTitle>Thông tin tổ chức</CardTitle>
					<CardDescription>Cập nhật tên và mô tả tổ chức.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleUpdateInfo} className="space-y-4">
						{infoError && (
							<Alert variant="destructive">
								<AlertDescription>{infoError}</AlertDescription>
							</Alert>
						)}
						{infoSuccess && (
							<Alert>
								<AlertDescription>
									Cập nhật thông tin thành công.
								</AlertDescription>
							</Alert>
						)}
						<div className="space-y-1.5">
							<Label htmlFor="name">Tên tổ chức *</Label>
							<Input id="name" name="name" defaultValue={org.name} required />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="description">Mô tả</Label>
							<Input
								id="description"
								name="description"
								defaultValue={org.description ?? ''}
							/>
						</div>
						<Button type="submit" disabled={updateInfoMutation.isPending}>
							{updateInfoMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Lịch làm việc */}
			<Card>
				<CardHeader>
					<CardTitle>Lịch làm việc</CardTitle>
					<CardDescription>
						Cấu hình giờ làm việc và thời gian nghỉ trưa. Backend sẽ tự tính lại
						số giờ chuẩn mỗi ngày.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleUpdateSchedule} className="space-y-4">
						{scheduleError && (
							<Alert variant="destructive">
								<AlertDescription>{scheduleError}</AlertDescription>
							</Alert>
						)}
						{scheduleSuccess && (
							<Alert>
								<AlertDescription>
									Cập nhật lịch làm việc thành công.
								</AlertDescription>
							</Alert>
						)}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="workStartTime">Giờ bắt đầu *</Label>
								<Input
									id="workStartTime"
									name="workStartTime"
									type="time"
									defaultValue={org.workSchedule.workStartTime}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="workEndTime">Giờ kết thúc *</Label>
								<Input
									id="workEndTime"
									name="workEndTime"
									type="time"
									defaultValue={org.workSchedule.workEndTime}
									required
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="lunchBreakMinutes">Nghỉ trưa (phút) *</Label>
							<Input
								id="lunchBreakMinutes"
								name="lunchBreakMinutes"
								type="number"
								min={0}
								max={240}
								defaultValue={org.workSchedule.lunchBreakMinutes}
								required
							/>
						</div>
						<Button type="submit" disabled={updateScheduleMutation.isPending}>
							{updateScheduleMutation.isPending
								? 'Đang lưu...'
								: 'Lưu lịch làm'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
