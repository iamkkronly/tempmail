import { MailMessage, FullMailMessage, Mailbox } from '../types';

const API_BASE = 'https://www.1secmail.com/api/v1/';

// Helper to bypass CORS using a proxy
const fetchWithCORS = async (url: string) => {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

export const generateRandomAddress = async (): Promise<Mailbox> => {
  try {
    const data = await fetchWithCORS(`${API_BASE}?action=genRandomMailbox&count=1`);
    if (Array.isArray(data) && data.length > 0) {
        const address = data[0];
        const [login, domain] = address.split('@');
        return { login, domain, address };
    }
    throw new Error("Invalid address format received");
  } catch (error) {
    console.error("Failed to generate mailbox, using fallback", error);
    // Fallback if API fails completely
    const fallbackLogin = `ghost_${Math.floor(Math.random() * 100000)}`;
    const fallbackDomain = '1secmail.com';
    return {
      login: fallbackLogin,
      domain: fallbackDomain,
      address: `${fallbackLogin}@${fallbackDomain}`
    };
  }
};

export const checkInbox = async (login: string, domain: string): Promise<MailMessage[]> => {
  try {
    const data = await fetchWithCORS(`${API_BASE}?action=getMessages&login=${login}&domain=${domain}`);
    return data as MailMessage[];
  } catch (error) {
    console.error("Failed to fetch inbox", error);
    return [];
  }
};

export const getMessageContent = async (login: string, domain: string, id: number): Promise<FullMailMessage | null> => {
  try {
    const data = await fetchWithCORS(`${API_BASE}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
    return data as FullMailMessage;
  } catch (error) {
    console.error("Failed to fetch message content", error);
    return null;
  }
};

// Mock data generator for testing or if API is blocked by CORS/Rate limits
export const getMockMessages = (): MailMessage[] => {
  return [
    { id: 101, from: 'newsletter@tech-daily.com', subject: 'Your Daily Tech Digest', date: new Date().toISOString() },
    { id: 102, from: 'security@bank-alert.com', subject: 'URGENT: Verify your account now', date: new Date().toISOString() }
  ];
};

export const getMockMessageContent = (id: number): FullMailMessage => {
  if (id === 102) {
    return {
      id: 102,
      from: 'security@bank-alert.com',
      subject: 'URGENT: Verify your account now',
      date: new Date().toISOString(),
      body: 'Please click here to verify your account immediately or it will be closed.',
      textBody: 'Please click here to verify your account immediately or it will be closed.',
      htmlBody: '<p>Please click <a href="#">here</a> to verify your account immediately or it will be closed.</p>'
    }
  }
  return {
    id: 101,
    from: 'newsletter@tech-daily.com',
    subject: 'Your Daily Tech Digest',
    date: new Date().toISOString(),
    body: 'Here are the top stories for today...',
    textBody: 'Here are the top stories for today...',
    htmlBody: '<h1>Top Stories</h1><p>Here are the top stories for today...</p>'
  };
};