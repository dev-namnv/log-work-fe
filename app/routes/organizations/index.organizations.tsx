import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/contexts/auth-context';
import { useOrganizationsQuery } from '~/hooks/use-organization-queries';
import type { Organization } from '~/types';

export function meta() {
	return [
		{ title: 'Tổ chức — Log Work' },
		{ name: 'description', content: 'Quản lý các tổ chức của bạn' },
	];
}

function OrganizationCard({ org }: { org: Organization }) {
	const ownerName =
		typeof org.owner === 'object'
			? `${org.owner.firstName} ${org.owner.lastName}`
			: 'N/A';

	return (
		<Link to={`/organizations/${org._id}`} className="block group">
			<Card className="h-full transition-shadow group-hover:shadow-md">
				<CardHeader className="pb-2">
					<CardTitle className="text-base line-clamp-1">{org.name}</CardTitle>
					{org.description && (
						<CardDescription className="line-clamp-2">
							{org.description}
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground space-y-1">
					<p>
						<span className="font-medium text-foreground">Chủ sở hữu:</span>{' '}
						{ownerName}
					</p>
					<p>
						<span className="font-medium text-foreground">Giờ làm:</span>{' '}
						{org.workSchedule.workStartTime} – {org.workSchedule.workEndTime}
					</p>
					<p>
						<span className="font-medium text-foreground">Nghỉ trưa:</span>{' '}
						{org.workSchedule.lunchBreakMinutes} phút
					</p>
					<p>
						<span className="font-medium text-foreground">Thành viên:</span>{' '}
						{org.members.length} người
					</p>
				</CardContent>
			</Card>
		</Link>
	);
}

export default function OrganizationsPage() {
	const { user, loading: authLoading } = useAuth();
	const authReady = !authLoading && !!user;
	const navigate = useNavigate();
	const [keyword, setKeyword] = useState('');
	const [search, setSearch] = useState('');

	const { data, isLoading, error } = useOrganizationsQuery(
		{ keyword: search },
		{ enabled: authReady },
	);

	useEffect(() => {
		if (!authLoading && !user) {
			navigate('/auth/login?redirect=/organizations', { replace: true });
		}
	}, [user, authLoading, navigate]);

	if (!authLoading && !user) return null;

	const errorMessage =
		error instanceof ApiException ? error.message : error?.message;

	function handleSearch(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSearch(keyword);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Tổ chức</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Quản lý các tổ chức mà bạn là chủ hoặc thành viên.
					</p>
				</div>
				<Button asChild>
					<Link to="/organizations/new">+ Tạo tổ chức</Link>
				</Button>
			</div>

			{/* Search */}
			<form onSubmit={handleSearch} className="flex gap-2 max-w-md">
				<Input
					placeholder="Tìm kiếm tổ chức..."
					value={keyword}
					onChange={(e) => setKeyword(e.target.value)}
				/>
				<Button type="submit" variant="outline">
					Tìm
				</Button>
			</form>

			{/* Error */}
			{errorMessage && (
				<Alert variant="destructive">
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			{/* List */}
			{isLoading ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
					))}
				</div>
			) : data && data.data.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{data.data.map((org) => (
						<OrganizationCard key={org._id} org={org} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
					<p className="text-base">Chưa có tổ chức nào.</p>
					<Button asChild variant="outline">
						<Link to="/organizations/new">Tạo tổ chức đầu tiên</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
