// health.js - Minimal health check (plain JavaScript)
module.exports = (req, res) => {
    res.status(200).json({
        status: "alive",
        timestamp: new Date().toISOString(),
        message: "Minimal function works"
    });
};
