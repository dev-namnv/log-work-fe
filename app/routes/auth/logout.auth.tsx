import { redirect } from 'react-router';
import { AuthService } from '~/apis/auth.service';

export async function action() {
	try {
		await AuthService.logout();
	} catch {
		// Ignore errors — cookie may already be expired
	}
	return redirect('/auth/login');
}
