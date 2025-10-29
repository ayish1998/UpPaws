import { TrainerProfile } from '../types/trainer.js';
import { AnalyticsManager, EventType } from './analytics.js';

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  attachments: string[];
  cre