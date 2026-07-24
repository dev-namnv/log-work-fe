import { RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface AddMinutesProps {
	/** Giá trị giờ hiện tại dạng "HH:mm" */
	value: string;
	/** Các mốc phút, ví dụ [5, 10, 15] */
	options: number[];
	/** Trả về giờ mới dạng "HH:mm" */
	onChange: (next: string) => void;
	/**
	 * 'increment' (mặc định): cộng dồn phút vào giá trị hiện tại.
	 * 'select': mỗi option là offset cố định tính từ `base`, chọn lại thì tính
	 * lại từ `base` chứ không cộng dồn; option đang chọn hiện đậm.
	 */
	mode?: 'increment' | 'select';
	/** Giờ gốc "HH:mm". Bắt buộc cho mode 'select'; cũng là giá trị nút refresh đưa về */
	base?: string;
	/** Hiện nút refresh đặt lại về `base` */
	showReset?: boolean;
}

/** Cộng `minutes` vào chuỗi giờ "HH:mm", cuộn vòng trong 24h */
function addMinutes(time: string, minutes: number): string {
	const [h, m] = time.split(':').map(Number);
	if (Number.isNaN(h) || Number.isNaN(m)) return time;
	const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
	const hh = String(Math.floor(total / 60)).padStart(2, '0');
	const mm = String(total % 60).padStart(2, '0');
	return `${hh}:${mm}`;
}

export default function AddMinutes({
	value,
	options,
	onChange,
	mode = 'increment',
	base,
	showReset,
}: AddMinutesProps) {
	return (
		<div className="flex gap-1">
			{options.map((min) => {
				const isSelect = mode === 'select' && base !== undefined;
				const selected = isSelect && value === addMinutes(base, min);
				return (
					<Button
						key={min}
						type="button"
						variant={selected ? 'default' : 'outline'}
						size="sm"
						className="flex-1"
						onClick={() =>
							onChange(addMinutes(isSelect ? base : value, min))
						}>
						+{min}
					</Button>
				);
			})}
			{showReset && base !== undefined && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					title="Đặt lại giờ gốc"
					onClick={() => onChange(base)}>
					<RotateCcw />
				</Button>
			)}
		</div>
	);
}
