const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// Replace with environment variables
const merchantId = process.env.MERCHANT_ID;
const saltKey = process.env.SALT_KEY;
const saltIndex = "1"; // default index
const redirectUrl = process.env.REDIRECT_URL;

app.post("/pay", async (req, res) => {
  const { amount, mobile, name, email } = req.body;
  const transactionId = "TID" + Date.now();

  const payload = {
    merchantId,
    merchantTransactionId: transactionId,
    merchantUserId: "user_" + Date.now(),
    amount: amount * 100,
    redirectUrl,
    redirectMode: "POST",
    mobileNumber: mobile,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const dataToSign = payloadBase64 + "/pg/v1/pay" + saltKey;
  const xVerify = crypto.createHash("sha256").update(dataToSign).digest("hex") + "###" + saltIndex;

  try {
    const response = await axios.post(
      "https://api.phonepe.com/apis/hermes/pg/v1/pay",
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": merchantId,
        },
      }
    );

    const paymentUrl = response.data.data.instrumentResponse.redirectInfo.url;
    return res.redirect(paymentUrl);
  } catch (err) {
    console.error("PhonePe Error", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
