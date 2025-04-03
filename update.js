const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed

mongoose.connect('mongodb://localhost:27017/car_customization', { useNewUrlParser: true, useUnifiedTopology: true });

async function updateUsers() {
    try {
        const result = await User.updateMany(
            { phone: { $exists: false } },
            { $set: { phone: "0000000000" } } // Change this if needed
        );
        console.log(`${result.modifiedCount} users updated`);
        mongoose.connection.close();
    } catch (error) {
        console.error('Error updating users:', error);
    }
}

updateUsers();