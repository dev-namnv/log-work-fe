import { Separator } from '~/components/ui/separator';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
	return (
		<footer className="w-full border-t border-border bg-background">
			<div className="mx-auto max-w-screen-xl px-4 sm:px-6">
				<div className="flex h-12 items-center justify-between gap-4">
					<p className="text-xs text-muted-foreground">
						© {CURRENT_YEAR}{' '}
						<span className="font-medium text-foreground">Log Work</span> — Hệ
						thống quản lý chấm công
					</p>

					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>v1.0.0</span>
						<Separator orientation="vertical" className="h-3" />
						<span>React Router v7</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
