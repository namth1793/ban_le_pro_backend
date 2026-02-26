const usersService = require('./users.service');

class UsersController {
  async updateProfile(req, res, next) {
    try {
      const { id } = req.params;
      // Only allow users to update their own profile
      if (id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const user = await usersService.updateProfile(id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();
