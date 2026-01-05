class User {
    _id;
    firstName;
    lastName;
    email;
    phone;
    birthDate;
    password;
    newsletter;
    role;
    isActive;
    createdAt;
    updatedAt;

    constructor() {
        this.role = "user";
        this.isActive = true;
        this.newsletter = false;
    }
}

module.exports = User;

