import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '~/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

interface PopoverContentProps
	extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {}

function PopoverContent({
	className,
	align = 'end',
	side = 'bottom',
	sideOffset = 4,
	collisionPadding = 8,
	avoidCollisions = true,
	...props
}: PopoverContentProps) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				side={side}
				sideOffset={sideOffset}
				collisionPadding={collisionPadding}
				avoidCollisions={avoidCollisions}
				className={cn(
					'z-50 w-56 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none',
					className,
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
