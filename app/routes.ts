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
] satisfies RouteConfig;
