import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button, type ButtonProps } from '~/components/ui/button';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
	value: string;
	label?: string;
	copiedLabel?: string;
}

export function CopyButton({
	value,
	label = 'Sao chép',
	copiedLabel = 'Đã sao chép',
	variant = 'outline',
	size = 'sm',
	...props
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleCopy}
			responsiveText
			startIcon={
				copied ? (
					<Check className="h-4 w-4 text-green-500" />
				) : (
					<Copy className="h-4 w-4" />
				)
			}
			{...props}>
			{copied ? copiedLabel : label}
		</Button>
	);
}
