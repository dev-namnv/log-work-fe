import { formatNumber, parseNumber } from '~/lib/number';
import { cn } from '~/lib/utils';

interface NumberInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
	value: number | null | undefined;
	onValueChange: (value: number) => void;
}

// Input hiển thị số có nhóm nghìn, emit ra giá trị number
function NumberInput({ value, onValueChange, className, ...props }: NumberInputProps) {
	return (
		<input
			type="text"
			inputMode="numeric"
			value={formatNumber(value)}
			onChange={(e) => onValueChange(parseNumber(e.target.value))}
			className={cn(
				'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-right tabular-nums shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		/>
	);
}

export { NumberInput };
