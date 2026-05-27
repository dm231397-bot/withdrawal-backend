// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error("Error: PAYSTACK_SECRET_KEY not set in environment variables");
  process.exit(1);
}

// Optional: endpoint to list all banks
app.get("/banks", async (req, res) => {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const data = await response.json();
    const banks = data.data.map(b => ({ name: b.name, code: b.code }));
    res.json(banks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching banks" });
  }
});

// New endpoint: resolve account using only account number
app.post("/resolve-account", async (req, res) => {
  const { accountNumber } = req.body;

  if (!accountNumber) return res.status(400).json({ status: "error", message: "Account number required" });

  try {
    // Fetch all banks from Paystack
    const banksResponse = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const banksData = await banksResponse.json();

    let resolved = null;

    // Try resolving account with each bank code until one succeeds
    for (const bank of banksData.data) {
      const verifyRes = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bank.code}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
        }
      );

      const verifyData = await verifyRes.json();
      if (verifyData.status) {
        resolved = {
          account_name: verifyData.data.account_name,
          bank_code: bank.code,
          bank_name: bank.name
        };
        break;
      }
    }

    if (resolved) {
      res.json({ status: "success", ...resolved });
    } else {
      res.json({ status: "error", message: "Account not found in any bank" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Error resolving account" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
