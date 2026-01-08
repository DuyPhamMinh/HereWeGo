const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",

    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Tour is required"],
    },

    guestName: {
      type: String,
      trim: true,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guestPhone: {
      type: String,
      trim: true,
    },

    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    numberOfPersons: {
      type: Number,
      required: [true, "Number of persons is required"],
      min: [1, "At least 1 person is required"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    specialRequest: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "online", "vnpay"],
    },

    vnpayTransactionId: {
      type: String,
      trim: true,
    },
    vnpayTxnRef: {
      type: String,
      trim: true,
    },
    vnpayAmount: {
      type: Number,
    },
    vnpayResponseCode: {
      type: String,
      trim: true,
    },
    vnpayTransactionNo: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ tour: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;

