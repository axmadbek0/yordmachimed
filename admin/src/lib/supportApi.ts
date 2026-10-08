/**
 * Support Inquiries API client for Super-Admin Panel
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface InquiryItem {
  id: string;
  session_id: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  role?: string | null;
  message: string;
  admin_reply?: string | null;
  replied_at?: string | null;
  replied_by?: string | null;
  status: 'pending' | 'replied';
  created_at: string;
  updated_at: string;
}

export interface InquiriesResponse {
  inquiries: InquiryItem[];
  stats: {
    total: number;
    pending: number;
    replied: number;
  };
}

export async function fetchInquiries(status?: string): Promise<InquiriesResponse> {
  try {
    const url = `${API_BASE_URL}/support/admin/all${status && status !== 'all' ? `?status=${status}` : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Murojaatlarni yuklashda xatolik');
    return json.data;
  } catch (err: any) {
    console.error('fetchInquiries error:', err);
    throw err;
  }
}

export async function sendInquiryReply(
  id: string,
  reply: string,
  repliedBy = 'Super-Admin'
): Promise<InquiryItem> {
  const res = await fetch(`${API_BASE_URL}/support/admin/reply/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply, repliedBy }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Javob yuborishda xatolik');
  return json.data;
}

export async function deleteInquiryItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/support/admin/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Murojaatni o‘chirishda xatolik');
}
