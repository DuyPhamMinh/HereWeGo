const User = require(__dirname + "/../model/User");

async function ensureDefaultAdmin() {
  try {

    const existingAdmin = await User.findOne({ role: "admin" });

    if (!existingAdmin) {

      const defaultAdmin = new User({
        firstName: "Admin",
        lastName: "Support",
        email: "admin@herewego.com",
        password: "admin123456",
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

