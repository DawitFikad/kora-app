module.exports = (req, res) => {
    res.status(200).json({
        message: "Plain JS Debug Endpoint",
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_DB: !!process.env.DATABASE_URL
        }
    });
};
