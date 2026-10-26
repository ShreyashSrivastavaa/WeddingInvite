import {
  buildWhatsAppClickToChatUrl,
  MessageChannel,
  MessageStatus,
} from '@rsvp/shared';
import { env } from '../config/env';

export interface SendMessageOptions {
  recipientPhoneE164: string;
  messageText: string;
  templateKey: string;
}

export interface PreparedMessageResult {
  channel: MessageChannel;
  status: MessageStatus;
  externalUrl?: string;
  providerMessageId?: string;
}

export interface MessagingProvider {
  name: string;
  channel: MessageChannel;
  prepareMessage(options: SendMessageOptions): Promise<PreparedMessageResult>;
}

export class ClickToChatProvider implements MessagingProvider {
  name = 'WhatsApp Click-to-Chat';
  channel = MessageChannel.WHATSAPP_CLICK_TO_CHAT;

  async prepareMessage(options: SendMessageOptions): Promise<PreparedMessageResult> {
    const url = buildWhatsAppClickToChatUrl(
      options.recipientPhoneE164,
      options.messageText
    );
    return {
      channel: this.channel,
      status: MessageStatus.PREPARED,
      externalUrl: url,
    };
  }
}

/**
 * Feature-flagged WhatsApp Cloud API Provider stub.
 * Enabled only if WHATSAPP_CLOUD_API_TOKEN is provided.
 */
export class WhatsAppCloudProvider implements MessagingProvider {
  name = 'WhatsApp Cloud API';
  channel = MessageChannel.WHATSAPP_CLOUD_API;

  async prepareMessage(_options: SendMessageOptions): Promise<PreparedMessageResult> {
    if (!env.WHATSAPP_CLOUD_API_TOKEN) {
      throw new Error(
        'WhatsApp Cloud API is not configured. Falling back to Click-to-Chat.'
      );
    }
    // Stub for future Cloud API implementation
    return {
      channel: this.channel,
      status: MessageStatus.PREPARED,
    };
  }
}

export function getMessagingProvider(): MessagingProvider {
  if (
    env.WHATSAPP_CLOUD_API_TOKEN &&
    env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
  ) {
    return new WhatsAppCloudProvider();
  }
  return new ClickToChatProvider();
}
