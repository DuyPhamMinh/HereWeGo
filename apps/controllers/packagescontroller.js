var express = require("express");
var router = express.Router();
var Tour = require(__dirname + "/../model/Tour");

router.get("/", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    // Build query
    let query = { isActive: true };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    
    // Get total count
    const totalTours = await Tour.countDocuments(query);
    
    // Get tours with pagination
    const tours = await Tour.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const totalPages = Math.ceil(totalTours / limit);
    
    // Get all categories for filter
    const categories = await Tour.distinct('category', { isActive: true });
    
    res.render("packages.ejs", {
      tours: tours,
      currentPage: page,
      totalPages: totalPages,
      totalTours: totalTours,
      search: search,
      category: category,
      categories: categories
    });
  } catch (error) {
    console.error("Error loading tours:", error);
    res.render("packages.ejs", {
      tours: [],
      currentPage: 1,
      totalPages: 0,
      totalTours: 0,
      search: '',
      category: '',
      categories: []
    });
  }
});
module.exports = router;

