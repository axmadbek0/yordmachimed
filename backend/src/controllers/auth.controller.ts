import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Role, AuthRequest } from '../types/auth.types';
import { prisma } from '../lib/prisma';
import { comparePassword, hashPassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import {
  REFRESH_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/cookies';

const INVALID_CREDENTIALS = 'Login yoki parol noto\'g\'ri';

const DUMMY_HASH =
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getRefreshExpiryDate(): Date {
  const raw = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = /^(\d+)d$/.exec(raw);
  const days = match ? Number(match[1]) : 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

function toPublicUser(user: {
  id: string;
  login: string;
  full_name: string | null;
  role: Role | string;
  school_id: string | null;
  phone: string | null;
  must_change_password?: boolean;
  school?: { number: number; name: string } | null;
}) {
  return {
    id: user.id,
    login: user.login,
    full_name: user.full_name,
    displayName: user.full_name || user.login,
    role: user.role as Role,
    school_id: user.school_id,
    schoolId: user.school_id,
    schoolNumber: user.school?.number ?? undefined,
    phone: user.phone,
    mustChangePassword: user.must_change_password ?? false,
  };
}

async function issueTokens(user: {
  id: string;
  role: Role | string;
  school_id: string | null;
  school?: { number: number } | null;
}) {
  const jti = crypto.randomUUID();

  let schoolNumber: number | null = user.school?.number ?? null;
  if (!schoolNumber && user.school_id) {
    const s = await prisma.school.findUnique({ where: { id: user.school_id } });
    if (s) schoolNumber = s.number;
  }

  const accessToken = signAccessToken({
    sub: user.id,
    userId: user.id,
    role: user.role as Role,
    school_id: user.school_id,
    schoolId: user.school_id ?? undefined,
    school_number: schoolNumber,
    schoolNumber: schoolNumber ?? undefined,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    jti,
  });

  await prisma.refreshToken.create({
    data: {
      token_hash: sha256(refreshToken),
      user_id: user.id,
      expires_at: getRefreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/login
 * Body: { login, password, role?, schoolNumber? }
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      login: loginInput,
      password,
      role: roleInput,
      schoolNumber: schoolNumInput,
    } = req.body as {
      login?: unknown;
      password?: unknown;
      role?: unknown;
      schoolNumber?: unknown;
    };

    if (typeof loginInput !== 'string' || typeof password !== 'string') {
      throw AppError.badRequest('Login va parol kiritilishi shart');
    }

    if (loginInput.trim().length < 3 || password.length < 5) {
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }

    const normalizedLogin = loginInput.trim().toLowerCase();

    // Parse expected role if provided
    let expectedRole: Role | null = null;
    if (typeof roleInput === 'string' && roleInput.trim()) {
      const lower = roleInput.trim().toLowerCase();
      if (lower === 'parent') expectedRole = Role.PARENT;
      else if (lower === 'teacher') expectedRole = Role.TEACHER;
      else if (lower === 'school_admin' || lower === 'schooladmin') expectedRole = Role.SCHOOL_ADMIN;
      else if (lower === 'super_admin' || lower === 'admin') expectedRole = Role.SUPER_ADMIN;
    }

    let user = await prisma.user.findUnique({
      where: { login: normalizedLogin },
      include: { school: true },
    });

    // If role is supplied, ensure user's role strictly matches the requested role
    if (user && expectedRole && user.role !== expectedRole) {
      await comparePassword(password, DUMMY_HASH);
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }

    // If school number is supplied, ensure user's school matches
    if (user && schoolNumInput) {
      const parsedNum = Number(schoolNumInput);
      if (!isNaN(parsedNum) && user.school && user.school.number !== parsedNum) {
        // Mismatch between school and user
        await comparePassword(password, DUMMY_HASH);
        throw AppError.unauthorized(INVALID_CREDENTIALS);
      }
    }

    const passwordOk = await comparePassword(
      password,
      user?.password_hash ?? DUMMY_HASH
    );

    if (!user || !passwordOk) {
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = await issueTokens(user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirdingiz',
      accessToken: tokens.accessToken,
      token: tokens.accessToken,
      user: toPublicUser(user),
      mustChangePassword: user.must_change_password,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof tokenFromCookie !== 'string' || !tokenFromCookie.trim()) {
      throw AppError.unauthorized('Autentifikatsiya muvaffaqiyatsiz');
    }

    const payload = verifyRefreshToken(tokenFromCookie);
    const tokenHash = sha256(tokenFromCookie);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: { include: { school: true } } },
    });

    if (
      !storedToken ||
      storedToken.revoked_at ||
      storedToken.expires_at < new Date() ||
      storedToken.user_id !== payload.sub
    ) {
      clearRefreshTokenCookie(res);
      throw AppError.unauthorized('Autentifikatsiya muvaffaqiyatsiz');
    }

    // Rotation: eski token bekor qilinadi
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    const tokens = await issueTokens(storedToken.user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      token: tokens.accessToken,
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    clearRefreshTokenCookie(res);
    next(AppError.unauthorized('Autentifikatsiya muvaffaqiyatsiz'));
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof tokenFromCookie === 'string' && tokenFromCookie.trim()) {
      await prisma.refreshToken.updateMany({
        where: {
          token_hash: sha256(tokenFromCookie),
          revoked_at: null,
        },
        data: { revoked_at: new Date() },
      });
    }

    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Tizimdan chiqdingiz' });
  } catch (error) {
    next(error);
  }
}

const SCHOOL_BOUND_ROLES: Role[] = ['SCHOOL_ADMIN', 'TEACHER', 'PARENT'];

function sanitizeUser(user: {
  id: string;
  login: string;
  full_name: string | null;
  role: Role | string;
  school_id: string | null;
  phone: string | null;
}) {
  return {
    id: user.id,
    login: user.login,
    full_name: user.full_name,
    role: user.role as Role,
    school_id: user.school_id,
    phone: user.phone,
  };
}

function assertRole(role: unknown): role is Role {
  return (
    typeof role === 'string' &&
    ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT'].includes(role)
  );
}

function validateCredentialsInput(loginVal: unknown, password: unknown): void {
  if (typeof loginVal !== 'string' || loginVal.trim().length < 3) {
    throw AppError.badRequest('Noto\'g\'ri so\'rov');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw AppError.badRequest('Noto\'g\'ri so\'rov');
  }
}

function validateRegisterInput(body: {
  login?: unknown;
  password?: unknown;
  role?: unknown;
  full_name?: unknown;
  phone?: unknown;
  school_id?: unknown;
}): void {
  validateCredentialsInput(body.login, body.password);

  if (!assertRole(body.role)) {
    throw AppError.badRequest('Noto\'g\'ri so\'rov');
  }

  if (body.full_name !== undefined && typeof body.full_name !== 'string') {
    throw AppError.badRequest('Noto\'g\'ri so\'rov');
  }

  if (body.phone !== undefined && typeof body.phone !== 'string') {
    throw AppError.badRequest('Noto\'g\'ri so\'rov');
  }

  if (
    body.school_id !== undefined &&
    body.school_id !== null &&
    typeof body.school_id !== 'string'
  ) {
    throw AppError.badRequest('Noto\'g\'ri so\'rov');
  }
}

async function resolveSchoolIdForRegistration(
  actor: NonNullable<AuthRequest['user']>,
  targetRole: Role,
  requestedSchoolId?: string | null
): Promise<string | null> {
  if (targetRole === 'SUPER_ADMIN') {
    return null;
  }

  if (SCHOOL_BOUND_ROLES.includes(targetRole)) {
    if (!requestedSchoolId) {
      throw AppError.badRequest('Noto\'g\'ri so\'rov');
    }

    const school = await prisma.school.findUnique({ where: { id: requestedSchoolId } });
    if (!school) {
      throw AppError.badRequest('Noto\'g\'ri so\'rov');
    }

    if (actor.role === 'SCHOOL_ADMIN' && actor.school_id !== requestedSchoolId) {
      throw AppError.forbidden();
    }

    return requestedSchoolId;
  }

  return requestedSchoolId ?? null;
}

function assertCanCreateRole(actorRole: Role, targetRole: Role): void {
  if (actorRole === 'SUPER_ADMIN') return;

  if (actorRole === 'SCHOOL_ADMIN') {
    if (targetRole === 'TEACHER' || targetRole === 'PARENT') return;
    throw AppError.forbidden();
  }

  throw AppError.forbidden();
}

export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const { login: loginInput, password, role, full_name, phone, school_id } = req.body;
    validateRegisterInput({ login: loginInput, password, role, full_name, phone, school_id });

    const targetRole = role as Role;
    assertCanCreateRole(req.user.role, targetRole);

    const resolvedSchoolId = await resolveSchoolIdForRegistration(
      req.user,
      targetRole,
      school_id
    );

    const normalizedLogin = (loginInput as string).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { login: normalizedLogin } });
    if (existingUser) {
      throw AppError.conflict('Bu login band');
    }

    const password_hash = await hashPassword(password as string);

    const user = await prisma.user.create({
      data: {
        login: normalizedLogin,
        password_hash,
        role: targetRole,
        full_name: typeof full_name === 'string' ? full_name.trim() : null,
        phone: typeof phone === 'string' ? phone.trim() : null,
        school_id: resolvedSchoolId,
      },
    });

    res.status(201).json({
      message: 'Foydalanuvchi muvaffaqiyatli yaratildi',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { school: true },
    });
    if (!user) {
      throw AppError.unauthorized('Autentifikatsiya muvaffaqiyatsiz');
    }

    res.json({
      user: {
        ...toPublicUser(user),
        ...sanitizeUser(user),
        school: user.school ? { id: user.school.id, number: user.school.number, name: user.school.name } : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google
 * Body: { token: string }
 */
export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.body as { token?: string };
    if (!token || typeof token !== 'string') {
      throw AppError.badRequest('Google token majburiy');
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      throw AppError.badRequest('Yaroqsiz token formati');
    }

    let googlePayload: {
      email?: string;
      name?: string;
      sub?: string;
    } = {};

    try {
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
      googlePayload = JSON.parse(payloadStr);
    } catch {
      throw AppError.badRequest('Token ma\'lumotlarini o\'qib bo\'lmadi');
    }

    const email = googlePayload.email?.trim().toLowerCase();
    if (!email) {
      throw AppError.badRequest('Google hisobida email topilmadi');
    }

    let user = await prisma.user.findFirst({
      where: { login: email },
      include: { school: true },
    });

    if (!user) {
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      const password_hash = await hashPassword(dummyPassword);

      user = await prisma.user.create({
        data: {
          login: email,
          password_hash,
          role: Role.PARENT,
          full_name: googlePayload.name || 'Google foydalanuvchisi',
        },
        include: { school: true },
      });
    }

    const tokens = await issueTokens(user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      message: 'Google orqali tizimga muvaffaqiyatli kirdingiz',
      accessToken: tokens.accessToken,
      token: tokens.accessToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}
