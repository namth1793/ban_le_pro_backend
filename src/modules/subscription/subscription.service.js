const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const PLAN_NAMES = { FREE: 'Dùng thử', BASIC: 'Cơ Bản', PREMIUM: 'Nâng Cao' };
const PLAN_PRICES = { FREE: 0, BASIC: 199000, PREMIUM: 399000 };

function getPaymentConfig() {
  return {
    bankId: process.env.PAYMENT_BANK_ID || '970422',
    accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || '1234567890',
    accountName: process.env.PAYMENT_ACCOUNT_NAME || 'CONG TY BAN LE PRO',
    momoNumber: process.env.PAYMENT_MOMO_NUMBER || '0901234567',
    momoName: process.env.PAYMENT_MOMO_NAME || 'BAN LE PRO'
  };
}

function buildVietQrUrl(bankId, accountNumber, accountName, amount, addInfo) {
  const base = `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName
  });
  return `${base}?${params.toString()}`;
}

class SubscriptionService {
  async getCurrent(shopId) {
    const sub = await prisma.subscription.findUnique({
      where: { shopId }
    });

    if (!sub) {
      return null;
    }

    return {
      id: sub.id,
      planType: sub.planType,
      planName: PLAN_NAMES[sub.planType] || sub.planType,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
      status: sub.status,
      autoRenew: sub.autoRenew,
      price: PLAN_PRICES[sub.planType] || 0
    };
  }

  async getInvoices(shopId) {
    return [];
  }

  async upgrade(shopId, planType) {
    const validPlans = ['FREE', 'BASIC', 'PREMIUM'];
    if (!validPlans.includes(planType)) {
      throw new AppError('Gói dịch vụ không hợp lệ', 400);
    }

    // FREE plan: activate immediately
    if (planType === 'FREE') {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const sub = await prisma.subscription.upsert({
        where: { shopId },
        update: { planType, startedAt: now, expiresAt, status: 'ACTIVE' },
        create: { shopId, planType, startedAt: now, expiresAt, status: 'ACTIVE' }
      });

      return {
        id: sub.id,
        planType: sub.planType,
        planName: PLAN_NAMES[sub.planType],
        expiresAt: sub.expiresAt,
        status: sub.status
      };
    }

    // Paid plans: return payment info (don't activate yet)
    const price = PLAN_PRICES[planType];
    const cfg = getPaymentConfig();
    const addInfo = `Nang cap ${PLAN_NAMES[planType]} - Shop ${shopId}`;

    return {
      requiresPayment: true,
      planType,
      planName: PLAN_NAMES[planType],
      price,
      payment: {
        bankId: cfg.bankId,
        accountNumber: cfg.accountNumber,
        accountName: cfg.accountName,
        momoNumber: cfg.momoNumber,
        momoName: cfg.momoName,
        amount: price,
        addInfo,
        qrUrl: buildVietQrUrl(cfg.bankId, cfg.accountNumber, cfg.accountName, price, addInfo)
      }
    };
  }

  async renew(shopId) {
    const sub = await prisma.subscription.findUnique({ where: { shopId } });
    if (!sub) throw new AppError('Không tìm thấy gói dịch vụ', 404);

    // FREE plan: renew immediately
    if (sub.planType === 'FREE') {
      const base = sub.expiresAt > new Date() ? sub.expiresAt : new Date();
      const newExpiry = new Date(base);
      newExpiry.setDate(newExpiry.getDate() + 30);

      const updated = await prisma.subscription.update({
        where: { shopId },
        data: { expiresAt: newExpiry, status: 'ACTIVE' }
      });

      return {
        id: updated.id,
        planType: updated.planType,
        planName: PLAN_NAMES[updated.planType],
        expiresAt: updated.expiresAt,
        status: updated.status
      };
    }

    // Paid plans: return payment info
    const price = PLAN_PRICES[sub.planType];
    const cfg = getPaymentConfig();
    const addInfo = `Gia han ${PLAN_NAMES[sub.planType]} - Shop ${shopId}`;

    return {
      requiresPayment: true,
      planType: sub.planType,
      planName: PLAN_NAMES[sub.planType],
      price,
      payment: {
        bankId: cfg.bankId,
        accountNumber: cfg.accountNumber,
        accountName: cfg.accountName,
        momoNumber: cfg.momoNumber,
        momoName: cfg.momoName,
        amount: price,
        addInfo,
        qrUrl: buildVietQrUrl(cfg.bankId, cfg.accountNumber, cfg.accountName, price, addInfo)
      }
    };
  }

  async confirmPayment(shopId, planType, action) {
    const validPlans = ['BASIC', 'PREMIUM'];
    if (!validPlans.includes(planType)) {
      throw new AppError('Gói dịch vụ không hợp lệ', 400);
    }

    const now = new Date();
    let expiresAt;

    if (action === 'renew') {
      const sub = await prisma.subscription.findUnique({ where: { shopId } });
      const base = sub && sub.expiresAt > now ? sub.expiresAt : now;
      expiresAt = new Date(base);
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const sub = await prisma.subscription.upsert({
      where: { shopId },
      update: { planType, startedAt: now, expiresAt, status: 'ACTIVE' },
      create: { shopId, planType, startedAt: now, expiresAt, status: 'ACTIVE' }
    });

    return {
      id: sub.id,
      planType: sub.planType,
      planName: PLAN_NAMES[sub.planType],
      expiresAt: sub.expiresAt,
      status: sub.status
    };
  }

  async setAutoRenew(shopId, autoRenew) {
    const updated = await prisma.subscription.update({
      where: { shopId },
      data: { autoRenew }
    });

    return { autoRenew: updated.autoRenew };
  }
}

module.exports = new SubscriptionService();
