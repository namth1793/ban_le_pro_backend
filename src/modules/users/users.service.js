const prisma = require('../../config/database');

class UsersService {
  async updateProfile(userId, data) {
    const { fullName, phone } = data;
    return await prisma.user.update({
      where: { id: userId },
      data: { fullName, phone },
      select: { id: true, email: true, fullName: true, phone: true }
    });
  }
}

module.exports = new UsersService();
