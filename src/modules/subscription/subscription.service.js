const prisma = require('../../config/database');

const PLAN_NAMES = { FREE: 'Dùng thử', BASIC: 'Cơ Bản', PREMIUM: 'Nâng Cao' };
const PLAN_PRICES = { FREE: 0, BASIC: 199000, PREMIUM: 399000 };

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
    // No Invoice model in schema yet — return empty array
    // In a full implementation this would query an Invoice table
    return [];
  }

  async upgrade(shopId, planType) {
    const validPlans = ['FREE', 'BASIC', 'PREMIUM'];
    if (!validPlans.includes(planType)) {
      throw new Error('Gói dịch vụ không hợp lệ');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const sub = await prisma.subscription.upsert({
      where: { shopId },
      update: {
        planType,
        startedAt: now,
        expiresAt,
        status: 'ACTIVE'
      },
      create: {
        shopId,
        planType,
        startedAt: now,
        expiresAt,
        status: 'ACTIVE'
      }
    });

    return {
      id: sub.id,
      planType: sub.planType,
      planName: PLAN_NAMES[sub.planType],
      expiresAt: sub.expiresAt,
      status: sub.status
    };
  }

  async renew(shopId) {
    const sub = await prisma.subscription.findUnique({ where: { shopId } });
    if (!sub) throw new Error('Không tìm thấy gói dịch vụ');

    // Extend from current expiry (or now if already expired)
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

  async setAutoRenew(shopId, autoRenew) {
    const updated = await prisma.subscription.update({
      where: { shopId },
      data: { autoRenew }
    });

    return { autoRenew: updated.autoRenew };
  }
}

module.exports = new SubscriptionService();
