import { cn } from '~/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'destructive' | 'success';
}

function Alert({ className, variant = 'default', ...props }: AlertProps) {
	return (
		<div
			role="alert"
			className={cn(
				'relative w-full rounded-lg border px-4 py-3 text-sm',
				variant === 'destructive' &&
					'border-destructive/50 text-destructive bg-destructive/5',
				variant === 'success' &&
					'border-green-500/50 text-green-700 bg-green-500/5',
				variant === 'default' && 'border-border bg-muted text-foreground',
				className,
			)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return <p className={cn('text-sm leading-relaxed', className)} {...props} />;
}

export { Alert, AlertDescription };
