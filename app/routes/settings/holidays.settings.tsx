import { useState } from 'react';
import { toast } from 'sonner';
import {
	fetchVnHolidays,
	type HolidaySuggestion,
} from '~/apis/holiday-suggest';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover';
import { useAuth } from '~/contexts/auth-context';
import {
	useCreateHolidayMutation,
	useDeleteHolidayMutation,
	useUpdateHolidayMutation,
} from '~/hooks/use-holiday-mutations';
import { useHolidaysQuery } from '~/hooks/use-holiday-queries';
import { isoToDateShort } from '~/lib/date';
import { cn } from '~/lib/utils';
import { HolidayType, type Holiday } from '~/types';

export function meta() {
	return [
		{ title: 'Ngày lễ — Log Work' },
		{ name: 'description', content: 'Quản lý ngày lễ và ngày làm bù' },
	];
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

type Mode = 'year' | 'month';

function DayCell({
	date,
	day,
	dow,
	holiday,
}: {
	date: string;
	day: number;
	dow: number; // 0=T2 … 5=T7, 6=CN
	holiday?: Holiday;
}) {
	const create = useCreateHolidayMutation();
	const update = useUpdateHolidayMutation();
	const remove = useDeleteHolidayMutation();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('');
	const [type, setType] = useState<HolidayType>(HolidayType.Off);
	const isWeekend = dow >= 5;

	function onOpenChange(o: boolean) {
		if (o) {
			setName(holiday?.name ?? '');
			setType(
				holiday?.type ?? (isWeekend ? HolidayType.Workday : HolidayType.Off),
			);
		}
		setOpen(o);
	}

	const busy = create.isPending || update.isPending || remove.isPending;

	function save() {
		const dto = {
			date,
			name:
				name.trim() || (type === HolidayType.Workday ? 'Làm bù' : 'Nghỉ lễ'),
			type,
		};
		const done = { onSuccess: () => setOpen(false) };
		if (holiday) update.mutate({ id: holiday._id, dto }, done);
		else create.mutate(dto, done);
	}

	function del() {
		if (holiday)
			remove.mutate(holiday._id, { onSuccess: () => setOpen(false) });
		else setOpen(false);
	}

	const tone =
		holiday?.type === HolidayType.Off
			? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
			: holiday?.type === HolidayType.Workday
				? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
				: isWeekend
					? 'bg-muted text-muted-foreground'
					: 'hover:bg-accent';

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					title={holiday?.name}
					className={cn(
						'aspect-square rounded text-sm transition-colors',
						tone,
					)}>
					{day}
				</button>
			</PopoverTrigger>
			<PopoverContent align="center" className="w-64 space-y-3">
				<div className="text-sm font-medium">{date}</div>
				<div className="space-y-1.5">
					<Label htmlFor={`h-${date}`}>Tên</Label>
					<Input
						id={`h-${date}`}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nghỉ lễ / Làm bù"
					/>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						size="sm"
						variant={type === HolidayType.Off ? 'default' : 'outline'}
						className="flex-1"
						onClick={() => setType(HolidayType.Off)}>
						Nghỉ
					</Button>
					<Button
						type="button"
						size="sm"
						variant={type === HolidayType.Workday ? 'default' : 'outline'}
						className="flex-1"
						onClick={() => setType(HolidayType.Workday)}>
						Làm bù
					</Button>
				</div>
				<div className="flex gap-2 pt-1">
					<Button
						type="button"
						size="sm"
						className="flex-1"
						onClick={save}
						disabled={busy}>
						{holiday ? 'Lưu' : 'Thêm'}
					</Button>
					{holiday && (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={del}
							disabled={busy}>
							Xoá
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

function MonthGrid({
	year,
	month,
	byDate,
}: {
	year: number;
	month: number;
	byDate: Map<string, Holiday>;
}) {
	const days = new Date(year, month, 0).getDate();
	const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7; // T2-first
	const cells: (number | null)[] = [
		...Array(firstDow).fill(null),
		...Array.from({ length: days }, (_, i) => i + 1),
	];
	return (
		<div className="rounded-lg border p-3">
			<div className="mb-2 text-sm font-medium">Tháng {month}</div>
			<div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
				{WEEKDAYS.map((w) => (
					<div key={w} className="py-1">
						{w}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-1">
				{cells.map((d, i) =>
					d == null ? (
						<div key={i} />
					) : (
						<DayCell
							key={i}
							date={iso(year, month, d)}
							day={d}
							dow={(firstDow + d - 1) % 7}
							holiday={byDate.get(iso(year, month, d))}
						/>
					),
				)}
			</div>
		</div>
	);
}

function SuggestPanel({
	year,
	byDate,
}: {
	year: number;
	byDate: Map<string, Holiday>;
}) {
	const create = useCreateHolidayMutation();
	const [items, setItems] = useState<HolidaySuggestion[] | null>(null);
	const [loading, setLoading] = useState(false);

	async function load() {
		setLoading(true);
		try {
			setItems(await fetchVnHolidays(year));
		} catch {
			toast.error('Không tải được gợi ý ngày lễ');
		} finally {
			setLoading(false);
		}
	}

	const add = (s: HolidaySuggestion) =>
		create.mutate({ date: s.date, name: s.name, type: HolidayType.Off });
	const pending = (items ?? []).filter((s) => !byDate.has(s.date));

	return (
		<div className="space-y-2 rounded-lg border p-3">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium">Gợi ý từ lịch VN {year}</span>
				<Button size="sm" variant="outline" onClick={load} disabled={loading}>
					{loading ? 'Đang tải…' : items ? 'Tải lại' : 'Lấy gợi ý'}
				</Button>
			</div>
			{items &&
				(pending.length === 0 ? (
					<p className="text-xs text-muted-foreground">Đã thêm hết gợi ý.</p>
				) : (
					<>
						<div className="flex flex-wrap gap-1.5">
							{pending.map((s) => (
								<button
									key={s.date}
									type="button"
									onClick={() => add(s)}
									title={`Thêm ${s.date}`}
									className="rounded border px-2 py-1 text-xs hover:bg-accent">
									{isoToDateShort(s.date)} · {s.name}
								</button>
							))}
						</div>
						<Button
							size="sm"
							onClick={() => pending.forEach(add)}
							disabled={create.isPending}>
							Thêm tất cả ({pending.length})
						</Button>
					</>
				))}
			<p className="text-xs text-muted-foreground">
				Nguồn Nager.Date — thiếu ngày nghỉ bù/hoán đổi, kiểm tra lại trước khi
				dùng.
			</p>
		</div>
	);
}

export default function HolidaysPage() {
	const { user, loading } = useAuth();
	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [mode, setMode] = useState<Mode>('year');
	const [month, setMonth] = useState(now.getMonth() + 1);
	const { data: holidays = [], isLoading } = useHolidaysQuery(year);
	const byDate = new Map(holidays.map((h) => [h.date, h]));

	if (!loading && !user) return null;

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-xl font-semibold">Ngày lễ</h1>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setYear((y) => y - 1)}>
						‹
					</Button>
					<span className="w-12 text-center text-sm font-medium">{year}</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setYear((y) => y + 1)}>
						›
					</Button>
					<div className="ml-2 flex rounded-md border p-0.5 text-xs">
						<button
							type="button"
							onClick={() => setMode('year')}
							className={cn(
								'rounded px-2 py-1',
								mode === 'year' && 'bg-accent',
							)}>
							Cả năm
						</button>
						<button
							type="button"
							onClick={() => setMode('month')}
							className={cn(
								'rounded px-2 py-1',
								mode === 'month' && 'bg-accent',
							)}>
							Từng tháng
						</button>
					</div>
				</div>
			</div>

			<div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<i className="size-3 rounded bg-red-100 dark:bg-red-950" />
					Nghỉ lễ
				</span>
				<span className="flex items-center gap-1.5">
					<i className="size-3 rounded bg-green-100 dark:bg-green-950" />
					Làm bù
				</span>
				<span className="flex items-center gap-1.5">
					<i className="size-3 rounded bg-muted" />
					Cuối tuần
				</span>
			</div>

			<SuggestPanel year={year} byDate={byDate} />

			{mode === 'month' && (
				<div className="flex flex-wrap gap-1">
					{MONTHS.map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => setMonth(m)}
							className={cn(
								'rounded px-3 py-1 text-sm',
								m === month
									? 'bg-primary text-primary-foreground'
									: 'hover:bg-accent',
							)}>
							Th{m}
						</button>
					))}
				</div>
			)}

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Đang tải…</p>
			) : mode === 'month' ? (
				<MonthGrid year={year} month={month} byDate={byDate} />
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{MONTHS.map((m) => (
						<MonthGrid key={m} year={year} month={m} byDate={byDate} />
					))}
				</div>
			)}
		</div>
	);
}
