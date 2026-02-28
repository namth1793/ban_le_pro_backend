const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

class AuthService {
  async register(data) {
    const { email, password, fullName, phone, shopName } = data;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone
        }
      });
      
      const shop = await prisma.shop.create({
        data: {
          name: shopName,
          code: `SHOP${Date.now()}`,
          subscription: {
            create: {
              planType: 'FREE',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      });
      
      await prisma.userShop.create({
        data: {
          userId: user.id,
          shopId: shop.id,
          role: 'OWNER'
        }
      });
      
      const token = this.generateToken(user.id, shop.id);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        },
        shop: {
          id: shop.id,
          name: shop.name
        },
        token
      };
    });
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userShops: {
          include: { shop: true }
        }
      }
    });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const shop = user.userShops[0]?.shop;
    if (!shop || shop.status !== 'ACTIVE') {
      throw new AppError('Cửa hàng không hoạt động', 403);
    }
    
    const token = this.generateToken(user.id, shop.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.userShops[0].role
      },
      shop: {
        id: shop.id,
        name: shop.name
      },
      token
    };
  }

  generateToken(userId, shopId) {
    return jwt.sign(
      { userId, shopId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Mật khẩu hiện tại không đúng', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }
}

module.exports = new AuthService();