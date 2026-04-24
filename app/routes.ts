import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from '@react-router/dev/routes';

export default [
	// Main routes — wrapped in AppShell (header + footer)
	layout('components/layout/MainLayout.tsx', [
		index('routes/home.tsx'),
		route('profile', 'routes/profile/index.profile.tsx'),
		route('check-in', 'routes/check-in/index.check-in.tsx'),

		// Organizations
		...prefix('organizations', [
			index('routes/organizations/index.organizations.tsx'),
			route('new', 'routes/organizations/new.organizations.tsx'),
			route(':id', 'routes/organizations/$id.organizations.tsx'),
			route(
				':id/settings',
				'routes/organizations/$id.settings.organizations.tsx',
			),
		]),

		// Work Logs
		...prefix('work-logs', [
			index('routes/work-logs/index.work-logs.tsx'),
			route('new', 'routes/work-logs/new.work-logs.tsx'),
			route(':id', 'routes/work-logs/$id.work-logs.tsx'),
		]),

		// Reports
		...prefix('reports', [
			route('attendance', 'routes/reports/attendance.reports.tsx'),
			route('payroll', 'routes/reports/payroll.reports.tsx'),
		]),

		// Employees
		...prefix('employees', [
			index('routes/employees/index.employees.tsx'),
			route(':id', 'routes/employees/$id.employees.tsx'),
		]),
	]),

	// Auth routes — wrapped in AuthLayout (no header/footer)
	layout('components/layout/AuthLayout.tsx', [
		...prefix('auth', [
			route('login', 'routes/auth/login.auth.tsx'),
			route('register', 'routes/auth/register.auth.tsx'),
			route('forgot-password', 'routes/auth/forgot-password.auth.tsx'),
			route('reset-password', 'routes/auth/reset-password.auth.tsx'),
			route('verify-otp', 'routes/auth/verify-otp.auth.tsx'),
			route('verify-email/:token', 'routes/auth/$token.verify-email.auth.tsx'),
		]),
	]),

	// Logout — không dùng AuthLayout vì AuthLayout redirect user đã đăng nhập
	route('auth/logout', 'routes/auth/logout.auth.tsx'),

	// Public share view — no layout, no auth required
	route('share/:token', 'routes/share/$token.share.tsx'),

	// QR Login — nhân viên xác nhận phiên đăng nhập thiết bị đồng hồ
	route('qr-login', 'routes/qr-login.tsx'),
] satisfies RouteConfig;
