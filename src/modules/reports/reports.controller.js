const reportsService = require('./reports.service');

class ReportsController {
  async getDaily(req, res, next) {
    try {
      const { date } = req.query;
      const report = await reportsService.getDaily(req.shopId, date || new Date());
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getMonthly(req, res, next) {
    try {
      const { year, month } = req.query;
      const report = await reportsService.getMonthly(
        req.shopId, 
        parseInt(year) || new Date().getFullYear(),
        parseInt(month) || new Date().getMonth() + 1
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getBestSellers(req, res, next) {
    try {
      const { startDate, endDate, limit } = req.query;
      const report = await reportsService.getBestSellers(req.shopId, {
        startDate: startDate || new Date(new Date().setDate(1)),
        endDate: endDate || new Date(),
        limit: parseInt(limit) || 10
      });
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req, res, next) {
    try {
      const report = await reportsService.getInventory(req.shopId);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportsController();