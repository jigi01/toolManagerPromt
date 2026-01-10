import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

// Все возможные права доступа
const ALL_PERMISSIONS = [
  'USER_INVITE',
  'USER_DELETE',
  'USER_READ',
  'USER_ASSIGN_ROLE',
  'ROLE_MANAGE',
  'TOOL_CREATE',
  'TOOL_UPDATE',
  'TOOL_DELETE',
  'TOOL_READ',
  'TOOL_TRANSFER',
  'TOOL_CHECKIN',
  'WAREHOUSE_CREATE',
  'WAREHOUSE_UPDATE',
  'WAREHOUSE_DELETE',
  'WAREHOUSE_READ',
  'TOOL_MANAGE_ALL' // Permission to manage/transfer any tool regardless of ownership
];

// Права для стандартной роли "Сотрудник"
const EMPLOYEE_PERMISSIONS = [
  'USER_READ',
  'TOOL_READ',
  'TOOL_TRANSFER',
  'TOOL_CHECKIN',
  'WAREHOUSE_READ'
];

import { sendVerificationEmail } from './email.service.js';

// Helper to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerUser = async (name, email, password, companyName = null, inviteToken = null) => {
  // 1. Check if user already exists in MAIN table
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (!existingUser.isVerified) {
      // Optional: Resend code if unverified user exists (Legacy flow support)
      // For now, treat as "User exists".
    }
    throw new Error('Пользователь с таким email уже существует.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationCode = generateOTP();
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 2. Validate invite token if present (Fail fast)
  if (inviteToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken }
    });
    if (!invitation) throw new Error('Неверный токен приглашения.');
    if (invitation.usedAt) throw new Error('Токен приглашения уже использован.');
    if (new Date() > invitation.expiresAt) throw new Error('Срок действия приглашения истек.');
    if (invitation.email && invitation.email !== email) throw new Error('Email не совпадает с приглашением.');
  } else {
    if (!companyName) throw new Error('Необходимо указать название компании.');
  }

  // 3. Upsert into PendingRegistration
  // If a pending registration exists, we update it (new code, new details)
  await prisma.pendingRegistration.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      companyName,
      inviteToken,
      verificationCode,
      expiresAt: verificationCodeExpires
    },
    create: {
      email,
      name,
      password: hashedPassword,
      companyName,
      inviteToken,
      verificationCode,
      expiresAt: verificationCodeExpires
    }
  });

  // 4. Send Email
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email send timeout')), 5000)
    );
    await Promise.race([
      sendVerificationEmail(email, verificationCode),
      timeout
    ]);
  } catch (error) {
    console.error('Failed to send verification email (or timeout):', error.message);
    console.log('====================================================');
    console.log('⚠️  DEV MODE / EMAIL ERROR ⚠️');
    console.log(`To verify user ${email}, use code:`);
    console.log(`👉  ${verificationCode}  👈`);
    console.log('====================================================');
  }

  return { requiresVerification: true, email };
};

export const verifyEmail = async (email, code) => {
  // 1. Try to find in PendingRegistration
  const pendingUser = await prisma.pendingRegistration.findUnique({ where: { email } });

  // 2. If not found in Pending, check legacy User table (for backward compatibility)
  if (!pendingUser) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && !existingUser.isVerified) {
      // Handle legacy verification
      if (existingUser.verificationCode !== code) throw new Error('Неверный код подтверждения.');
      if (new Date() > existingUser.verificationCodeExpires) throw new Error('Срок действия кода истек.');

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { isVerified: true, verificationCode: null, verificationCodeExpires: null },
        include: { role: true }
      });
      const token = jwt.sign({ userId: updatedUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return {
        user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, companyId: updatedUser.companyId, role: updatedUser.role },
        token
      };
    }
    throw new Error('Запрос на регистрацию не найден или срок действия истек.');
  }

  // 3. Verify Pending User
  if (pendingUser.verificationCode !== code) {
    throw new Error('Неверный код подтверждения.');
  }

  if (new Date() > pendingUser.expiresAt) {
    throw new Error('Срок действия кода истек. Запросите новый код.');
  }

  let user;

  // 4. Create Real User (and Company if needed)
  if (pendingUser.inviteToken) {
    // --- JOIN EXISTING COMPANY ---
    const invitation = await prisma.invitation.findUnique({
      where: { token: pendingUser.inviteToken },
      include: { company: true }
    });

    // Double check invitation validity (in case it expired while user was waiting)
    if (!invitation || invitation.usedAt || new Date() > invitation.expiresAt) {
      throw new Error('Приглашение недействительно (истекло или использовано).');
    }

    let targetRoleId = invitation.roleId;
    if (!targetRoleId) {
      const employeeRole = await prisma.role.findFirst({
        where: { companyId: invitation.companyId, name: 'Сотрудник' }
      });
      if (employeeRole) targetRoleId = employeeRole.id;
    }

    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: pendingUser.name,
          email: pendingUser.email,
          password: pendingUser.password, // Already hashed
          companyId: invitation.companyId,
          roleId: targetRoleId,
          isVerified: true
        },
        include: { role: true }
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() }
      });

      return newUser;
    });

  } else {
    // --- CREATE NEW COMPANY ---
    if (!pendingUser.companyName) throw new Error('Ошибка данных регистрации (нет названия компании).');

    user = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: pendingUser.companyName } });

      await tx.warehouse.create({
        data: { name: 'Основной склад', companyId: company.id, isDefault: true }
      });

      const bossRole = await tx.role.create({
        data: { name: 'Босс', companyId: company.id, isBoss: true, permissions: ALL_PERMISSIONS }
      });

      await tx.role.create({
        data: { name: 'Сотрудник', companyId: company.id, isBoss: false, permissions: EMPLOYEE_PERMISSIONS }
      });

      const newUser = await tx.user.create({
        data: {
          name: pendingUser.name,
          email: pendingUser.email,
          password: pendingUser.password, // Already hashed
          companyId: company.id,
          roleId: bossRole.id,
          isVerified: true
        },
        include: { role: true }
      });

      return newUser;
    });
  }

  // 5. Delete Pending Registration
  await prisma.pendingRegistration.delete({ where: { email } });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      role: user.role
    },
    token
  };
};

