export interface MailMessage {
  id: number;
  from: string;
  subject: string;
  date: string;
}

export interface FullMailMessage extends MailMessage {
  body: string;
  textBody: string;
  htmlBody: string;
}

export interface AIAnalysisResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  actionableItems: string[];
  phishingScore: number; // 0-100
}

export enum AppView {
  INBOX = 'INBOX',
  EMAIL_DETAIL = 'EMAIL_DETAIL',
}

export interface Mailbox {
  login: string;
  domain: string;
  address: string;
}