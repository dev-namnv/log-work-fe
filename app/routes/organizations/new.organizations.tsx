import { useState } from 'react';
import { Link } from 'react-router';
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
import { useCreateOrganizationMutation } from '~/hooks/use-organization-mutations';

export function meta() {
	return [
		{ title: 'Tạo tổ chức — Log Work' },
		{ name: 'description', content: 'Tạo một tổ chức mới' },
	];
}

export default function NewOrganizationPage() {
	const { user, loading: authLoading } = useAuth();
	const mutation = useCreateOrganizationMutation();
	const [error, setError] = useState<string | null>(null);

	if (!authLoading && !user) return null;

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		const data = new FormData(e.currentTarget);
		mutation.mutate(
			{
				name: data.get('name') as string,
				description: (data.get('description') as string) || undefined,
				workSchedule: {
					workStartTime: data.get('workStartTime') as string,
					workEndTime: data.get('workEndTime') as string,
					lunchBreakMinutes: Number(data.get('lunchBreakMinutes')),
				},
			},
			{
				onError: (err) => {
					setError(
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
				<span className="text-foreground">Tạo mới</span>
			</nav>

			<Card>
				<CardHeader>
					<CardTitle>Tạo tổ chức mới</CardTitle>
					<CardDescription>
						Nhập thông tin tổ chức và lịch làm việc mặc định.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Tên tổ chức */}
						<div className="space-y-1.5">
							<Label htmlFor="name">Tên tổ chức *</Label>
							<Input
								id="name"
								name="name"
								placeholder="Ví dụ: Công ty TNHH ABC"
								required
							/>
						</div>

						{/* Mô tả */}
						<div className="space-y-1.5">
							<Label htmlFor="description">Mô tả</Label>
							<Input
								id="description"
								name="description"
								placeholder="Mô tả ngắn (tùy chọn)"
							/>
						</div>

						{/* Giờ làm việc */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="workStartTime">Giờ bắt đầu *</Label>
								<Input
									id="workStartTime"
									name="workStartTime"
									type="time"
									defaultValue="08:00"
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="workEndTime">Giờ kết thúc *</Label>
								<Input
									id="workEndTime"
									name="workEndTime"
									type="time"
									defaultValue="17:30"
									required
								/>
							</div>
						</div>

						{/* Nghỉ trưa */}
						<div className="space-y-1.5">
							<Label htmlFor="lunchBreakMinutes">
								Thời gian nghỉ trưa (phút) *
							</Label>
							<Input
								id="lunchBreakMinutes"
								name="lunchBreakMinutes"
								type="number"
								min={0}
								max={240}
								defaultValue={60}
								required
							/>
						</div>

						<div className="flex gap-3 pt-2">
							<Button
								type="submit"
								className="flex-1"
								disabled={mutation.isPending}>
								{mutation.isPending ? 'Đang tạo...' : 'Tạo tổ chức'}
							</Button>
							<Button type="button" variant="outline" asChild>
								<Link to="/organizations">Hủy</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
