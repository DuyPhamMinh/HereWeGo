const crypto = require("crypto");
const querystring = require("querystring");

const vnpayConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE,
  secretKey: process.env.VNPAY_HASH_SECRET,
  vnpUrl: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnpReturnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:8080/booking/vnpay-return",
  vnpApi: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnpVersion: "2.1.0",
  vnpCommand: "pay",
  vnpCurrCode: "VND",
  vnpLocale: "vn",
  vnpOrderType: "other",
};

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
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = vnpayConfig.vnpVersion;
  vnp_Params["vnp_Command"] = vnpayConfig.vnpCommand;
  vnp_Params["vnp_TmnCode"] = vnpayConfig.tmnCode;
  vnp_Params["vnp_Locale"] = vnpayConfig.vnpLocale;
  vnp_Params["vnp_CurrCode"] = vnpayConfig.vnpCurrCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = orderDescription;
  vnp_Params["vnp_OrderType"] = orderType;
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = vnpayConfig.vnpReturnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_ExpireDate"] = expireDate;

  vnp_Params = sortObject(vnp_Params);

  const signData = createQueryString(vnp_Params);
  const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = vnpayConfig.vnpUrl + "?" + createQueryString(vnp_Params);

  return paymentUrl;
}

function createQueryString(obj) {
  const sorted = sortObject(obj);
  const queryParts = [];
  for (const key in sorted) {
    if (sorted.hasOwnProperty(key)) {
      const value = sorted[key];
      if (value !== null && value !== undefined && value !== "") {

        let encodedValue = encodeURIComponent(String(value));

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

function verifyReturnUrl(vnp_Params) {
  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);

  const signData = createQueryString(sortedParams);
  const hmac = crypto.createHmac("sha512", vnpayConfig.secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
}

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = obj[keys[i]];
  }
  return sorted;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function getIpAddress(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    "127.0.0.1"
  );
}

function usdToVnd(usdAmount) {
  const exchangeRate = 24000;
  return Math.round(usdAmount * exchangeRate);
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  getIpAddress,
  usdToVnd,
  vnpayConfig,
};
