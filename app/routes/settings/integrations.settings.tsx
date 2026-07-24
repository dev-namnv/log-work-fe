import { Github, GitlabIcon, Trash2, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { GitIntegrationService } from '~/apis/git-integration.service';
import { API_BASE_URL, ApiException } from '~/apis/http';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card';
import { CopyButton } from '~/components/ui/copy-button';
import { Typography } from '~/components/ui/typography';
import { useDeleteGitIntegrationMutation } from '~/hooks/use-git-integration-mutations';
import { useGitIntegrationsQuery } from '~/hooks/use-git-integration-queries';
import { cn } from '~/lib/utils';
import type { GitIntegration } from '~/types';

export function meta() {
	return [
		{ title: 'Tích hợp Git — Log Work' },
		{ name: 'description', content: 'Kết nối tài khoản GitHub / GitLab' },
	];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function WebhookGuide({ integration }: { integration: GitIntegration }) {
	const isGitHub = integration.provider === 'GitHub';
	const payloadUrl = `${API_BASE_URL}/git-integration/webhook/${isGitHub ? 'github' : 'gitlab'}/${integration._id}`;

	return (
		<div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
			<p className="font-medium text-foreground flex items-center gap-1.5">
				<Webhook className="h-4 w-4" />
				Cấu hình Webhook
			</p>
			<div className="space-y-1">
				<p className="text-muted-foreground">Payload URL</p>
				<div className="flex items-center gap-2">
					<Typography variant="code" lines={1} className="flex-1">
						{payloadUrl}
					</Typography>
					<CopyButton value={payloadUrl} />
				</div>
			</div>
			<div className="space-y-1">
				<p className="text-muted-foreground">
					{isGitHub ? 'Secret' : 'Secret token'}
				</p>
				<div className="flex items-center gap-2">
					<Typography variant="code" lines={1} className="flex-1">
						{integration.webhookSecret}
					</Typography>
					<CopyButton value={integration.webhookSecret} />
				</div>
			</div>
			<p className="text-muted-foreground text-xs">
				Content type:{' '}
				<code className="rounded bg-muted px-1">application/json</code>
				{' · '}
				Events: <code className="rounded bg-muted px-1">push</code>
			</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Connected account card
// ---------------------------------------------------------------------------

interface IntegrationCardProps {
	integration: GitIntegration;
}

function IntegrationCard({ integration }: IntegrationCardProps) {
	const [showGuide, setShowGuide] = useState(false);
	const deleteMutation = useDeleteGitIntegrationMutation();
	const isGitHub = integration.provider === 'GitHub';

	return (
		<div className="rounded-lg border border-border p-4 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-3">
					{isGitHub ? (
						<Github className="h-5 w-5 shrink-0" />
					) : (
						<GitlabIcon className="h-5 w-5 shrink-0 text-orange-500" />
					)}
					<div>
						<p className="font-medium leading-none">
							{integration.displayName}
						</p>
						<p className="text-sm text-muted-foreground mt-0.5">
							@{integration.username} · {integration.provider}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						responsiveText
						startIcon={<Webhook className="h-4 w-4" />}
						onClick={() => setShowGuide((v) => !v)}>
						Webhook
					</Button>
					<Button
						size="sm"
						variant="destructive"
						responsiveText
						startIcon={<Trash2 className="h-4 w-4" />}
						disabled={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate(integration._id)}>
						Hủy liên kết
					</Button>
				</div>
			</div>

			{deleteMutation.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{deleteMutation.error instanceof ApiException
							? deleteMutation.error.message
							: 'Hủy liên kết thất bại.'}
					</AlertDescription>
				</Alert>
			)}

			{showGuide && <WebhookGuide integration={integration} />}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Connect buttons
// ---------------------------------------------------------------------------

interface ConnectButtonProps {
	provider: 'github' | 'gitlab';
}

function ConnectButton({ provider }: ConnectButtonProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isGitHub = provider === 'github';

	async function handleConnect() {
		setLoading(true);
		setError(null);
		try {
			const { url } = isGitHub
				? await GitIntegrationService.getGithubOAuthUrl()
				: await GitIntegrationService.getGitlabOAuthUrl();
			window.location.href = url;
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: `Không thể kết nối ${isGitHub ? 'GitHub' : 'GitLab'}.`,
			);
			setLoading(false);
		}
	}

	return (
		<div className="space-y-2">
			<Button
				variant="outline"
				className={cn(
					'w-full justify-start gap-2',
					!isGitHub && 'border-orange-200',
				)}
				disabled={loading}
				onClick={handleConnect}>
				{isGitHub ? (
					<Github className="h-4 w-4" />
				) : (
					<GitlabIcon className="h-4 w-4 text-orange-500" />
				)}
				{loading
					? 'Đang chuyển hướng…'
					: `Kết nối ${isGitHub ? 'GitHub' : 'GitLab'}`}
			</Button>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsIntegrationsPage() {
	const [searchParams] = useSearchParams();
	const linkedProvider = searchParams.get('linked');

	const { data: integrations, isLoading } = useGitIntegrationsQuery();

	// Thông báo kết nối thành công khi redirect về từ OAuth
	const [linkedNotice, setLinkedNotice] = useState<string | null>(null);
	useEffect(() => {
		if (linkedProvider) {
			const name = linkedProvider === 'github' ? 'GitHub' : 'GitLab';
			setLinkedNotice(`Kết nối ${name} thành công!`);
		}
	}, [linkedProvider]);

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Tích hợp Git</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Liên kết tài khoản GitHub / GitLab để tự động ghi chú commit vào nhật
					ký làm việc.
				</p>
			</div>

			{linkedNotice && (
				<Alert variant="success">
					<AlertDescription>{linkedNotice}</AlertDescription>
				</Alert>
			)}

			{/* Danh sách tài khoản đã liên kết */}
			<Card>
				<CardHeader>
					<CardTitle>Tài khoản đã liên kết</CardTitle>
					<CardDescription>
						Mỗi commit push lên repo sẽ được tự động thêm vào ghi chú ngày làm
						việc tương ứng.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{isLoading && (
						<p className="text-sm text-muted-foreground">Đang tải…</p>
					)}
					{!isLoading && (!integrations || integrations.length === 0) && (
						<p className="text-sm text-muted-foreground">
							Chưa có tài khoản Git nào được liên kết.
						</p>
					)}
					{integrations?.map((integration) => (
						<IntegrationCard key={integration._id} integration={integration} />
					))}
				</CardContent>
			</Card>

			{/* Thêm kết nối mới */}
			<Card>
				<CardHeader>
					<CardTitle>Thêm kết nối mới</CardTitle>
					<CardDescription>
						Bạn có thể liên kết nhiều tài khoản GitHub hoặc GitLab.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<ConnectButton provider="github" />
					<ConnectButton provider="gitlab" />
				</CardContent>
			</Card>
		</div>
	);
}
