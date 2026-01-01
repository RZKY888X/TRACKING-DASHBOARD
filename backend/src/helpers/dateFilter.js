function buildDateFilter(dateType, dateValue) {
    if (!dateType || !dateValue) return {};
  
    let startDate, endDate;
  
    switch (dateType) {
      case "current":
        return {};
  
      case "daily": {
        const dailyDate = new Date(dateValue);
        startDate = new Date(dailyDate.setHours(0, 0, 0, 0));
        endDate = new Date(dailyDate.setHours(23, 59, 59, 999));
        return { startTime: { gte: startDate, lte: endDate } };
      }
  
      case "weekly": {
        if (!dateValue.includes("Week")) return {};
        const [yearMonth, weekStr] = dateValue.split(" Week ");
        const [year, month] = yearMonth.split("-").map(Number);
        const week = parseInt(weekStr);
  
        startDate = new Date(year, month - 1, (week - 1) * 7 + 1, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, week * 7, 23, 59, 59, 999);
  
        return { startTime: { gte: startDate, lte: endDate } };
      }
  
      case "monthly": {
        const [year, month] = dateValue.split("-").map(Number);
        startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
        return { startTime: { gte: startDate, lte: endDate } };
      }
  
      default:
        return {};
    }
  }
  
  module.exports = { buildDateFilter };
  