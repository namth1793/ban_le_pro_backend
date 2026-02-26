const subscriptionService = require('./subscription.service');

class SubscriptionController {
  async getCurrent(req, res, next) {
    try {
      const sub = await subscriptionService.getCurrent(req.shopId);
      if (!sub) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy gói dịch vụ' });
      }
      res.json({ success: true, data: sub });
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const invoices = await subscriptionService.getInvoices(req.shopId);
      res.json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  }

  async upgrade(req, res, next) {
    try {
      const { planType } = req.body;
      const sub = await subscriptionService.upgrade(req.shopId, planType);
      res.json({ success: true, data: sub, message: 'Nâng cấp gói dịch vụ thành công' });
    } catch (error) {
      next(error);
    }
  }

  async renew(req, res, next) {
    try {
      const sub = await subscriptionService.renew(req.shopId);
      res.json({ success: true, data: sub, message: 'Gia hạn gói dịch vụ thành công' });
    } catch (error) {
      next(error);
    }
  }

  async setAutoRenew(req, res, next) {
    try {
      const { autoRenew } = req.body;
      const result = await subscriptionService.setAutoRenew(req.shopId, autoRenew);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();
