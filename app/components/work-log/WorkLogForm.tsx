import { useEffect, useState } from 'react';
import { ApiException } from '~/apis/http';
import { useAuth } from '~/contexts/auth-context';
import { useUserRef } from '~/contexts/user-ref-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import {
	useCreateWorkLogMutation,
	useUpdateWorkLogMutation,
} from '~/hooks/use-work-log-mutations';
import { toDateString, toISO, toTimeString } from '~/lib/date';
import { firstCheckIn } from '~/lib/work-log';
import type { WorkLog } from '~/types';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import AddMinutes from './AddMinutes';

interface WorkLogFormProps {
	log: WorkLog | null;
	onSuccess: () => void;
}

/** Một phiên trong form: giờ vào/ra dạng "HH:mm" ("" = trống) */
interface SessionInput {
	checkIn: string;
	checkOut: string;
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
	// Create: 1 phiên. Edit: nhiều phiên từ log.items.
	const [sessions, setSessions] = useState<SessionInput[]>([
		{ checkIn: '08:00', checkOut: '17:30' },
	]);
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

	const { userRef, updateLastOrg } = useUserRef();

	const selectedOrg = orgs.find((o) => o._id === selectedOrgId);

	function setSession(idx: number, patch: Partial<SessionInput>) {
		setSessions((prev) =>
			prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
		);
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setUpdateError(null);
		setUpdateSuccess(false);
		const data = new FormData(e.currentTarget);
		const date = data.get('date') as string;
		const note = (data.get('note') as string) || undefined;

		const onResult = {
			onSuccess: () => {
				if (!log && selectedOrgId) updateLastOrg(selectedOrgId);
				setUpdateSuccess(true);
				onSuccess();
			},
			onError: (err: unknown) => {
				setUpdateError(
					err instanceof ApiException ? err.message : 'Đã có lỗi xảy ra.',
				);
			},
		};

		if (log) {
			// Edit: gửi items[] (phiên không có giờ vào bị bỏ qua)
			const items = sessions
				.filter((s) => s.checkIn)
				.map((s) => ({
					checkIn: toISO(date, s.checkIn),
					checkOut: s.checkOut ? toISO(date, s.checkOut) : undefined,
				}));
			(mutation as ReturnType<typeof useUpdateWorkLogMutation>).mutate(
				{ items, note, skipLunchBreak: skipLunchBreak ?? false },
				onResult,
			);
		} else {
			// Create: BE nhận 1 cặp phẳng rồi tự bọc vào items
			const s = sessions[0];
			(mutation as ReturnType<typeof useCreateWorkLogMutation>).mutate(
				{
					checkIn: toISO(date, s.checkIn),
					checkOut: s.checkOut ? toISO(date, s.checkOut) : undefined,
					note,
					skipLunchBreak: skipLunchBreak ?? false,
					organizationId: selectedOrgId,
				},
				onResult,
			);
		}
	}

	function handleOrgChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const orgId = e.target.value;
		setSelectedOrgId(orgId);
		const org = orgs.find((o) => o._id === orgId);
		if (org) {
			setSessions([
				{
					checkIn: org.workSchedule.workStartTime,
					checkOut: org.workSchedule.workEndTime,
				},
			]);
		}
	}

	// Ưu tiên cơ quan gần nhất từ UserRef khi tạo mới, fallback về cơ quan đầu tiên
	useEffect(() => {
		if (log || orgs.length === 0 || selectedOrgId) return;
		const lastOrgId = userRef?.lastWorkLogOrganization?._id;
		const preferred =
			(lastOrgId && orgs.find((o) => o._id === lastOrgId)) || orgs[0];
		setSelectedOrgId(preferred._id);
		setSessions([
			{
				checkIn: preferred.workSchedule.workStartTime,
				checkOut: preferred.workSchedule.workEndTime,
			},
		]);
	}, [orgs, userRef, log, selectedOrgId]);

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
			setSessions(
				log.items.length
					? log.items.map((i) => ({
							checkIn: toTimeString(i.checkIn),
							checkOut: toTimeString(i.checkOut),
						}))
					: [{ checkIn: '08:00', checkOut: '17:30' }],
			);
			setDateStr(toDateString(firstCheckIn(log) ?? log.date));
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
					disabled={!!log}
					value={selectedOrgId}
					onChange={handleOrgChange}
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60">
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

			{/* Phiên vào/ra */}
			<div className="space-y-3">
				{sessions.map((s, idx) => (
					<div key={idx} className="space-y-1.5">
						{sessions.length > 1 && (
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium text-muted-foreground">
									Phiên {idx + 1}
								</span>
								<button
									type="button"
									onClick={() =>
										setSessions((prev) => prev.filter((_, i) => i !== idx))
									}
									className="text-xs text-destructive hover:underline">
									Xoá
								</button>
							</div>
						)}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label>Giờ vào</Label>
								<Input
									type="time"
									value={s.checkIn}
									onChange={(e) => setSession(idx, { checkIn: e.target.value })}
									required
									clearable
								/>
								<AddMinutes
									value={s.checkIn}
									options={[1, 5, 15, 30]}
									onChange={(v) => setSession(idx, { checkIn: v })}
									base={selectedOrg?.workSchedule.workStartTime}
									resetTo={idx > 0 ? sessions[idx - 1].checkOut : undefined}
									showReset
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Giờ ra</Label>
								<Input
									type="time"
									value={s.checkOut}
									onChange={(e) =>
										setSession(idx, { checkOut: e.target.value })
									}
									clearable
								/>
								<AddMinutes
									value={s.checkOut}
									options={[1, 5, 15, 30]}
									onChange={(v) => setSession(idx, { checkOut: v })}
									base={selectedOrg?.workSchedule.workEndTime}
									resetTo={idx > 0 ? sessions[idx - 1].checkOut : undefined}
									showReset
								/>
							</div>
						</div>
					</div>
				))}

				{/* Thêm phiên: chỉ ở chế độ edit (create chỉ 1 phiên, BE tự bọc) */}
				{log && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() =>
							setSessions((prev) => [
								...prev,
								// default giờ vào = giờ ra phiên trước (phiên bù/OT nối tiếp)
								{
									checkIn: prev[prev.length - 1]?.checkOut ?? '',
									checkOut: '',
								},
							])
						}>
						+ Thêm phiên
					</Button>
				)}
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
