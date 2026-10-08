import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

/**
 * Foydalanuvchi yoki mehmon tomonidan savol/murojaat yuborish
 * POST /api/support/send
 */
export async function sendInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId, senderName, senderPhone, role, message } = req.body as {
      sessionId?: string;
      senderName?: string;
      senderPhone?: string;
      role?: string;
      message?: string;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw AppError.badRequest('Xabar matni kiritilishi shart');
    }

    const sid = sessionId && typeof sessionId === 'string' ? sessionId.trim() : crypto.randomUUID();

    const inquiry = await prisma.supportInquiry.create({
      data: {
        session_id: sid,
        sender_name: senderName?.trim() || "Foydalanuvchi",
        sender_phone: senderPhone?.trim() || null,
        role: role?.trim() || 'guest',
        message: message.trim(),
        status: 'pending',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Murojaatingiz qabul qilindi. Administrator tez orada javob beradi.',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Foydalanuvchining o'z suhbat tarixi va admin javoblarini olish
 * GET /api/support/my-inquiries?sessionId=...
 */
export async function getMyInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.query as { sessionId?: string };

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const inquiries = await prisma.supportInquiry.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Super-Admin uchun: Barcha kelgan murojaatlar va savollarni olish
 * GET /api/support/admin/all
 */
export async function getAllInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query as { status?: string };

    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const inquiries = await prisma.supportInquiry.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    const totalCount = await prisma.supportInquiry.count();
    const pendingCount = await prisma.supportInquiry.count({ where: { status: 'pending' } });
    const repliedCount = await prisma.supportInquiry.count({ where: { status: 'replied' } });

    res.status(200).json({
      success: true,
      data: {
        inquiries,
        stats: {
          total: totalCount,
          pending: pendingCount,
          replied: repliedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Super-Admin uchun: Murojaatga javob qaytarish
 * POST /api/support/admin/reply/:id
 */
export async function replyInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reply, repliedBy } = req.body as { reply?: string; repliedBy?: string };

    if (!reply || typeof reply !== 'string' || !reply.trim()) {
      throw AppError.badRequest('Javob matnini kiritish majburiy');
    }

    const existing = await prisma.supportInquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound('Murojaat topilmadi');
    }

    const updated = await prisma.supportInquiry.update({
      where: { id },
      data: {
        admin_reply: reply.trim(),
        replied_at: new Date(),
        replied_by: repliedBy?.trim() || 'Super-Admin',
        status: 'replied',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Javob muvaffaqiyatli yuborildi',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Super-Admin uchun: Murojaatni o'chirish
 * DELETE /api/support/admin/:id
 */
export async function deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.supportInquiry.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Murojaat o‘chirildi',
    });
  } catch (error) {
    next(error);
  }
}
