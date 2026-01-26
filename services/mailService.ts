import { MailMessage, FullMailMessage, Mailbox, AccountDetails } from '../types';

const API_BASE = 'https://api.mail.tm';

export const getDomains = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${API_BASE}/domains`);
    const data = await res.json();
    return (data['hydra:member'] || []).map((d: any) => d.domain);
  } catch (e) {
    console.error("Failed to fetch domains", e);
    return [];
  }
};

export const createAccount = async (username?: string, domain?: string): Promise<Mailbox> => {
  try {
    let selectedDomain = domain;
    
    // 1. Get Domain if not provided
    if (!selectedDomain) {
        const domainRes = await fetch(`${API_BASE}/domains`);
        const domainData = await domainRes.json();
        if (!domainData['hydra:member']?.[0]) throw new Error('No domains available');
        selectedDomain = domainData['hydra:member'][0].domain;
    }

    // 2. Generate Credentials
    const address = username ? `${username}@${selectedDomain}` : `ghost_${Date.now()}@${selectedDomain}`;
    const password = 'password123';

    // 3. Register Account
    const regRes = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    
    if (!regRes.ok) {
        if (regRes.status === 422) throw new Error('Username already taken');
        throw new Error('Failed to register account');
    }
    const accountData = await regRes.json();

    // 4. Get Auth Token
    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password })
    });
    const tokenData = await tokenRes.json();
    
    if (!tokenData.token) throw new Error('Failed to get access token');

    return { address, token: tokenData.token, id: accountData.id };
  } catch (error) {
    console.error("Mail service error:", error);
    throw error;
  }
};

export const getMessages = async (token: string): Promise<MailMessage[]> => {
  try {
    const res = await fetch(`${API_BASE}/messages?page=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data['hydra:member'] || []).map((msg: any) => ({
      id: msg.id,
      from: msg.from.address,
      subject: msg.subject,
      date: msg.createdAt,
      intro: msg.intro,
      seen: msg.seen
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
      html: data.html ? [data.html] : [],
      seen: true 
    };
  } catch (error) {
    console.error("Failed to fetch message content", error);
    return null;
  }
};

export const deleteMessage = async (token: string, id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to delete message", error);
    return false;
  }
};

export const markMessageSeen = async (token: string, id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/merge-patch+json'
      },
      body: JSON.stringify({ seen: true })
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to mark message as seen", error);
    return false;
  }
};

export const getAccountDetails = async (token: string): Promise<AccountDetails | null> => {
  try {
    const res = await fetch(`${API_BASE}/me`, {
       headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      address: data.address,
      quota: data.quota,
      used: data.used
    };
  } catch (error) {
    return null;
  }
};