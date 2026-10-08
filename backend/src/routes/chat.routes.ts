import { Router } from 'express';
import { getUserChats, createChat, getChatMessages } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getUserChats);
router.post('/', authenticate, createChat);
router.get('/:chatId/messages', authenticate, getChatMessages);

export default router;
