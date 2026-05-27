// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" })); // Allow all origins
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error("PAYSTACK_SECRET_KEY is not set!");
  process.exit(1);
}

// Pre-mapped bank logos
const bankLogos = {
  // Major Nigerian banks
  "044": "https://www.pngmart.com/files/21/GTBank-Logo-PNG.png",
  "058": "https://www.pngmart.com/files/21/Access-Bank-Logo-PNG.png",
  "011": "https://www.pngmart.com/files/21/First-Bank-Logo-PNG.png",
  "023": "https://www.pngmart.com/files/21/Sterling-Bank-Logo-PNG.png",
  "032": "https://www.pngmart.com/files/21/Union-Bank-Logo-PNG.png",
  "033": "https://www.pngmart.com/files/21/United-Bank-for-Africa-Logo-PNG.png",
  "035": "https://www.pngmart.com/files/21/Wema-Bank-Logo-PNG.png",
  "057": "https://www.pngmart.com/files/21/Zenith-Bank-Logo-PNG.png",
  "215": "https://www.pngmart.com/files/21/Stanbic-IBTC-Bank-Logo-PNG.png",
  "068": "https://www.pngmart.com/files/21/Standard-Chartered-Bank-Logo-PNG.png",
  "014": "https://www.pngmart.com/files/21/FCMB-Logo-PNG.png",
  "070": "https://www.pngmart.com/files/21/Fidelity-Bank-Logo-PNG.png",
  "301": "https://www.pngmart.com/files/21/Polaris-Bank-Logo-PNG.png",
  "501": "https://www.pngmart.com/files/21/Jaiz-Bank-Logo-PNG.png",
  "401": "https://www.pngmart.com/files/21/Suntrust-Bank-Logo-PNG.png",
  "523": "https://www.pngmart.com/files/21/Providus-Bank-Logo-PNG.png",
  "566": "https://www.pngmart.com/files/21/Coronation-Bank-Logo-PNG.png",
  "503": "https://www.pngmart.com/files/21/Globus-Bank-Logo-PNG.png",
  "999": "https://www.pngmart.com/files/21/NIB-Logo-PNG.png",

  // Fintech wallets
  "OPAY": "https://upload.wikimedia.org/wikipedia/commons/5/5c/OPay_logo.png",
  "MONIEPOINT": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Moniepoint_logo.png",
  "PALMPAY": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Palmpay_Logo.png",
};

// Endpoint: list banks with logos
app.get("/banks", async (req, res) => {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const data = await response.json();

    const banks = data.data.map(b => ({
      name: b.name,
      code: b.code,
      logo: bankLogos[b.code] || ""
    }));

    // Include fintech wallets manually
    const fintechs = [
      { name: "Opay", code: "OPAY", logo: bankLogos["OPAY"] },
      { name: "Moniepoint", code: "MONIEPOINT", logo: bankLogos["MONIEPOINT"] },
      { name: "Palmpay", code: "PALMPAY", logo: bankLogos["PALMPAY"] }
    ];

    res.json([...banks, ...fintechs]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching banks" });
  }
});

// Endpoint: resolve account automatically
app.post("/resolve-account", async (req, res) => {
  const { accountNumber } = req.body;

  if (!accountNumber) {
    return res.status(400).json({ status: "error", message: "Account number required" });
  }

  try {
    // Get all banks from Paystack
    const banksResponse = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const banksData = await banksResponse.json();

    let resolved = null;

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
          bank_name: bank.name,
          bank_logo: bankLogos[bank.code] || ""
        };
        break;
      }
    }

    // You can also manually resolve Opay, Moniepoint, Palmpay if you know their account numbers
    // resolved = { ... }

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
