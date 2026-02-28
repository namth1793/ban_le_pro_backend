const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

class OrdersService {
  async create(data, shopId, userId) {
    const { customerId, items, paymentMethod, discount = 0, note } = data;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, shopId }
      });

      if (!product || product.stock < item.quantity) {
        throw new AppError(`Sản phẩm không đủ hàng hoặc không tồn tại`, 400);
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal
      });
    }

    const finalAmount = totalAmount - discount;

    return await prisma.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD${Date.now()}`,
          totalAmount,
          discount,
          finalAmount,
          paymentMethod,
          note,
          shopId,
          customerId,
          createdById: userId,
          items: { create: orderItems }
        },
        include: { items: true, customer: true }
      });

      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      if (customerId) {
        const points = Math.floor(finalAmount / 1000) * 10;
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: { increment: finalAmount },
            loyaltyPoints: { increment: points }
          }
        });
      }

      return order;
    });
  }

  async getAll(shopId, query = {}) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status
    } = query;

    const where = {
      shopId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }),
      ...(status && { orderStatus: status })
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          customer: true
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id, shopId) {
    return await prisma.order.findFirst({
      where: { id, shopId },
      include: {
        items: { include: { product: true } },
        customer: true,
        createdBy: { select: { fullName: true } }
      }
    });
  }

  async updateStatus(id, shopId, status) {
    const order = await prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    return await prisma.order.update({
      where: { id },
      data: { orderStatus: status }
    });
  }

  async getTodayStats(shopId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        shopId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        orderStatus: 'COMPLETED'
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const byPaymentMethod = {};
    for (const order of orders) {
      if (!byPaymentMethod[order.paymentMethod]) {
        byPaymentMethod[order.paymentMethod] = { count: 0, total: 0 };
      }
      byPaymentMethod[order.paymentMethod].count++;
      byPaymentMethod[order.paymentMethod].total += order.finalAmount;
    }

    return { totalOrders, totalRevenue, averageOrderValue, byPaymentMethod };
  }
}

module.exports = new OrdersService();