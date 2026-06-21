import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbStore } from "./src/db/store.js";

async function startServer() {
  // Initialize file database
  await dbStore.init();

  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // --- API ROUTE HANDLERS ---

  // Health probe endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // GET /api/trips: Returns raw trips for drop-down selection
  app.get("/api/trips", (req, res) => {
    try {
      const trips = dbStore.getTripsRaw();
      res.json(trips);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch trips" });
    }
  });

  // POST /api/trips: Creates a full trip transaction mapping
  app.post("/api/trips", async (req, res) => {
    try {
      const {
        truckNo,
        route,
        date,
        fair,
        advance,
        transport,
        weight,
        rate,
        volume,
        purchaseAmount
      } = req.body;

      // Safe numeric validations
      if (!truckNo || !route || !transport) {
        return res.status(400).json({ error: "Required fields missing: truckNo, route, and transport must be supplied." });
      }

      const numericFair = Number(fair);
      const numericAdvance = Number(advance);
      const numericWeight = Number(weight);
      const numericRate = Number(rate);
      const numericPurchase = Number(purchaseAmount);

      if (isNaN(numericFair) || numericFair < 0) {
        return res.status(400).json({ error: "Fair must be a positive number." });
      }
      if (isNaN(numericAdvance) || numericAdvance < 0) {
        return res.status(400).json({ error: "Advance must be a positive number." });
      }
      if (isNaN(numericWeight) || numericWeight <= 0) {
        return res.status(400).json({ error: "Weight must be greater than zero." });
      }
      if (isNaN(numericRate) || numericRate < 0) {
        return res.status(400).json({ error: "Rate must be a positive number." });
      }
      if (isNaN(numericPurchase) || numericPurchase < 0) {
        return res.status(400).json({ error: "Purchase amount must be a positive number." });
      }

      const trip = await dbStore.createTrip({
        truckNo,
        route,
        date,
        fair: numericFair,
        advance: numericAdvance,
        transport,
        weight: numericWeight,
        rate: numericRate,
        volume: volume || "Standard",
        purchaseAmount: numericPurchase
      });

      res.status(201).json({ success: true, trip });
    } catch (error: any) {
      console.error("Error creating trip:", error);
      res.status(500).json({ error: error.message || "Failed to register trip logistics." });
    }
  });

  // POST /api/expenses: Logs operational expense entry
  app.post("/api/expenses", async (req, res) => {
    try {
      const { tripId, expenseId, description, amount } = req.body;

      if (!tripId || !expenseId || !description) {
        return res.status(400).json({ error: "tripId, expense category (expenseId), and description are required." });
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: "Expense amount must be a positive quantity." });
      }

      const expense = await dbStore.logExpense({
        tripId,
        expenseId,
        description,
        amount: numericAmount
      });

      res.status(201).json({ success: true, expense });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to catalog operational expense." });
    }
  });

  // POST /api/payments: Records a billing installment
  app.post("/api/payments", async (req, res) => {
    try {
      const { tripId, paidAmount } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: "tripId referencing target ledger ledger accounts required." });
      }

      const numericPayment = Number(paidAmount);
      if (isNaN(numericPayment) || numericPayment <= 0) {
        return res.status(400).json({ error: "Paid installments must be greater than zero." });
      }

      const account = await dbStore.postPayment({
        tripId,
        paidAmount: numericPayment
      });

      res.status(200).json({ success: true, account });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to post payment installment." });
    }
  });

  // GET /api/billing-view: Specialized sheet query view
  app.get("/api/billing-view", (req, res) => {
    try {
      const billingView = dbStore.getBillingView();
      res.json(billingView);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to assemble billing grid." });
    }
  });

  // GET /api/analytics/dashboard: Aggregates records for visualizations
  app.get("/api/analytics/dashboard", (req, res) => {
    try {
      const dashboard = dbStore.getDashboardAnalytics();
      const auditTrail = dbStore.getAuditTrail();
      res.json({ dashboard, auditTrail });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch aggregated dashboard analytics." });
    }
  });

  // DELETE /api/trips/:id: Cascaded trip erasure
  app.delete("/api/trips/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await dbStore.deleteTrip(id);
      res.json({ success: true, message: "Trip and dependent records purged." });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete record." });
    }
  });

  // --- VITE DEV / PRODUCTION INGRESS SERVICE MIDDLEWARES ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server linked to Express middlewares.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Express static asset compiler serving production folder: dist");
  }

  // PORT 3000 ONLY as hard-requirement by AI Studio reverse proxy
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Logistics and Billing Server online at: http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical: Express bootstrap failed:", error);
});
