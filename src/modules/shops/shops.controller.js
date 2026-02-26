const shopsService = require('./shops.service');

class ShopsController {
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      // Ensure the user can only access their own shop
      if (id !== req.shopId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const shop = await shopsService.getById(id);
      if (!shop) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng' });
      }
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      if (id !== req.shopId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const shop = await shopsService.update(id, req.body);
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShopsController();
