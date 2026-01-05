var express = require("express");
var router = express.Router();
var TourService = require(global.__basedir + "/apps/Services/TourService");
var Tour = require(global.__basedir + "/apps/Entity/Tour");
var verifyToken = require(global.__basedir + "/apps/Util/VerifyToken");
var ObjectId = require('mongodb').ObjectId;

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
        
        const skip = (page - 1) * limit;
        const tourService = new TourService();
        const result = await tourService.getTourList(skip, limit, query);
        
        const totalPages = Math.ceil(result.total / limit);
        
        res.json({
            success: true,
            data: result.data,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: result.total,
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
        const tourService = new TourService();
        const tour = await tourService.getTour(req.params.id);
        
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
        
        // Create new tour entity
        const newTour = new Tour();
        newTour.title = title;
        newTour.description = description;
        newTour.shortDescription = shortDescription || description.substring(0, 150);
        newTour.destination = destination;
        newTour.duration = parseInt(duration);
        newTour.durationUnit = durationUnit || 'days';
        newTour.maxPersons = maxPersons ? parseInt(maxPersons) : 10;
        newTour.price = parseFloat(price);
        newTour.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
        newTour.image = image || "/static/img/packages-1.jpg";
        newTour.category = category || 'National';
        newTour.rating = rating ? parseFloat(rating) : 5;
        newTour.isActive = isActive !== false && isActive !== 'false';
        newTour.isFeatured = isFeatured === true || isFeatured === 'true';
        newTour.highlights = Array.isArray(highlights) ? highlights : (highlights ? highlights.split(',').map(h => h.trim()) : []);
        newTour.includes = Array.isArray(includes) ? includes : (includes ? includes.split(',').map(i => i.trim()) : []);
        newTour.excludes = Array.isArray(excludes) ? excludes : (excludes ? excludes.split(',').map(e => e.trim()) : []);
        newTour.itinerary = Array.isArray(itinerary) ? itinerary : [];
        
        const tourService = new TourService();
        const result = await tourService.insertTour(newTour);
        
        // Get the created tour
        const createdTour = await tourService.getTour(result.insertedId.toString());
        
        res.status(201).json({ 
            success: true, 
            message: "Tour created successfully",
            data: createdTour 
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
        
        const tourService = new TourService();
        const existingTour = await tourService.getTour(req.params.id);
        
        if (!existingTour) {
            return res.status(404).json({ 
                success: false,
                message: "Tour not found" 
            });
        }
        
        // Create tour entity with updated fields
        const updatedTour = new Tour();
        updatedTour._id = req.params.id;
        if (title) updatedTour.title = title;
        if (description) updatedTour.description = description;
        if (shortDescription !== undefined) updatedTour.shortDescription = shortDescription;
        if (destination) updatedTour.destination = destination;
        if (duration) updatedTour.duration = parseInt(duration);
        if (durationUnit) updatedTour.durationUnit = durationUnit;
        if (maxPersons) updatedTour.maxPersons = parseInt(maxPersons);
        if (price) updatedTour.price = parseFloat(price);
        if (discountPrice !== undefined) updatedTour.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined;
        if (image) updatedTour.image = image;
        if (category) updatedTour.category = category;
        if (rating) updatedTour.rating = parseFloat(rating);
        if (isActive !== undefined) updatedTour.isActive = isActive !== false && isActive !== 'false';
        if (isFeatured !== undefined) updatedTour.isFeatured = isFeatured === true || isFeatured === 'true';
        if (highlights !== undefined) {
            updatedTour.highlights = Array.isArray(highlights) ? highlights : (highlights ? highlights.split(',').map(h => h.trim()) : []);
        }
        if (includes !== undefined) {
            updatedTour.includes = Array.isArray(includes) ? includes : (includes ? includes.split(',').map(i => i.trim()) : []);
        }
        if (excludes !== undefined) {
            updatedTour.excludes = Array.isArray(excludes) ? excludes : (excludes ? excludes.split(',').map(e => e.trim()) : []);
        }
        if (itinerary !== undefined) {
            updatedTour.itinerary = Array.isArray(itinerary) ? itinerary : [];
        }
        
        // Merge with existing data
        Object.keys(existingTour).forEach(key => {
            if (updatedTour[key] === undefined && existingTour[key] !== undefined) {
                updatedTour[key] = existingTour[key];
            }
        });
        
        await tourService.updateTour(updatedTour);
        
        // Get updated tour
        const result = await tourService.getTour(req.params.id);
        
        res.json({ 
            success: true, 
            message: "Tour updated successfully",
            data: result 
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
        
        const tourService = new TourService();
        const existingTour = await tourService.getTour(req.params.id);
        
        if (!existingTour) {
            return res.status(404).json({ 
                success: false,
                message: "Tour not found" 
            });
        }
        
        await tourService.deleteTour(req.params.id);
        
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
