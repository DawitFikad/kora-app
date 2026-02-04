// Absolute minimal test - zero dependencies
module.exports = (req, res) => {
    res.status(200).json({ test: "ok", time: Date.now() });
};
