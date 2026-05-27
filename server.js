// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // Set this in Render env vars

// Get list of banks
app.get("/banks", async (req, res) => {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const data = await response.json();
    const banks = data.data.map(b => ({ name: b.name, code: b.code, logo: b.logo }));
    res.json(banks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching banks" });
  }
});

// Verify account number
app.post("/verify-account", async (req, res) => {
  const { accountNumber, bankCode } = req.body;

  if (!accountNumber || !bankCode) {
    return res.status(400).json({ status: "error", message: "Missing account number or bank code" });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      }
    );

    const data = await response.json();

    if (data.status) {
      res.json({
        status: "success",
        account_name: data.data.account_name
      });
    } else {
      res.json({ status: "error", message: data.message });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Error verifying account" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
