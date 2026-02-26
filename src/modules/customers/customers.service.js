const prisma = require('../../config/database');

function computeTier(totalSpent) {
  if (totalSpent >= 50_000_000) return 'DIAMOND';
  if (totalSpent >= 20_000_000) return 'GOLD';
  if (totalSpent >= 5_000_000)  return 'SILVER';
  return 'BRONZE';
}

class CustomersService {
  async create(data, shopId) {
    return await prisma.customer.create({
      data: {
        ...data,
        shopId,
        code: data.code || `KH${Date.now()}`,
        loyaltyPoints: 0,
        totalSpent: 0
      }
    });
  }

  async getAll(shopId, query = {}) {
    const { page = 1, limit = 20, search = '' } = query;

    const where = {
      shopId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } }
        ]
      })
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { orders: true } }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    return {
      customers: customers.map(c => ({ ...c, tier: computeTier(c.totalSpent) })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id, shopId) {
    const customer = await prisma.customer.findFirst({
      where: { id, shopId, deletedAt: null },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!customer) return null;
    return { ...customer, tier: computeTier(customer.totalSpent) };
  }

  async update(id, shopId, data) {
    return await prisma.customer.update({
      where: { id },
      data
    });
  }

  async addPoints(id, shopId, points) {
    return await prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: { increment: points } }
    });
  }
}

module.exports = new CustomersService();
