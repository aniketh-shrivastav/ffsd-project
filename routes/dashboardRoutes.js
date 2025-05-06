const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types; // Import ObjectId properly
const ServiceBooking = require('../models/serviceBooking');
const User = require('../models/User');

router.get('/dashboardService', async (req, res) => {
    try {
        if (!req.session?.user?.id) {
            return res.redirect('/login');
        }

        const providerId = new ObjectId(req.session.user.id); // Create new ObjectId instance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Fetch provider data
        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'service-provider') {
            return res.redirect('/login');
        }

        // Dashboard statistics
        const todayEarnings = await ServiceBooking.aggregate([
            { 
                $match: { 
                    providerId: providerId, // Use the ObjectId directly
                    status: 'Completed',
                    createdAt: { $gte: today }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]);

        const ongoingServices = await ServiceBooking.countDocuments({
            providerId: providerId,
            status: { $in: ['Open', 'Confirmed'] }
        });

        const completedServices = await ServiceBooking.countDocuments({
            providerId: providerId,
            status: 'Completed',
            createdAt: { $gte: oneWeekAgo }
        });

        const reviews = await ServiceBooking.aggregate([
            { 
                $match: { 
                    providerId: providerId,
                    rating: { $exists: true }
                }
            },
            { 
                $group: { 
                    _id: null, 
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                } 
            }
        ]);

        // Service distribution data
        const serviceDistribution = await ServiceBooking.aggregate([
            { $match: { providerId: providerId } },
            { $unwind: '$selectedServices' },
            { 
                $group: { 
                    _id: '$selectedServices',
                    count: { $sum: 1 }
                } 
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Weekly earnings data
        const earningsData = await ServiceBooking.aggregate([
            { 
                $match: { 
                    providerId: providerId,
                    status: 'Completed',
                    createdAt: { $gte: oneWeekAgo }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: '$totalCost' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Recent activities
        const recentActivities = await ServiceBooking.find({
            providerId: providerId
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('customerId', 'name');

        res.render('service/dashboardService', {
            provider,
            todayEarnings: todayEarnings[0]?.total || 0,
            ongoingServices,
            completedServices,
            avgRating: reviews[0]?.avgRating?.toFixed(1) || 0,
            reviewCount: reviews[0]?.count || 0,
            serviceDistribution,
            earningsData,
            recentActivities
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;