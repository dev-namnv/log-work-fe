import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { useAuth } from '~/contexts/auth-context';
import {
	useAddMemberMutation,
	useDeleteOrganizationMutation,
	useRemoveMemberMutation,
} from '~/hooks/use-organization-mutations';
import { useOrganizationDetailQuery } from '~/hooks/use-organization-queries';
import type { Account } from '~/types/api';

export function meta() {
	return [
		{ title: 'Chi tiết tổ chức — Log Work' },
		{ name: 'description', content: 'Xem và quản lý tổ chức' },
	];
}

export default function OrganizationDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { user } = useAuth();
	const { data: org, isLoading, error } = useOrganizationDetailQuery(id ?? '');

	const addMemberMutation = useAddMemberMutation(id ?? '');
	const removeMemberMutation = useRemoveMemberMutation(id ?? '');
	const deleteMutation = useDeleteOrganizationMutation();

	const [memberIdInput, setMemberIdInput] = useState('');
	const [memberError, setMemberError] = useState<string | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState(false);

	if (isLoading) {
		return (
			<div className="space-y-4 max-w-2xl mx-auto">
				<div className="h-8 w-48 rounded bg-muted animate-pulse" />
				<div className="h-40 rounded-lg bg-muted animate-pulse" />
			</div>
		);
	}

	if (error || !org) {
		const msg =
			error instanceof ApiException ? error.message : 'Không tìm thấy tổ chức.';
		return (
			<Alert variant="destructive" className="max-w-2xl mx-auto">
				<AlertDescription>{msg}</AlertDescription>
			</Alert>
		);
	}

	const isOwner =
		typeof org.owner === 'object'
			? org.owner._id === user?._id
			: org.owner === user?._id;

	const members = org.members.filter(
		(m): m is Account => typeof m === 'object',
	);

	function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setMemberError(null);
		if (!memberIdInput.trim()) return;
		addMemberMutation.mutate(
			{ memberId: memberIdInput.trim() },
			{
				onSuccess: () => setMemberIdInput(''),
				onError: (err) => {
					setMemberError(
						err instanceof ApiException
							? err.message
							: 'Không thể thêm thành viên.',
					);
				},
			},
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Breadcrumb */}
			<nav className="text-sm text-muted-foreground flex items-center gap-1">
				<Link
					to="/organizations"
					className="hover:text-foreground transition-colors">
					Tổ chức
				</Link>
				<span>/</span>
				<span className="text-foreground line-clamp-1">{org.name}</span>
			</nav>

			{/* Info */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<CardTitle>{org.name}</CardTitle>
					{isOwner && (
						<Button variant="outline" size="sm" asChild>
							<Link to={`/organizations/${id}/settings`}>Cài đặt lịch làm</Link>
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{org.description && (
						<p className="text-muted-foreground">{org.description}</p>
					)}
					<Separator />
					<div className="grid grid-cols-2 gap-2">
						<div>
							<span className="text-muted-foreground">Giờ bắt đầu:</span>{' '}
							<span className="font-medium">
								{org.workSchedule.workStartTime}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Giờ kết thúc:</span>{' '}
							<span className="font-medium">
								{org.workSchedule.workEndTime}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Nghỉ trưa:</span>{' '}
							<span className="font-medium">
								{org.workSchedule.lunchBreakMinutes} phút
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Chủ sở hữu:</span>{' '}
							<span className="font-medium">
								{typeof org.owner === 'object'
									? `${org.owner.firstName} ${org.owner.lastName}`
									: org.owner}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Members */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Thành viên ({members.length})
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{members.length === 0 ? (
						<p className="text-sm text-muted-foreground">Chưa có thành viên.</p>
					) : (
						<ul className="divide-y">
							{members.map((m) => (
								<li
									key={m._id}
									className="flex items-center justify-between py-2 text-sm">
									<div>
										<p className="font-medium">
											{m.firstName} {m.lastName}
										</p>
										<p className="text-muted-foreground text-xs">{m.email}</p>
									</div>
									{isOwner && (
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive"
											disabled={removeMemberMutation.isPending}
											onClick={() =>
												removeMemberMutation.mutate({ memberId: m._id })
											}>
											Xóa
										</Button>
									)}
								</li>
							))}
						</ul>
					)}

					{/* Add member */}
					{isOwner && (
						<>
							<Separator />
							<form onSubmit={handleAddMember} className="flex gap-2">
								<Input
									placeholder="ID tài khoản thành viên"
									value={memberIdInput}
									onChange={(e) => setMemberIdInput(e.target.value)}
									className="flex-1"
								/>
								<Button
									type="submit"
									size="sm"
									disabled={addMemberMutation.isPending}>
									Thêm
								</Button>
							</form>
							{memberError && (
								<p className="text-xs text-destructive">{memberError}</p>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Danger zone */}
			{isOwner && (
				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-base text-destructive">
							Vùng nguy hiểm
						</CardTitle>
					</CardHeader>
					<CardContent>
						{!deleteConfirm ? (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setDeleteConfirm(true)}>
								Xóa tổ chức
							</Button>
						) : (
							<div className="space-y-2">
								<p className="text-sm text-destructive">
									Bạn chắc chắn muốn xóa tổ chức này? Hành động không thể hoàn
									tác.
								</p>
								<div className="flex gap-2">
									<Button
										variant="destructive"
										size="sm"
										disabled={deleteMutation.isPending}
										onClick={() => deleteMutation.mutate(id ?? '')}>
										{deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setDeleteConfirm(false)}>
										Hủy
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
