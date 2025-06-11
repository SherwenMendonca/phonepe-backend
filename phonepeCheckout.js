const express = require("express");
const crypto = require("crypto");
const app = express();
const port = process.env.PORT || 3000;

const merchantId = process.env.MERCHANT_ID || "SU2506102210515058875417";
const saltKey = process.env.SALT_KEY || "cc71f494-5f7c-4e4d-8e85-b0d820501c0c";
const redirectUrl = process.env.REDIRECT_URL || "https://example.com/success";

app.get("/pay", async (req, res) => {
  const { amount, name, email } = req.query;
  const transactionId = "TID" + Date.now();

  const data = {
    merchantId,
    merchantTransactionId: transactionId,
    merchantUserId: name || "Guest",
    amount: parseInt(amount), // amount in paise
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl: redirectUrl,
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };

  const jsonData = JSON.stringify(data);
  const base64Data = Buffer.from(jsonData).toString("base64");

  const stringToSign = base64Data + "/pg/v1/pay" + saltKey;
  const xVerify = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###1";

  try {
    const response = await fetch("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId
      },
      body: JSON.stringify({ request: base64Data })
    });

    const result = await response.json();

    if (result.success) {
      res.redirect(result.data.instrumentResponse.redirectInfo.url);
    } else {
      res.send("Payment failed: " + result.code);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
