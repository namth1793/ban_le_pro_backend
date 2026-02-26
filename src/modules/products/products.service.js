const prisma = require('../../config/database');

class ProductsService {
  async create(data, shopId) {
    const product = await prisma.product.create({
      data: {
        ...data,
        shopId,
        code: data.code || `SP${Date.now()}`
      }
    });
    return product;
  }

  async getAll(shopId, query = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      lowStock,
      expiring
    } = query;

    const where = {
      shopId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } }
        ]
      })
    };

    if (lowStock === 'true') {
      where.stock = { lte: prisma.product.fields.lowStockThreshold };
    }

    if (expiring === 'true') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      where.expiryDate = { lte: thirtyDays, gte: new Date() };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id, shopId) {
    return await prisma.product.findFirst({
      where: { id, shopId, deletedAt: null }
    });
  }

  async update(id, shopId, data) {
    return await prisma.product.update({
      where: { id },
      data
    });
  }

  async delete(id, shopId) {
    const product = await this.getById(id, shopId);
    if (!product) return null;

    const orderCount = await prisma.orderItem.count({
      where: { productId: id }
    });

    if (orderCount > 0) {
      return await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    } else {
      return await prisma.product.delete({ where: { id } });
    }
  }

  async getLowStock(shopId) {
    const products = await prisma.product.findMany({
      where: { shopId, deletedAt: null, isActive: true },
      orderBy: { stock: 'asc' }
    });
    return products.filter(p => p.stock <= p.lowStockThreshold);
  }

  async getExpiring(shopId, days = 90) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + parseInt(days));

    return await prisma.product.findMany({
      where: {
        shopId,
        deletedAt: null,
        isActive: true,
        expiryDate: { not: null, gte: now, lte: future }
      },
      orderBy: { expiryDate: 'asc' }
    });
  }
}

module.exports = new ProductsService();