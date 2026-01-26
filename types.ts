
export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  transferEncoding: string;
  related: boolean;
  size: number;
}

export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  intro?: string;
  seen: boolean;
}

export interface FullMailMessage extends MailMessage {
  text: string;
  html: string[];
  attachments: Attachment[];
}

export interface Mailbox {
  address: string;
  token: string;
  id?: string; // Account ID might be needed for some operations
}

export interface AccountDetails {
  address: string;
  quota: number;
  used: number;
}

export enum AppView {
  INBOX = 'INBOX',
  EMAIL_DETAIL = 'EMAIL_DETAIL',
}

export interface AIAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  actionableItems: string[];
  phishingScore: number;
}

export interface InboxAnalysisResult {
  overview: string;
  categories: { name: string; count: number }[];
  extractedCodes: { code: string; source: string }[];
  urgentCount: number;
}

export type ThemeOption = 'dark' | 'light' | 'blue';
