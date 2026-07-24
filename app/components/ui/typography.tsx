import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const typographyVariants = cva('', {
	variants: {
		variant: {
			h1: 'scroll-m-20 text-4xl font-bold tracking-tight',
			h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
			h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
			h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
			body: 'text-base leading-relaxed',
			caption: 'text-xs',
			code: 'break-all rounded bg-muted px-2 py-1 font-mono text-xs',
		},
		color: {
			default: 'text-foreground',
			primary: 'text-primary',
			secondary: 'text-secondary-foreground',
			muted: 'text-muted-foreground',
		},
	},
	defaultVariants: {
		variant: 'body',
		color: 'default',
	},
});

const variantElement = {
	h1: 'h1',
	h2: 'h2',
	h3: 'h3',
	h4: 'h4',
	body: 'p',
	caption: 'span',
	code: 'code',
} as const;

type TypographyVariant = keyof typeof variantElement;

interface TypographyProps
	extends
		Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
		Omit<VariantProps<typeof typographyVariants>, 'color'> {
	variant?: TypographyVariant;
	/** Preset color, or any CSS color value (e.g. '#f00', 'rgb(...)') */
	color?: 'default' | 'primary' | 'secondary' | 'muted' | (string & {});
	/** Max lines before truncating with ellipsis */
	lines?: number;
	asChild?: boolean;
}

const PRESET_COLORS = ['default', 'primary', 'secondary', 'muted'];

function Typography({
	className,
	variant = 'body',
	color = 'default',
	lines,
	asChild = false,
	style,
	...props
}: TypographyProps) {
	const isPreset = PRESET_COLORS.includes(color);
	const Comp = asChild ? Slot : variantElement[variant];

	// lines === 1: dùng truncate (nowrap). lines > 1: line-clamp với
	// line-height cố định để box cắt đúng số dòng, không lộ đỉnh dòng kế.
	const clampMulti = lines != null && lines > 1;
	const lineClampStyle = clampMulti
		? {
				display: '-webkit-box',
				WebkitLineClamp: lines,
				WebkitBoxOrient: 'vertical' as const,
				overflow: 'hidden',
				lineHeight: 1.4,
			}
		: undefined;

	return (
		<Comp
			className={cn(
				typographyVariants({
					variant,
					color: isPreset ? (color as 'default') : undefined,
				}),
				lines === 1 && 'truncate',
				className,
			)}
			style={{
				...lineClampStyle,
				...(isPreset ? undefined : { color }),
				...style,
			}}
			{...props}
		/>
	);
}

export { Typography, typographyVariants };
