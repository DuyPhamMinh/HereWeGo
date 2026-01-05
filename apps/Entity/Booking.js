class Booking {
    _id;
    user;
    tour;
    guestName;
    guestEmail;
    guestPhone;
    bookingDate;
    numberOfPersons;
    totalPrice;
    specialRequest;
    status;
    paymentStatus;
    paymentMethod;
    vnpayTransactionId;
    vnpayTxnRef;
    vnpayAmount;
    vnpayResponseCode;
    vnpayTransactionNo;
    notes;
    createdAt;
    updatedAt;

    constructor() {
        this.status = "pending";
        this.paymentStatus = "pending";
    }
}

module.exports = Booking;

