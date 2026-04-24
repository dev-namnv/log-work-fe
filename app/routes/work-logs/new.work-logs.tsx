import { Link } from 'react-router';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card';
import WorkLogForm from '~/components/work-log/WorkLogForm';
import { useAuth } from '~/contexts/auth-context';

export function meta() {
	return [
		{ title: 'Thêm chấm công — Log Work' },
		{ name: 'description', content: 'Thêm bản ghi chấm công mới' },
	];
}

/**
 * Chuyển "YYYY-MM-DD" + "HH:mm" → ISO 8601 string với múi giờ UTC+7 tường minh.
 */
function toISO(date: string, time: string): string {
	return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export default function NewWorkLogPage() {
	const { user, loading: authLoading } = useAuth();

	if (!authLoading && !user) return null;

	return (
		<div className="max-w-lg mx-auto space-y-6">
			{/* Breadcrumb */}
			<nav className="text-sm text-muted-foreground flex items-center gap-1">
				<Link
					to="/work-logs"
					className="hover:text-foreground transition-colors">
					Chấm công
				</Link>
				<span>/</span>
				<span className="text-foreground">Thêm mới</span>
			</nav>

			<Card>
				<CardHeader>
					<CardTitle>Thêm bản ghi chấm công</CardTitle>
					<CardDescription>
						Ghi nhận giờ check-in và check-out. Mỗi ngày chỉ tạo được 1 bản ghi
						cho mỗi tổ chức.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<WorkLogForm log={null} onSuccess={() => {}} />
				</CardContent>
			</Card>
		</div>
	);
}
