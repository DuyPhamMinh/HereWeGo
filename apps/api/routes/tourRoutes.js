var express = require("express");
var router = express.Router();
var Tour = require(global.__basedir + "/apps/model/Tour");
var verifyToken = require(global.__basedir + "/apps/Util/VerifyToken");

// Public routes - Get all active tours
router.get("/", async function (req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const featured = req.query.featured === 'true';
        
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
        if (featured) {
            query.isFeatured = true;
        }
        
        // Get total count
        const totalTours = await Tour.countDocuments(query);
        
        // Get tours with pagination
        const tours = await Tour.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        
        const totalPages = Math.ceil(totalTours / limit);
        
        res.json({
            success: true,
            data: tours,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalTours,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Error fetching tours:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching tours",
            error: error.message 
        });
    }
});

// Public route - Get single tour by ID
router.get("/:id", async function (req, res) {
    try {
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ 
                success: false,
                message: "Tour not found" 
            });
        }
        
        // Check if tour is active (unless admin)
        if (!tour.isActive) {
            return res.status(404).json({ 
                success: false,
                message: "Tour not found" 
            });
        }
        
        res.json({
            success: true,
            data: tour
        });
    } catch (error) {
        console.error("Error fetching tour:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching tour",
            error: error.message 
        });
    }
});

// Protected routes - Admin only
router.use(verifyToken);

// Create tour (Admin only)
router.post("/", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        const { 
            title, description, shortDescription, destination, duration, durationUnit,
            maxPersons, price, discountPrice, image, category, rating, isActive, 
            isFeatured, highlights, includes, excludes, itinerary 
        } = req.body;
        
        // Validation
        if (!title || !description || !destination || !duration || !price) {
            return res.status(400).json({ 
                success: false,
                message: "Title, description, destination, duration, and price are required" 
            });
        }
        
        // Create new tour
        const newTour = new Tour({
            title,
            description,
            shortDescription: shortDescription || description.substring(0, 150),
            destination,
            duration: parseInt(duration),
            durationUnit: durationUnit || 'days',
            maxPersons: maxPersons ? parseInt(maxPersons) : 10,
            price: parseFloat(price),
            discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
            image: image || "/static/img/packages-1.jpg",
            category: category || 'National',
            rating: rating ? parseFloat(rating) : 5,
            isActive: isActive !== false && isActive !== 'false',
            isFeatured: isFeatured === true || isFeatured === 'true',
            highlights: Array.isArray(highlights) ? highlights : (highlights ? highlights.split(',').map(h => h.trim()) : []),
            includes: Array.isArray(includes) ? includes : (includes ? includes.split(',').map(i => i.trim()) : []),
            excludes: Array.isArray(excludes) ? excludes : (excludes ? excludes.split(',').map(e => e.trim()) : []),
            itinerary: Array.isArray(itinerary) ? itinerary : []
        });
        
        await newTour.save();
        
        res.status(201).json({ 
            success: true, 
            message: "Tour created successfully",
            data: newTour 
        });
    } catch (error) {
        console.error("Error creating tour:", error);
        res.status(500).json({ 
            success: false,
            message: "Error creating tour",
            error: error.message 
        });
    }
});

// Update tour (Admin only)
router.put("/:id", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        const { 
            title, description, shortDescription, destination, duration, durationUnit,
            maxPersons, price, discountPrice, image, category, rating, isActive, 
            isFeatured, highlights, includes, excludes, itinerary 
        } = req.body;
        
        const tour = await Tour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ 
                success: false,
                message: "Tour not found" 
            });
        }
        
        // Update fields
        if (title) tour.title = title;
        if (description) tour.description = description;
        if (shortDescription !== undefined) tour.shortDescription = shortDescription;
        if (destination) tour.destination = destination;
        if (duration) tour.duration = parseInt(duration);
        if (durationUnit) tour.durationUnit = durationUnit;
        if (maxPersons) tour.maxPersons = parseInt(maxPersons);
        if (price) tour.price = parseFloat(price);
        if (discountPrice !== undefined) tour.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
        if (image) tour.image = image;
        if (category) tour.category = category;
        if (rating) tour.rating = parseFloat(rating);
        if (isActive !== undefined) tour.isActive = isActive !== false && isActive !== 'false';
        if (isFeatured !== undefined) tour.isFeatured = isFeatured === true || isFeatured === 'true';
        if (highlights !== undefined) {
            tour.highlights = Array.isArray(highlights) ? highlights : (highlights ? highlights.split(',').map(h => h.trim()) : []);
        }
        if (includes !== undefined) {
            tour.includes = Array.isArray(includes) ? includes : (includes ? includes.split(',').map(i => i.trim()) : []);
        }
        if (excludes !== undefined) {
            tour.excludes = Array.isArray(excludes) ? excludes : (excludes ? excludes.split(',').map(e => e.trim()) : []);
        }
        if (itinerary !== undefined) {
            tour.itinerary = Array.isArray(itinerary) ? itinerary : [];
        }
        
        await tour.save();
        
        res.json({ 
            success: true, 
            message: "Tour updated successfully",
            data: tour 
        });
    } catch (error) {
        console.error("Error updating tour:", error);
        res.status(500).json({ 
            success: false,
            message: "Error updating tour",
            error: error.message 
        });
    }
});

// Delete tour (Admin only)
router.delete("/:id", async function (req, res) {
    try {
        // Check if user has admin role
        if (!req.userData.roles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: "Access denied. Admin privileges required." 
            });
        }
        
        const tour = await Tour.findByIdAndDelete(req.params.id);
        if (!tour) {
            return res.status(404).json({ 
                success: false,
                message: "Tour not found" 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Tour deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting tour:", error);
        res.status(500).json({ 
            success: false,
            message: "Error deleting tour",
            error: error.message 
        });
    }
});

module.exports = router;
