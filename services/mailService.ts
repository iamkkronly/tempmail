import { MailMessage, FullMailMessage, Mailbox } from '../types';

const API_BASE = 'https://api.mail.tm';

export const createAccount = async (): Promise<Mailbox> => {
  try {
    // 1. Get Domain
    const domainRes = await fetch(`${API_BASE}/domains`);
    const domainData = await domainRes.json();
    if (!domainData['hydra:member']?.[0]) throw new Error('No domains available');
    const domain = domainData['hydra:member'][0].domain;

    // 2. Generate Credentials
    const address = `ghost_${Date.now()}@${domain}`;
    const password = 'password123';

    // 3. Register Account
    const regRes = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    
    if (!regRes.ok) throw new Error('Failed to register account');

    // 4. Get Auth Token
    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const tokenData = await tokenRes.json();
    
    if (!tokenData.token) throw new Error('Failed to get access token');

    return { address, token: tokenData.token };
  } catch (error) {
    console.error("Mail service error:", error);
    throw error;
  }
};

export const getMessages = async (token: string): Promise<MailMessage[]> => {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data['hydra:member'] || []).map((msg: any) => ({
      id: msg.id,
      from: msg.from.address,
      subject: msg.subject,
      date: msg.createdAt,
      intro: msg.intro
    }));
  } catch (error) {
    console.error("Failed to fetch messages", error);
    return [];
  }
};

export const getMessageContent = async (token: string, id: string): Promise<FullMailMessage | null> => {
  try {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    
    const data = await res.json();
    return {
      id: data.id,
      from: data.from.address,
      subject: data.subject,
      date: data.createdAt,
      text: data.text || '',
      html: data.html ? [data.html] : []
    };
  } catch (error) {
    console.error("Failed to fetch message content", error);
    return null;
  }
};