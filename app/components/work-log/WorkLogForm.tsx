import { useEffect, useState } from 'react';
import { ApiException } from '~/apis/http';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import {
    useCreateWorkLogMutation,
    useUpdateWorkLogMutation,
} from '~/hooks/use-work-log-mutations';
import { toDateString, toISO, toTimeString } from '~/lib/date';
import type { WorkLog } from '~/types';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface WorkLogFormProps {
	log: WorkLog | null;
	onSuccess: () => void;
}

export default function WorkLogForm({ log, onSuccess }: WorkLogFormProps) {
	const { loading, user } = useAuth();
	const authReady = !loading && !!user;
	const [updateError, setUpdateError] = useState<string | null>(null);
	const [updateSuccess, setUpdateSuccess] = useState(false);
	const [skipLunchBreak, setSkipLunchBreak] = useState<boolean | undefined>(
		log ? log.skipLunchBreak : undefined,
	);
	const [selectedOrgId, setSelectedOrgId] = useState('');
	const [checkInTime, setCheckInTime] = useState('08:00');
	const [checkOutTime, setCheckOutTime] = useState('17:30');
	const [dateStr, setDateStr] = useState(
		toDateString(new Date().toISOString()),
	);

	const mutation = log
		? useUpdateWorkLogMutation(log._id)
		: useCreateWorkLogMutation();

	const { data: orgsResponse } = useOrganizationsQuery(
		{ limit: 100 },
		{ enabled: authReady },
	);
	const orgs = orgsResponse?.data || [];

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setUpdateError(null);
		setUpdateSuccess(false);
		const data = new FormData(e.currentTarget);
		const date = data.get('date') as string;
		const checkInTime = data.get('checkInTime') as string;
		const checkOutTime = data.get('checkOutTime') as string;

		mutation.mutate(
			{
				checkIn: toISO(date, checkInTime),
				checkOut: checkOutTime ? toISO(date, checkOutTime) : undefined,
				note: (data.get('note') as string) || undefined,
				skipLunchBreak: skipLunchBreak ?? false,
				organizationId: (log ? undefined : selectedOrgId) as string,
			},
			{
				onSuccess: () => {
					setUpdateSuccess(true);
					onSuccess();
				},
				onError: (err) => {
					setUpdateError(
						err instanceof ApiException ? err.message : 'Đã có lỗi xảy ra.',
					);
				},
			},
		);
	}

	function handleOrgChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const orgId = e.target.value;
		setSelectedOrgId(orgId);
		const org = orgs.find((o) => o._id === orgId);
		if (org) {
			setCheckInTime(org.workSchedule.workStartTime);
			setCheckOutTime(org.workSchedule.workEndTime);
		}
	}

	// Khi danh sách tổ chức load xong, tự chọn cơ quan đầu tiên
	useEffect(() => {
		if (orgs && orgs.length > 0 && !selectedOrgId) {
			const first = orgs[0];
			setSelectedOrgId(first._id);
			setCheckInTime(first.workSchedule.workStartTime);
			if (first.workSchedule.workEndTime) {
				setCheckOutTime(first.workSchedule.workEndTime);
			}
		}
	}, [orgs]);

	// Reset success message vào lần kế tiếp
	useEffect(() => {
		if (updateSuccess) {
			const t = setTimeout(() => setUpdateSuccess(false), 3000);
			return () => clearTimeout(t);
		}
	}, [updateSuccess]);

	// Sync log data to form state when log exists (edit mode)
	useEffect(() => {
		if (log) {
			setSelectedOrgId(
				typeof log.organization === 'string'
					? log.organization
					: log.organization._id,
			);
			setCheckInTime(toTimeString(log.checkIn));
			setCheckOutTime(toTimeString(log.checkOut));
			setDateStr(toDateString(log.checkIn));
			setSkipLunchBreak(log.skipLunchBreak);
		}
	}, [log]);
	return (
		<form onSubmit={handleSubmit} className="space-y-4">
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
					{orgs.map((org) => (
						<option key={org._id} value={org._id}>
							{org.name}
						</option>
					))}
				</select>
			</div>

			{/* Ngày */}
			<div className="space-y-1.5">
				<Label htmlFor="date">Ngày</Label>
				<Input
					id="date"
					name="date"
					type="date"
					value={dateStr}
					onChange={(e) => setDateStr(e.target.value)}
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
						value={checkInTime}
						onChange={(e) => setCheckInTime(e.target.value)}
						required
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="checkOutTime">Giờ ra</Label>
					<Input
						id="checkOutTime"
						name="checkOutTime"
						type="time"
						required={false}
						value={checkOutTime}
						onChange={(e) => setCheckOutTime(e.target.value)}
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
					defaultValue={log ? log.note : ''}
					placeholder="Ghi chú tùy chọn..."
					className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
				/>
			</div>

			<Button type="submit" disabled={mutation.isPending}>
				{mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
			</Button>
		</form>
	);
}
