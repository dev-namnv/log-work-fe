import { http } from '~/apis/http';
import type { Account } from '~/types/api';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface RegisterDto {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	inviteCode?: string;
}

export interface LoginDto {
	email: string;
	password: string;
}

export interface ChangePasswordDto {
	password: string;
	newPassword: string;
	newPasswordConfirm: string;
}

export interface UpdateProfileDto {
	firstName: string;
	lastName: string;
	email: string;
	languages: string[];
}

export interface UpdateMetadataDto {
	sendMail?: boolean;
	sendTelegram?: boolean;
}

export interface UpdateTelegramDto {
	telegramChatId: string | null;
}

export interface ForgotPasswordDto {
	email: string;
}

export interface ResetPasswordDto {
	key: string;
	password: string;
}

export interface VerifyOtpDto {
	email: string;
	otp: string;
}

export interface ResendOtpDto {
	email: string;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export interface AuthResponse {
	accessToken: string;
	account: Account;
}

export interface MessageResponse {
	message: string;
}

// ---------------------------------------------------------------------------
// AuthService — all methods static
// ---------------------------------------------------------------------------

export class AuthService {
	/**
	 * Đăng ký tài khoản mới. Cookie `accessToken` được set tự động.
	 */
	static register(dto: RegisterDto): Promise<AuthResponse> {
		return http.post<AuthResponse>('/auth/register', { json: dto });
	}

	/**
	 * Đăng nhập. Cookie `accessToken` được set tự động.
	 * Admin có 2FA sẽ nhận OTP qua Telegram → cần gọi `verifyOtp`.
	 */
	static login(dto: LoginDto): Promise<AuthResponse> {
		return http.post<AuthResponse>('/auth/login', { json: dto });
	}

	/**
	 * Đăng xuất. Xoá cookie `accessToken`.
	 */
	static logout(): Promise<MessageResponse> {
		return http.post<MessageResponse>('/auth/logout');
	}

	/**
	 * Lấy thông tin tài khoản đang đăng nhập.
	 */
	static getProfile(): Promise<Account> {
		return http.get<Account>('/auth/profile');
	}

	/**
	 * Đổi mật khẩu.
	 */
	static changePassword(dto: ChangePasswordDto): Promise<MessageResponse> {
		return http.patch<MessageResponse>('/auth/change-password', { json: dto });
	}

	/**
	 * Cập nhật hồ sơ cá nhân.
	 */
	static updateProfile(dto: UpdateProfileDto): Promise<Account> {
		return http.put<Account>('/auth/update-profile', { json: dto });
	}

	/**
	 * Cập nhật metadata (tuỳ chọn thông báo).
	 */
	static updateMetadata(dto: UpdateMetadataDto): Promise<Account> {
		return http.patch<Account>('/auth/update-metadata', { json: dto });
	}

	/**
	 * Cập nhật Telegram Chat ID để nhận thông báo real-time.
	 * Truyền `null` để huỷ kết nối.
	 */
	static updateTelegram(dto: UpdateTelegramDto): Promise<Account> {
		return http.patch<Account>('/auth/update-telegram', { json: dto });
	}

	/**
	 * Gửi email đặt lại mật khẩu.
	 */
	static forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponse> {
		return http.post<MessageResponse>('/auth/forgot-password', { json: dto });
	}

	/**
	 * Đặt lại mật khẩu bằng key từ email.
	 */
	static resetPassword(dto: ResetPasswordDto): Promise<MessageResponse> {
		return http.post<MessageResponse>('/auth/reset-password', { json: dto });
	}

	/**
	 * Xác thực địa chỉ email bằng token từ email xác nhận.
	 */
	static verifyEmail(token: string): Promise<MessageResponse> {
		return http.post<MessageResponse>(`/auth/verify/check/${token}`);
	}

	/**
	 * Gửi lại email xác thực.
	 */
	static resendVerificationEmail(): Promise<MessageResponse> {
		return http.post<MessageResponse>('/auth/verify/resend');
	}

	/**
	 * Yêu cầu xoá tài khoản hiện tại.
	 */
	static requestDeleteAccount(): Promise<MessageResponse> {
		return http.delete<MessageResponse>('/auth/request-delete');
	}

	/**
	 * Xác thực OTP cho Admin đăng nhập 2 bước.
	 * Cookie `accessToken` được set tự động sau khi xác thực thành công.
	 */
	static verifyOtp(dto: VerifyOtpDto): Promise<AuthResponse> {
		return http.post<AuthResponse>('/auth/verify-otp', { json: dto });
	}

	/**
	 * Gửi lại OTP cho Admin đăng nhập 2 bước.
	 */
	static resendOtp(dto: ResendOtpDto): Promise<MessageResponse> {
		return http.post<MessageResponse>('/auth/resend-otp', { json: dto });
	}
}
