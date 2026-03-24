import { useEffect, useState } from 'react';
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
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import { useCreateWorkLogMutation } from '~/hooks/use-work-log-mutations';

export function meta() {
	return [
		{ title: 'Thêm chấm công — Log Work' },
		{ name: 'description', content: 'Thêm bản ghi chấm công mới' },
	];
}

/**
 * Chuyển "YYYY-MM-DD" + "HH:mm" → ISO 8601 string với múi giờ UTC+7 tường minh.
 */
function toISO(date: string, time: string): string {
	return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export default function NewWorkLogPage() {
	const { user, loading: authLoading } = useAuth();
	const mutation = useCreateWorkLogMutation();
	const { data: orgs } = useOrganizationsQuery({ limit: 100 });
	const [error, setError] = useState<string | null>(null);
	const [selectedOrgId, setSelectedOrgId] = useState('');
	const [checkInTime, setCheckInTime] = useState('08:00');
	const [checkOutTime, setCheckOutTime] = useState('17:30');
	const [skipLunchBreak, setSkipLunchBreak] = useState(false);

	// Ngày mặc định là hôm nay theo giờ Việt Nam
	const today = new Date().toLocaleDateString('en-CA', {
		timeZone: 'Asia/Ho_Chi_Minh',
	});

	// Khi danh sách tổ chức load xong, tự chọn cơ quan đầu tiên
	useEffect(() => {
		if (orgs?.data && orgs.data.length > 0 && !selectedOrgId) {
			const first = orgs.data[0];
			setSelectedOrgId(first._id);
			setCheckInTime(first.workSchedule.workStartTime);
			setCheckOutTime(first.workSchedule.workEndTime);
		}
	}, [orgs]);

	if (!authLoading && !user) return null;

	function handleOrgChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const orgId = e.target.value;
		setSelectedOrgId(orgId);
		const org = orgs?.data.find((o) => o._id === orgId);
		if (org) {
			setCheckInTime(org.workSchedule.workStartTime);
			setCheckOutTime(org.workSchedule.workEndTime);
		}
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		const data = new FormData(e.currentTarget);
		const date = data.get('date') as string;

		mutation.mutate(
			{
				organizationId: selectedOrgId,
				checkIn: toISO(date, checkInTime),
				checkOut: toISO(date, checkOutTime),
				note: (data.get('note') as string) || undefined,
				skipLunchBreak,
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
					to="/work-logs"
					className="hover:text-foreground transition-colors">
					Chấm công
				</Link>
				<span>/</span>
				<span className="text-foreground">Thêm mới</span>
			</nav>

			<Card>
				<CardHeader>
					<CardTitle>Thêm bản ghi chấm công</CardTitle>
					<CardDescription>
						Ghi nhận giờ check-in và check-out. Mỗi ngày chỉ tạo được 1 bản ghi
						cho mỗi tổ chức.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Tổ chức */}
						<div className="space-y-1.5">
							<Label htmlFor="organizationId">Tổ chức *</Label>
							<select
								id="organizationId"
								name="organizationId"
								title="Chọn tổ chức"
								required
								value={selectedOrgId}
								onChange={handleOrgChange}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
								<option value="">-- Chọn tổ chức --</option>
								{orgs?.data.map((org) => (
									<option key={org._id} value={org._id}>
										{org.name}
									</option>
								))}
							</select>
						</div>

						{/* Ngày */}
						<div className="space-y-1.5">
							<Label htmlFor="date">Ngày *</Label>
							<Input
								id="date"
								name="date"
								type="date"
								defaultValue={today}
								required
							/>
						</div>

						{/* Giờ */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="checkInTime">Giờ vào *</Label>
								<Input
									id="checkInTime"
									name="checkInTime"
									type="time"
									value={checkInTime}
									onChange={(e) => setCheckInTime(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="checkOutTime">Giờ ra *</Label>
								<Input
									id="checkOutTime"
									name="checkOutTime"
									type="time"
									value={checkOutTime}
									onChange={(e) => setCheckOutTime(e.target.value)}
									required
								/>
							</div>
						</div>

						{/* Bỏ qua nghỉ trưa */}
						<label className="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								checked={skipLunchBreak}
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
								placeholder="Ghi chú tùy chọn..."
								className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
							/>
						</div>

						<div className="flex gap-3 pt-2">
							<Button
								type="submit"
								className="flex-1"
								disabled={mutation.isPending}>
								{mutation.isPending ? 'Đang lưu...' : 'Lưu bản ghi'}
							</Button>
							<Button type="button" variant="outline" asChild>
								<Link to="/work-logs">Hủy</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
