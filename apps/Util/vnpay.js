const crypto = require("crypto");
const querystring = require("querystring");

// VNPay Sandbox Configuration
const vnpayConfig = {
  tmnCode: "WTTGO1NX", // Thay bằng TMN Code của bạn từ VNPay
  secretKey: "EZFJFTMHCNO89N1A7P4BR7WW7IOU64U9", // Thay bằng Secret Key của bạn từ VNPay
  vnpUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnpReturnUrl: "http://localhost:8080/booking/vnpay-return", // URL callback sau khi thanh toán
  vnpApi: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnpVersion: "2.1.0",
  vnpCommand: "pay",
  vnpCurrCode: "VND",
  vnpLocale: "vn",
  vnpOrderType: "other",
};

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} params - Thông tin thanh toán
 * @param {String} params.orderId - Mã đơn hàng (Booking ID)
 * @param {Number} params.amount - Số tiền thanh toán (VND)
 * @param {String} params.orderDescription - Mô tả đơn hàng
 * @param {String} params.orderType - Loại đơn hàng
 * @param {String} params.ipAddr - IP của khách hàng
 * @returns {String} URL thanh toán VNPay
 */
function createPaymentUrl(params) {
  const {
    orderId,
    amount,
    orderDescription = "Thanh toan don dat tour",
    orderType = "other",
    ipAddr = "127.0.0.1",
  } = params;

  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 phút

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = vnpayConfig.vnpVersion;
  vnp_Params["vnp_Command"] = vnpayConfig.vnpCommand;
  vnp_Params["vnp_TmnCode"] = vnpayConfig.tmnCode;
  vnp_Params["vnp_Locale"] = vnpayConfig.vnpLocale;
  vnp_Params["vnp_CurrCode"] = vnpayConfig.vnpCurrCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = orderDescription;
  vnp_Params["vnp_OrderType"] = orderType;
  vnp_Params["vnp_Amount"] = amount * 100; // VNPay yêu cầu số tiền nhân 100
  vnp_Params["vnp_ReturnUrl"] = vnpayConfig.vnpReturnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_ExpireDate"] = expireDate;

  // Sắp xếp các tham số theo thứ tự alphabet
  vnp_Params = sortObject(vnp_Params);

  // Tạo query string để ký
  const signData = createQueryString(vnp_Params);
  const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  // Tạo URL thanh toán
  const paymentUrl = vnpayConfig.vnpUrl + "?" + createQueryString(vnp_Params);

  return paymentUrl;
}

/**
 * Tạo query string từ object (theo format của VNPay)
 * VNPay yêu cầu encode URL nhưng không encode một số ký tự đặc biệt trong giá trị
 * @param {Object} obj - Object cần chuyển đổi
 * @returns {String} Query string
 */
function createQueryString(obj) {
  const sorted = sortObject(obj);
  const queryParts = [];
  for (const key in sorted) {
    if (sorted.hasOwnProperty(key)) {
      const value = sorted[key];
      if (value !== null && value !== undefined && value !== "") {
        // Encode giá trị, nhưng VNPay yêu cầu giữ nguyên một số ký tự
        let encodedValue = encodeURIComponent(String(value));
        // Giữ nguyên các ký tự đặc biệt theo yêu cầu VNPay
        encodedValue = encodedValue
          .replace(/%20/g, "+")
          .replace(/\*/g, "%2A")
          .replace(/\(/g, "%28")
          .replace(/\)/g, "%29");
        queryParts.push(`${key}=${encodedValue}`);
      }
    }
  }
  return queryParts.join("&");
}

/**
 * Xác thực chữ ký từ VNPay callback
 * @param {Object} vnp_Params - Các tham số từ VNPay callback
 * @returns {Boolean} true nếu chữ ký hợp lệ
 */
function verifyReturnUrl(vnp_Params) {
  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  // Sắp xếp các tham số
  const sortedParams = sortObject(vnp_Params);

  // Tạo query string để verify
  const signData = createQueryString(sortedParams);
  const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
}

/**
 * Sắp xếp object theo key
 * @param {Object} obj - Object cần sắp xếp
 * @returns {Object} Object đã sắp xếp
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = obj[keys[i]];
  }
  return sorted;
}

/**
 * Format date theo định dạng yyyyMMddHHmmss
 * @param {Date} date - Ngày cần format
 * @returns {String} Ngày đã format
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Lấy IP address từ request
 * @param {Object} req - Express request object
 * @returns {String} IP address
 */
function getIpAddress(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    "127.0.0.1"
  );
}

/**
 * Chuyển đổi USD sang VND (tỷ giá mặc định 1 USD = 24,000 VND)
 * @param {Number} usdAmount - Số tiền USD
 * @returns {Number} Số tiền VND
 */
function usdToVnd(usdAmount) {
  const exchangeRate = 24000; // Tỷ giá USD/VND
  return Math.round(usdAmount * exchangeRate);
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  getIpAddress,
  usdToVnd,
  vnpayConfig,
};
