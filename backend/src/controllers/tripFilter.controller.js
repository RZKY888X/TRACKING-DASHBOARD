const service = require("../services/tripFilter.service");

const getCascadeOptions = async (req, res) => {
  try {
    const data = await service.getCascadeOptions(req.query);
    res.json({
      success: true,
      drivers: data.drivers,
      origins: data.origins,
      destinations: data.destinations
    });
  } catch (err) {
    console.error("Cascade error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      drivers: [],
      origins: [],
      destinations: []
    });
  }
};

const filterTrips = async (req, res) => {
  try {
    const trips = await service.filterTrips(req.query);
    res.json({
      success: true,
      trips,
      count: trips.length
    });
  } catch (err) {
    console.error("Filter trips error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      trips: [],
      count: 0
    });
  }
};

module.exports = {
  getCascadeOptions,
  filterTrips
};
