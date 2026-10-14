import { X } from 'lucide-react';
import { cn } from '~/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	/** Hiện nút X để xoá value khi có nội dung. */
	clearable?: boolean;
	/** Handler khi bấm clear. Bỏ trống thì tự bắn `onChange` với value rỗng. */
	onClear?: () => void;
}

/**
 * Input text/date/time... dùng chung.
 * @param clearable Hiện nút X xoá value khi input có nội dung.
 * @param onClear Handler khi bấm clear; mặc định bắn `onChange` value rỗng.
 */
function Input({ className, type, clearable, onClear, ...props }: InputProps) {
	const showClear = clearable && !props.disabled && props.value != null && props.value !== '';

	const handleClear = () => {
		if (onClear) return onClear();
		// ponytail: synthetic event đủ field/value cho handler đọc e.target.value/name
		props.onChange?.({
			target: { value: '', name: props.name ?? '' },
		} as React.ChangeEvent<HTMLInputElement>);
	};
	const input = (
		<input
			type={type}
			className={cn(
				'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
				showClear && 'pr-8',
				className,
			)}
			{...props}
		/>
	);

	if (!clearable) return input;

	return (
		<div className="relative">
			{input}
			{showClear && (
				<button
					type="button"
					aria-label="Clear"
					onClick={handleClear}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
					<X className="size-4" />
				</button>
			)}
		</div>
	);
}

export { Input };
