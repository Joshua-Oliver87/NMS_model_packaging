module.exports = (req, res, next) => {
    req.unit = req.headers["favorite-unit"] || "Metric";
    next();
};