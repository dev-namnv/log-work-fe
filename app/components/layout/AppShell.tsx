import Footer from './Footer';
import Header from './Header';

interface AppShellProps {
	children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Header />
			<main className="flex-1 mx-auto w-full max-w-screen-xl px-4 sm:px-6 py-6">
				{children}
			</main>
			<Footer />
		</div>
	);
}
