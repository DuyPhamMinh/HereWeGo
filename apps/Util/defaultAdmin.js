const User = require(__dirname + "/../model/User");

/**
 * Đảm bảo có admin user mặc định trong database
 * Tạo nếu chưa có
 */
async function ensureDefaultAdmin() {
  try {
    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await User.findOne({ role: "admin" });
    
    if (!existingAdmin) {
      // Tạo admin mặc định
      const defaultAdmin = new User({
        firstName: "Admin",
        lastName: "Support",
        email: "admin@herewego.com",
        password: "admin123456", // Password mặc định, nên đổi sau
        role: "admin",
        isActive: true,
      });

      await defaultAdmin.save();
      console.log("Default admin user created: admin@herewego.com");
      console.log("Default password: admin123456 (Please change this!)");
      return defaultAdmin;
    }

    return existingAdmin;
  } catch (error) {
    console.error("Error ensuring default admin:", error);
    throw error;
  }
}

module.exports = { ensureDefaultAdmin };