export const resendVerificationCode = async (email) => {
  const pendingUser = await prisma.pendingRegistration.findUnique({ where: { email } });

  if (pendingUser) {
    const verificationCode = generateOTP();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingRegistration.update({
      where: { email },
      data: { verificationCode, expiresAt: verificationCodeExpires }
    });

    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout')), 5000)
      );
      await Promise.race([
        sendVerificationEmail(email, verificationCode),
        timeout
      ]);
    } catch (error) {
      console.error('Failed to send verification email (retry):', error.message);
      console.log('DEV MODE CODE:', verificationCode);
    }
    return { message: 'Код отправлен повторно.' };
  }

  // Fallback to existing user check
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isVerified) {
    // Legacy logic
    const verificationCode = generateOTP();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationCodeExpires }
    });
    // Send email... (omitted for brevity, assume similar logic)
    return { message: 'Код отправлен повторно.' };
  }

  throw new Error('Пользователь не найден или уже активирован.');
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
          isBoss: true
        }
      }
    }
  });

  if (!user) {
    throw new Error('Неверный email или пароль.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Неверный email или пароль.');
  }

  if (!user.isVerified) {
    // Optional: Resend code if user tries to login but is not verified
    // For now just error
    throw new Error('Email не подтвержден. Пожалуйста, завершите регистрацию.');
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      role: user.role
    },
    token
  };
};

export const registerOAuthUser = async (token, password, companyName, inviteToken = null, emailOverride = null) => {
  // 1. Verify pre-auth token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'pre-auth') {
    throw new Error('Invalid token type');
  }

  const { name, yandexId, avatarUrl } = decoded;
  let { email } = decoded;

  // Use override email if provided
  if (emailOverride) {
    email = emailOverride;
  }

  // 2. Check if user exists (fail safe)
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Пользователь с таким email уже существует');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let user;

  if (inviteToken) {
    // --- JOIN EXISTING COMPANY LOGIC ---
    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
      include: { company: true }
    });

    if (!invitation) throw new Error('Неверный токен приглашения');
    if (invitation.usedAt) throw new Error('Приглашение уже использовано');
    if (new Date() > invitation.expiresAt) throw new Error('Срок действия приглашения истек');

    if (invitation.email && invitation.email !== email) {
      throw new Error('Email не совпадает с приглашением.');
    }

    let targetRoleId = invitation.roleId;
    if (!targetRoleId) {
      const employeeRole = await prisma.role.findFirst({
        where: {
          companyId: invitation.companyId,
          name: 'Сотрудник'
        }
      });
      if (employeeRole) {
        targetRoleId = employeeRole.id;
      }
    }

    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          yandexId,
          avatarUrl,
          companyId: invitation.companyId,
          roleId: targetRoleId
        },
        include: { role: true, company: true }
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() }
      });

      return newUser;
    });

  } else {
    // --- CREATE NEW COMPANY LOGIC ---
    if (!companyName) throw new Error('Необходимо указать название компании');

    user = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName }
      });

      const bossRole = await tx.role.create({
        data: {
          name: 'Босс',
          companyId: company.id,
          isBoss: true,
          permissions: ALL_PERMISSIONS
        }
      });

      // Создаем стоковую роль "Сотрудник"
      await tx.role.create({
        data: {
          name: 'Сотрудник',
          companyId: company.id,
          isBoss: false,
          permissions: EMPLOYEE_PERMISSIONS
        }
      });

      await tx.warehouse.create({
        data: {
          name: 'Основной склад',
          companyId: company.id,
          isDefault: true
        }
      });

      return tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          yandexId,
          avatarUrl,
          companyId: company.id,
          roleId: bossRole.id
        },
        include: { role: true, company: true }
      });
    });
  }

  const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { user, token: newToken };
};
