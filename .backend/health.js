"use strict";
// Minimal health check with zero dependencies
module.exports = (req, res) => {
    res.status(200).json({
        status: "alive",
        timestamp: new Date().toISOString(),
        message: "Minimal function works"
    });
};
