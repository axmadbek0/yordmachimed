/**
 * Super-Admin: Savol va Murojaatlar Markazi (Support Inquiries & Live Replies)
 */

import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle,
  Clock,
  User,
  Phone,
  RefreshCw,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchInquiries,
  sendInquiryReply,
  deleteInquiryItem,
  type InquiryItem,
} from '../../lib/supportApi';

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0 });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected inquiry for replying
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadInquiries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInquiries(statusFilter);
      setInquiries(data.inquiries);
      setStats(data.stats);
    } catch (err: any) {
      setError(err?.message || 'Murojaatlarni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInquiries();
    // Auto refresh every 8 seconds
    const interval = setInterval(loadInquiries, 8000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleSendReply = async (inquiryId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await sendInquiryReply(inquiryId, replyText.trim(), 'Bosh Administrator');
      setInquiries((prev) => prev.map((item) => (item.id === inquiryId ? updated : item)));
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        replied: prev.replied + 1,
      }));
      setReplyText('');
      setActiveInquiryId(null);
      setToastMessage('Javobingiz foydalanuvchiga muvaffaqiyatli yetkazildi!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Javob yuborishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!confirm('Ushbu murojaatni o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await deleteInquiryItem(inquiryId);
      setInquiries((prev) => prev.filter((item) => item.id !== inquiryId));
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err: any) {
      alert(err?.message || 'O‘chirishda xatolik');
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const q = searchQuery.toLowerCase();
    return (
      inq.message.toLowerCase().includes(q) ||
      (inq.sender_name && inq.sender_name.toLowerCase().includes(q)) ||
      (inq.sender_phone && inq.sender_phone.includes(q)) ||
      (inq.admin_reply && inq.admin_reply.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-deep font-serif tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-coral" />
            Savollar va Murojaatlar Markazi
          </h1>
          <p className="text-sm text-muted mt-1">
            Foydalanuvchilardan sayt orqali kelib tushgan savollarni ko'rish va to'g'ridan-to'g'ri javob qaytarish
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadInquiries}
          disabled={isLoading}
          className="gap-2 self-start sm:self-auto font-bold border-cardBlue hover:bg-cardBlue/50"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
          Yangilash
        </Button>
      </div>

      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold flex items-center gap-3 shadow-sm"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <Card
          variant="white"
          onClick={() => setStatusFilter('pending')}
          className={`p-5 cursor-pointer border transition-all ${
            statusFilter === 'pending'
              ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
              : 'border-primary/5 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Kutilmoqda
            </span>
          </div>
          <div className="text-3xl font-black text-deep">{stats.pending}</div>
          <p className="text-xs text-muted mt-1">Javob berilishi kerak bo'lgan savollar</p>
        </Card>

        {/* Replied Card */}
        <Card
          variant="white"
          onClick={() => setStatusFilter('replied')}
          className={`p-5 cursor-pointer border transition-all ${
            statusFilter === 'replied'
              ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-400/20'
              : 'border-primary/5 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Javob berilgan
            </span>
          </div>
          <div className="text-3xl font-black text-deep">{stats.replied}</div>
          <p className="text-xs text-muted mt-1">Admin tomonidan javoblanganlar</p>
        </Card>

        {/* Total Card */}
        <Card
          variant="white"
          onClick={() => setStatusFilter('all')}
          className={`p-5 cursor-pointer border transition-all ${
            statusFilter === 'all'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-primary/5 hover:border-primary/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-2xl bg-deep/10 text-deep">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Jami</span>
          </div>
          <div className="text-3xl font-black text-deep">{stats.total}</div>
          <p className="text-xs text-muted mt-1">Barcha yuborilgan murojaatlar</p>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex bg-white rounded-2xl p-1 border border-cardBlue shadow-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-deep text-white shadow-xs'
                : 'text-muted hover:text-deep'
            }`}
          >
            Barchasi ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-muted hover:text-deep'
            }`}
          >
            Kutilmoqda ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter('replied')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'replied'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted hover:text-deep'
            }`}
          >
            Javoblangan ({stats.replied})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Savol yoki ism bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-cardBlue text-xs sm:text-sm focus:outline-none focus:border-primary transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {isLoading && inquiries.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-3xl animate-pulse border border-primary/5" />
          ))}
        </div>
      ) : error ? (
        <Card variant="white" className="p-8 text-center max-w-md mx-auto shadow-sm">
          <AlertCircle className="w-10 h-10 text-coral mx-auto mb-3" />
          <p className="text-sm text-muted mb-4">{error}</p>
          <Button variant="primary" onClick={loadInquiries} className="gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Qayta urinish
          </Button>
        </Card>
      ) : filteredInquiries.length === 0 ? (
        <Card variant="white" className="p-12 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-deep mb-1">Murojaatlar mavjud emas</h3>
          <p className="text-xs text-muted">
            {searchQuery
              ? "Qidiruvingiz bo'yicha savol topilmadi"
              : statusFilter === 'pending'
              ? 'Hozirda javob kutilayotgan savollar yo‘q'
              : 'Foydalanuvchilar tomonidan savollar yuborilganda shu yerda ko‘rinadi'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((item) => {
            const isReplying = activeInquiryId === item.id;
            const isPending = item.status === 'pending';

            return (
              <Card
                key={item.id}
                variant="white"
                className={`p-6 shadow-sm border transition-all ${
                  isPending
                    ? 'border-amber-200/80 bg-white hover:border-amber-400'
                    : 'border-primary/5 bg-white'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cardBlue">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-deep/10 text-deep flex items-center justify-center font-bold text-sm shadow-xs">
                      {item.sender_name ? item.sender_name.slice(0, 2).toUpperCase() : 'FO'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-deep text-sm">
                          {item.sender_name || 'Foydalanuvchi'}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          {item.role || 'mehmon'}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-3 mt-0.5">
                        {item.sender_phone && (
                          <a
                            href={`tel:${item.sender_phone}`}
                            className="flex items-center gap-1 text-primary font-medium hover:underline"
                          >
                            <Phone className="w-3 h-3" /> {item.sender_phone}
                          </a>
                        )}
                        <span>
                          {new Date(item.created_at).toLocaleString('uz-UZ', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-3.5 h-3.5" /> Javob kutilmoqda
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Javoblangan
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-muted hover:text-coral hover:bg-coral/10 rounded-xl transition-colors cursor-pointer"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* User's Question Message */}
                <div className="py-4 space-y-1">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Foydalanuvchi savoli:
                  </span>
                  <div className="text-sm font-semibold text-deep bg-bg/60 p-4 rounded-2xl border border-cardBlue leading-relaxed">
                    "{item.message}"
                  </div>
                </div>

                {/* Admin Reply Section */}
                {item.admin_reply && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Administrator Javobi ({item.replied_by || 'Bosh Admin'}):
                      </span>
                      <span className="text-[10px] font-normal text-emerald-700">
                        {item.replied_at &&
                          new Date(item.replied_at).toLocaleString('uz-UZ', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-950 font-medium whitespace-pre-wrap pt-1">
                      {item.admin_reply}
                    </p>
                  </div>
                )}

                {/* Reply Form / Action */}
                {isReplying ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2 border-t border-cardBlue space-y-3"
                  >
                    <textarea
                      rows={3}
                      placeholder="Foydalanuvchiga yuboriladigan javob matnini yozing..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-white border border-cardBlue text-xs sm:text-sm focus:outline-none focus:border-primary transition-all resize-y"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setActiveInquiryId(null);
                          setReplyText('');
                        }}
                      >
                        Bekor qilish
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isSubmitting || !replyText.trim()}
                        onClick={() => handleSendReply(item.id)}
                        className="gap-2 font-bold !bg-deep"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isSubmitting ? 'Yuborilmoqda...' : 'Javobni Yuborish'}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant={isPending ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setActiveInquiryId(item.id);
                        setReplyText(item.admin_reply || '');
                      }}
                      className="gap-2 text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {item.admin_reply ? 'Javobni tahrirlash' : 'Javob qaytarish'}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
