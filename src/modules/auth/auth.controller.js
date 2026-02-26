const authService = require('./auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      await authService.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();