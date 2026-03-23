import { http } from '~/apis/http';

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface TelegramBotInfo {
	id: number;
	is_bot: boolean;
	first_name: string;
	username: string;
}

export interface TelegramWebhookInfo {
	url: string;
	has_custom_certificate: boolean;
	pending_update_count: number;
}

// ---------------------------------------------------------------------------
// TelegramService
// ---------------------------------------------------------------------------

export class TelegramService {
	/**
	 * Lấy thông tin cơ bản về Telegram bot đang được cấu hình.
	 */
	static getBotInfo(): Promise<TelegramBotInfo> {
		return http.get<TelegramBotInfo>('/telegram/bot-info');
	}

	/**
	 * Lấy thông tin webhook hiện tại của Telegram bot.
	 */
	static getWebhookInfo(): Promise<TelegramWebhookInfo> {
		return http.get<TelegramWebhookInfo>('/telegram/webhook-info');
	}
}
