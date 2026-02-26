const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');

class StaffService {
  async getAll(shopId) {
    const staff = await prisma.staff.findMany({
      where: { 
        shopId,
        leftAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    return staff;
  }

  async getAvailableUsers(shopId) {
    // Lấy danh sách user đã là staff của shop này
    const existingStaff = await prisma.staff.findMany({
      where: { shopId },
      select: { userId: true }
    });
    
    const existingUserIds = existingStaff.map(s => s.userId);
    
    // Thêm chủ shop vào danh sách không được chọn
    const shopOwners = await prisma.userShop.findMany({
      where: { 
        shopId, 
        role: 'OWNER' 
      },
      select: { userId: true }
    });
    
    const ownerIds = shopOwners.map(o => o.userId);
    const excludedIds = [...existingUserIds, ...ownerIds];

    // Lấy users chưa là staff và không phải chủ shop
    const availableUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: {
          id: { in: excludedIds }
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    return availableUsers;
  }

  async create(shopId, userId, role) {
    // Kiểm tra user đã tồn tại
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    // Kiểm tra đã là staff chưa
    const existingStaff = await prisma.staff.findFirst({
      where: {
        shopId,
        userId
      }
    });

    if (existingStaff) {
      throw new AppError('Người dùng đã là nhân viên của cửa hàng', 400);
    }

    // Kiểm tra giới hạn nhân viên theo gói dịch vụ
    const shop = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    const staffCount = await prisma.staff.count({
      where: { 
        shopId,
        leftAt: null
      }
    });

    if (staffCount >= shop.maxStaff) {
      throw new AppError('Đã đạt giới hạn số lượng nhân viên. Vui lòng nâng cấp gói dịch vụ.', 400);
    }

    // Tạo staff mới
    const staff = await prisma.$transaction(async (prisma) => {
      // Tạo staff record
      const newStaff = await prisma.staff.create({
        data: {
          userId,
          shopId,
          role,
          permissions: this.getDefaultPermissions(role)
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // Tạo user_shop link
      await prisma.userShop.create({
        data: {
          userId,
          shopId,
          role: 'STAFF'
        }
      });

      return newStaff;
    });

    return staff;
  }

  async update(id, shopId, updateData) {
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        shopId,
        leftAt: null
      }
    });

    if (!staff) {
      throw new AppError('Không tìm thấy nhân viên', 404);
    }

    // Không cho phép sửa userId
    const { userId, ...data } = updateData;

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        role: data.role,
        isActive: data.isActive,
        permissions: data.permissions || staff.permissions
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return updatedStaff;
  }

  async delete(id, shopId) {
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        shopId,
        leftAt: null
      }
    });

    if (!staff) {
      throw new AppError('Không tìm thấy nhân viên', 404);
    }

    // Soft delete
    await prisma.$transaction([
      prisma.staff.update({
        where: { id },
        data: { leftAt: new Date() }
      }),
      prisma.userShop.delete({
        where: {
          userId_shopId: {
            userId: staff.userId,
            shopId
          }
        }
      })
    ]);
  }

  getDefaultPermissions(role) {
    const permissions = {
      MANAGER: [
        'view_products',
        'create_products',
        'edit_products',
        'delete_products',
        'view_orders',
        'create_orders',
        'edit_orders',
        'view_customers',
        'create_customers',
        'edit_customers',
        'view_reports'
      ],
      SALES: [
        'view_products',
        'view_orders',
        'create_orders',
        'view_customers',
        'create_customers'
      ],
      INVENTORY: [
        'view_products',
        'create_products',
        'edit_products',
        'view_orders'
      ],
      ACCOUNTING: [
        'view_orders',
        'view_reports'
      ]
    };

    return permissions[role] || permissions.SALES;
  }
}

module.exports = new StaffService();