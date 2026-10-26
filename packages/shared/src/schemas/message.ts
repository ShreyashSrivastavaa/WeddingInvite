import { z } from 'zod';
import { MessageChannel, MessageKind, MessageStatus } from '../enums';

export const prepareMessageSchema = z
  .object({
    householdId: z.string().min(1, 'Household ID is required'),
    eventId: z.string().optional().nullable(),
    kind: z.nativeEnum(MessageKind),
    channel: z.nativeEnum(MessageChannel).default(MessageChannel.WHATSAPP_CLICK_TO_CHAT),
    templateKey: z.string().min(1, 'Template key is required'),
    body: z.string().min(1, 'Message body is required'),
  })
  .strict();

export type PrepareMessageInput = z.infer<typeof prepareMessageSchema>;

export const markSentSchema = z
  .object({
    messageLogId: z.string().min(1, 'Message Log ID is required'),
  })
  .strict();

export type MarkSentInput = z.infer<typeof markSentSchema>;

export const templateUpdateSchema = z
  .object({
    invitation: z.string().min(10, 'Invitation template must not be empty'),
    gentleReminder: z.string().min(10, 'Gentle reminder template must not be empty'),
    finalReminder: z.string().min(10, 'Final reminder template must not be empty'),
  })
  .strict();

export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
