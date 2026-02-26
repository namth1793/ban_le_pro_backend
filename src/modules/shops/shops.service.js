const prisma = require('../../config/database');

class ShopsService {
  async getById(shopId) {
    return await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        businessType: true,
        address: true,
        phone: true,
        email: true,
        taxCode: true,
        maxProducts: true,
        maxStaff: true,
        createdAt: true
      }
    });
  }

  async update(shopId, data) {
    const { name, businessType, address, phone, email, taxCode } = data;
    return await prisma.shop.update({
      where: { id: shopId },
      data: { name, businessType, address, phone, email, taxCode },
      select: {
        id: true,
        name: true,
        businessType: true,
        address: true,
        phone: true,
        email: true,
        taxCode: true
      }
    });
  }
}

module.exports = new ShopsService();
