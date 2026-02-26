const prisma = require('../../config/database');

class ReportsService {
  async getDaily(shopId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end },
        orderStatus: 'COMPLETED'
      }
    });

    const total = orders.reduce((sum, o) => sum + o.finalAmount, 0);

    return {
      date,
      totalOrders: orders.length,
      totalRevenue: total,
      averageOrderValue: orders.length ? total / orders.length : 0
    };
  }

  async getMonthly(shopId, year, month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end },
        orderStatus: 'COMPLETED'
      },
      include: {
        items: { include: { product: true } },
        customer: true
      }
    });

    const total = orders.reduce((sum, o) => sum + o.finalAmount, 0);

    // Daily breakdown
    const dailyMap = {};
    for (const order of orders) {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, orders: 0, revenue: 0 };
      }
      dailyMap[dateStr].orders++;
      dailyMap[dateStr].revenue += order.finalAmount;
    }
    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Category breakdown
    const categoryMap = {};
    for (const order of orders) {
      for (const item of order.items) {
        const cat = item.product?.category || 'Khác';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, orders: 0, itemsSold: 0, revenue: 0 };
        }
        categoryMap[cat].orders++;
        categoryMap[cat].itemsSold += item.quantity;
        categoryMap[cat].revenue += item.subtotal;
      }
    }
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    // Top customers
    const customerMap = {};
    for (const order of orders) {
      if (!order.customerId) continue;
      if (!customerMap[order.customerId]) {
        customerMap[order.customerId] = {
          id: order.customerId,
          name: order.customer?.name || '',
          phone: order.customer?.phone || '',
          orders: 0,
          totalSpent: 0
        };
      }
      customerMap[order.customerId].orders++;
      customerMap[order.customerId].totalSpent += order.finalAmount;
    }
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      period: `${month}/${year}`,
      totalOrders: orders.length,
      totalRevenue: total,
      dailyBreakdown,
      categoryBreakdown,
      topCustomers
    };
  }

  async getBestSellers(shopId, { startDate, endDate, limit = 10 }) {
    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          shopId,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          },
          orderStatus: 'COMPLETED'
        }
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit
    });

    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } }
    });

    return items.map((item, index) => ({
      rank: index + 1,
      product: products.find(p => p.id === item.productId),
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: item._sum.subtotal || 0
    }));
  }

  async getInventory(shopId) {
    const products = await prisma.product.findMany({
      where: { shopId, deletedAt: null, isActive: true }
    });

    const categoryMap = {};
    for (const p of products) {
      const cat = p.category || 'Khác';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, productCount: 0, totalStock: 0, inventoryValue: 0 };
      }
      categoryMap[cat].productCount++;
      categoryMap[cat].totalStock += p.stock;
      categoryMap[cat].inventoryValue += p.stock * p.price;
    }

    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.inventoryValue - a.inventoryValue);
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);

    return { totalProducts, totalStock, totalValue, categoryBreakdown };
  }
}

module.exports = new ReportsService();
