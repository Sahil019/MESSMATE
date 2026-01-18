import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db.js";
import fs from "fs";
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const upload = multer({ dest: "uploads/payment_qr" });

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Database initialization function
async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Read the schema file
    const schema = fs.readFileSync('schema.sql', 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await db.query(statement);
      }
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// --------------------------------------------------
// REGISTER
// --------------------------------------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, fullName, role, mobileNumber, totalAmount } = req.body;

    const { rows } = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (rows.length > 0)
      return res.status(409).json({ error: "User already exists" });

    const id = uuidv4();
    const passHash = await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO users
      (id,email,password_hash,full_name,role,mobile_number,mess_status,total_amount,created_at,updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, NOW(), NOW())
      `,
      [id, email, passHash, fullName, role, mobileNumber || null, totalAmount || 0]
    );

    const token = jwt.sign(
      { id, email, fullName, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id, email, fullName, role }
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --------------------------------------------------
// LOGIN
// --------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db.query(
      `SELECT id,email,password_hash,full_name,role
       FROM users WHERE email = $1`,
      [email]
    );

    if (!rows.length)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --------------------------------------------------
// AUTH /me
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        id,
        email,
        full_name,
        role,
        mobile_number,
        mess_status,
        selected_package,
        package_amount,
        total_amount
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ error: "User not found" });

    res.json({ user: rows[0] });

  } catch (err) {
    console.error("Auth me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



// ==================================================
// GET ATTENDANCE (student)
// ==================================================
app.get("/api/attendance", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const { rows } = await db.query(
      `
      SELECT meal_date, meal_type, status, is_locked
      FROM attendance_logs
      WHERE user_id = $1
      AND meal_date BETWEEN $2 AND $3
      ORDER BY meal_date ASC
      `,
      [req.user.id, startDate, endDate]
    );

    res.json({ attendance: rows });

  } catch (err) {
    console.error("Fetch attendance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// GET ATTENDANCE FOR A SPECIFIC DAY (for dashboard)
// ==================================================
app.get("/api/attendance/day", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: "Date parameter required" });

    const { rows } = await db.query(
      `
      SELECT meal_type, status
      FROM attendance_logs
      WHERE user_id = $1 AND meal_date = $2
      `,
      [req.user.id, date]
    );

    // Compute is_locked based on date being in the past
    const today = new Date().toISOString().slice(0, 10);
    const isLocked = date < today;

    // Ensure all meal types are present
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const meals = mealTypes.map(mealType => {
      const record = rows.find(r => r.meal_type === mealType);
      return {
        meal_type: mealType,
        status: record?.status || 'not_set',
        is_locked: isLocked
      };
    });

    res.json({ meals });

  } catch (err) {
    console.error("Fetch day attendance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// GET ATTENDANCE SUMMARY (for dashboard)
// ==================================================
app.get("/api/attendance/summary", authenticateToken, async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end)
      return res.status(400).json({ error: "Start and end dates required" });

    // Get attendance counts
    const { rows: attendanceRows } = await db.query(
      `
      SELECT
        SUM(CASE WHEN status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN status IN ('skip', 'not_attended') THEN 1 ELSE 0 END) as skipped
      FROM attendance_logs
      WHERE user_id = $1 AND meal_date BETWEEN $2 AND $3
      `,
      [req.user.id, start, end]
    );

    // Get approved leave days count - optimized query
    const { rows: leaveRows } = await db.query(
      `
      SELECT COUNT(DISTINCT date_range.date) as leave_days
      FROM leave_requests lr
      CROSS JOIN (
        SELECT $1::date + INTERVAL '1 day' * t.n as date
        FROM (
          SELECT a.n + b.n*10 + c.n*100 as n
          FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a
          CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
          CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c
        ) t
        WHERE $2::date + INTERVAL '1 day' * t.n <= $3::date
      ) date_range
      WHERE lr.user_id = $4 AND lr.status = 'approved'
      AND date_range.date BETWEEN lr.start_date AND lr.end_date
      `,
      [start, start, end, req.user.id]
    );

    const attended = attendanceRows[0]?.attended || 0;
    const skipped = attendanceRows[0]?.skipped || 0;
    const onLeave = leaveRows[0]?.leave_days || 0;

    // Calculate estimated amount (only for consumed/will_attend meals)
    const { rows: amountRows } = await db.query(
      `
      SELECT
        SUM(CASE WHEN meal_type = 'breakfast' THEN 30 ELSE 0 END) as breakfast_amount,
        SUM(CASE WHEN meal_type = 'lunch' THEN 48 ELSE 0 END) as lunch_amount,
        SUM(CASE WHEN meal_type = 'dinner' THEN 42 ELSE 0 END) as dinner_amount
      FROM attendance_logs
      WHERE user_id = $1 AND meal_date BETWEEN $2 AND $3
      AND status IN ('will_attend', 'consumed')
      `,
      [req.user.id, start, end]
    );

    const estimatedAmount =
      (amountRows[0]?.breakfast_amount || 0) +
      (amountRows[0]?.lunch_amount || 0) +
      (amountRows[0]?.dinner_amount || 0);

    res.json({
      stats: { attended, skipped, onLeave },
      estimatedAmount
    });

  } catch (err) {
    console.error("Fetch attendance summary error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// STUDENT — GET BILLING SUMMARY (current month)
// ==================================================
app.get("/api/billing/summary", authenticateToken, async (req, res) => {
  try {
    const { date, start, end } = req.query;

    let startDate, endDate;

    if (date) {
      // Calculate month start and end from date
      const monthStart = new Date(date + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      startDate = monthStart.toISOString().slice(0, 10);
      endDate = monthEnd.toISOString().slice(0, 10);
    } else if (start && end) {
      startDate = start;
      endDate = end;
    } else {
      return res.status(400).json({ error: "Date or start/end dates required" });
    }

    // Get attendance counts
    const { rows: attendanceRows } = await db.query(
      `
      SELECT
        SUM(CASE WHEN status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN status IN ('skip', 'not_attended') THEN 1 ELSE 0 END) as skipped
      FROM attendance_logs
      WHERE user_id = $1 AND meal_date BETWEEN $2 AND $3
      `,
      [req.user.id, startDate, endDate]
    );

    // Get approved leave days count
    const { rows: leaveRows } = await db.query(
      `
      SELECT COUNT(*) as leave_days
      FROM leave_requests
      WHERE user_id = $1 AND status = 'approved'
      AND ((start_date BETWEEN $2 AND $3) OR (end_date BETWEEN $4 AND $5) OR (start_date <= $6 AND end_date >= $7))
      `,
      [req.user.id, startDate, endDate, startDate, endDate, startDate, endDate]
    );

    const attended = attendanceRows[0]?.attended || 0;
    const skipped = attendanceRows[0]?.skipped || 0;
    const leave = leaveRows[0]?.leave_days || 0;

    // Calculate estimated amount (only for consumed/will_attend meals)
    const { rows: amountRows } = await db.query(
      `
      SELECT
        SUM(CASE WHEN meal_type = 'breakfast' THEN 30 ELSE 0 END) as breakfast_amount,
        SUM(CASE WHEN meal_type = 'lunch' THEN 48 ELSE 0 END) as lunch_amount,
        SUM(CASE WHEN meal_type = 'dinner' THEN 42 ELSE 0 END) as dinner_amount
      FROM attendance_logs
      WHERE user_id = $1 AND meal_date BETWEEN $2 AND $3
      AND status IN ('will_attend', 'consumed')
      `,
      [req.user.id, startDate, endDate]
    );

    const estimatedAmount =
      (amountRows[0]?.breakfast_amount || 0) +
      (amountRows[0]?.lunch_amount || 0) +
      (amountRows[0]?.dinner_amount || 0);

    res.json({
      summary: { attended, skipped, leave, estimatedAmount }
    });

  } catch (err) {
    console.error("Fetch billing summary error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// STUDENT — GET BILLING HISTORY
// ==================================================
app.get("/api/billing/history", authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT billing_month, breakfast_count, lunch_count, dinner_count, total_meals, total_amount, is_paid
      FROM billing_records
      WHERE user_id = $1
      ORDER BY billing_month DESC
      `,
      [req.user.id]
    );

    res.json({ records: rows });

  } catch (err) {
    console.error("Fetch billing history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// STUDENT — SELECT MENU PACKAGE
// ==================================================
app.post("/api/menu/select-package", authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: "Package ID is required" });
    }

    // Fixed package pricing (matches your plan table values)
    const PACKAGE_PRICES = {
      basic: 2500,
      premium: 3500,
      deluxe: 4500
    };

    const price = PACKAGE_PRICES[packageId];

    if (!price) {
      return res.status(400).json({ error: "Invalid package ID" });
    }

    // --- Ensure columns exist (safe + idempotent) ---
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS selected_package VARCHAR(50) NULL
    `).catch(() => {});

    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS package_amount DECIMAL(10,2) DEFAULT 0
    `).catch(() => {});

    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0
    `).catch(() => {});

    // --- Save package selection ---
    await db.query(
      `
      UPDATE users
      SET selected_package = $1,
          package_amount = $2,
          total_amount = $3,
          updated_at = NOW()
      WHERE id = $4
      `,
      [packageId, price, price, req.user.id]
    );

    // return updated user billing
    const { rows } = await db.query(
      `
      SELECT id, full_name, email,
             selected_package, package_amount, total_amount
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    res.json({
      success: true,
      message: "Package selected successfully",
      selectedPackage: rows[0].selected_package,
      monthlyBill: rows[0].total_amount,
      user: rows[0]
    });

  } catch (err) {
    console.error("Select package error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// STUDENT — GET SELECTED PACKAGE
// ==================================================
app.get("/api/menu/selected-package", authenticateToken, async (req, res) => {
  try {
    // For now, we'll determine package based on total_amount
    // In production, you might want a separate column for selected_package
    const { rows } = await db.query(
      `
      SELECT total_amount
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalAmount = rows[0].total_amount;

    // Determine package based on amount
    let selectedPackage = null;
    if (totalAmount === 2500) selectedPackage = 'basic';
    else if (totalAmount === 3500) selectedPackage = 'premium';
    else if (totalAmount === 4500) selectedPackage = 'deluxe';

    res.json({
      selectedPackage,
      monthlyBill: totalAmount
    });

  } catch (err) {
    console.error("Get selected package error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// SAVE ATTENDANCE + RECALCULATE MONTH BILL
// (NO DOUBLE COUNTING — ONLY DAY COUNT)
// ==================================================
app.post("/api/attendance", authenticateToken, async (req, res) => {
  try {
    const { user_id, meal_date, meal_type, status } = req.body;

    const uid = user_id || req.user.id;

    // Check previous status
    const { rows: oldRows } = await db.query(
      "SELECT status FROM attendance_logs WHERE user_id=$1 AND meal_date=$2 AND meal_type=$3",
      [uid, meal_date, meal_type]
    );
    const oldStatus = oldRows.length ? oldRows[0].status : null;

    // Upsert attendance
    await db.query(
      `
      INSERT INTO attendance_logs (user_id, meal_date, meal_type, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, meal_date, meal_type)
      DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW()
      `,
      [uid, meal_date, meal_type, status]
    );

    const billingDate = new Date(meal_date).toISOString().slice(0, 7) + '-01';

    // Only recalc when status changes
    if (oldStatus !== status) {
      // ensure billing record exists for that month
      await db.query(
        `
        INSERT INTO billing_records
          (user_id, billing_month, breakfast_count, lunch_count, dinner_count,
           total_meals, base_amount, meals_amount, total_amount, is_paid)
        VALUES ($1, $2, 0,0,0,0,0,0,0,0)
        ON CONFLICT (user_id, billing_month)
        DO NOTHING
        `,
        [uid, billingDate]
      );

      // Recalculate counts from scratch for the month
      const { rows: billingRows } = await db.query(
        `
        SELECT
          SUM(CASE WHEN meal_type = 'breakfast' AND status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as breakfast_count,
          SUM(CASE WHEN meal_type = 'lunch' AND status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as lunch_count,
          SUM(CASE WHEN meal_type = 'dinner' AND status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as dinner_count
        FROM attendance_logs
        WHERE user_id = $1 AND TO_CHAR(meal_date, 'YYYY-MM') = TO_CHAR($2::date, 'YYYY-MM')
        `,
        [uid, billingDate]
      );

      const { breakfast_count = 0, lunch_count = 0, dinner_count = 0 } = billingRows[0] || {};
      const total_meals = breakfast_count + lunch_count + dinner_count;
      const total_amount = (breakfast_count * 30) + (lunch_count * 48) + (dinner_count * 42);

      // Save monthly bill
      await db.query(
        `
        INSERT INTO billing_records
        (user_id,billing_month,breakfast_count,lunch_count,dinner_count,total_meals,total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, billing_month)
        DO UPDATE SET
          breakfast_count = EXCLUDED.breakfast_count,
          lunch_count     = EXCLUDED.lunch_count,
          dinner_count    = EXCLUDED.dinner_count,
          total_meals     = EXCLUDED.total_meals,
          total_amount    = EXCLUDED.total_amount,
          updated_at      = NOW()
        `,
        [
          uid,
          billingDate,
          breakfast_count,
          lunch_count,
          dinner_count,
          total_meals,
          total_amount
        ]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Save attendance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// ADMIN USERS
// ==================================================
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { rows } = await db.query(
      `
      SELECT id,email,full_name,role,mobile_number,mess_status,total_amount,created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    res.json({ users: rows });

  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — GET SINGLE USER
// ==================================================
app.get("/api/admin/users/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { id } = req.params;

    const { rows } = await db.query(
      `
      SELECT id,email,full_name,role,mobile_number,mess_status,total_amount,created_at,updated_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: rows[0] });

  } catch (err) {
    console.error("Admin get user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — UPDATE USER
// ==================================================
app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { id } = req.params;
    const { email, full_name, mobile_number, mess_status, total_amount } = req.body;

    console.log("UPDATE USER BODY:", req.body);

    if (!email || !full_name) {
      return res.status(400).json({ error: "Email and full name are required" });
    }

    // ✅ FIXED ENUM NORMALIZATION - removed invalid "not_paid" mapping
    let status = mess_status;

    const amount = Number(total_amount) || 0;

    const result = await db.query(
      `
      UPDATE users
      SET
        email = $1,
        full_name = $2,
        mobile_number = $3,
        mess_status = $4,
        total_amount = $5,
        updated_at = NOW()
      WHERE id = $6
      `,
      [
        email,
        full_name,
        mobile_number || null,
        status,          // ✅ USE NORMALIZED VALUE
        amount,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ UPDATE USER ERROR:", err);
    res.status(500).json({
      error: err.message,
      sqlMessage: err.sqlMessage
    });
  }
});

// ==================================================
// ADMIN — DELETE USER
// ==================================================
app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { id } = req.params;

    // Check if user exists
    const { rows: userRows } = await db.query("SELECT id FROM users WHERE id = $1", [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete related records first (attendance, billing, leave requests)
    await db.query("DELETE FROM attendance_logs WHERE user_id = $1", [id]);
    await db.query("DELETE FROM billing_records WHERE user_id = $1", [id]);
    await db.query("DELETE FROM leave_requests WHERE user_id = $1", [id]);

    // Delete the user
    await db.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ success: true });

  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==================================================
// ADMIN — DETAILED BILLING LIST
// ==================================================
app.get("/api/admin/billing", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { rows } = await db.query(
      `
      SELECT b.id,b.user_id,u.full_name,b.billing_month,
             b.breakfast_count,b.lunch_count,b.dinner_count,
             b.total_meals,b.total_amount,b.is_paid,b.created_at
      FROM billing_records b
      JOIN users u ON u.id = b.user_id
      ORDER BY b.billing_month DESC,u.full_name ASC
      `
    );

    res.json({ records: rows });

  } catch (err) {
    console.error("Billing list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================================
// ADMIN — BILLING SUMMARY (MATCH BY DATE)
// =====================================================
app.get("/api/admin/billing/summary", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { date } = req.query;
    const dateKey = date || new Date().toISOString().slice(0, 10); // Default to current date if not provided

    const { rows } = await db.query(
      `
      SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.mess_status,

        b.id AS billing_id,
        COALESCE(b.breakfast_count,0) AS breakfast_count,
        COALESCE(b.lunch_count,0) AS lunch_count,
        COALESCE(b.dinner_count,0) AS dinner_count,
        COALESCE(b.total_meals,0) AS total_meals,
        COALESCE(b.total_amount,0) AS total_amount,
        COALESCE(b.is_paid,0) AS is_paid,

        $1 AS billing_date

      FROM users u
      LEFT JOIN billing_records b
        ON b.user_id = u.id
        AND TO_CHAR(b.billing_month, 'YYYY-MM') = TO_CHAR($2, 'YYYY-MM')

      WHERE u.role = 'student'
      ORDER BY u.full_name ASC
    `,
      [dateKey, dateKey]
    );

    res.json({ records: rows });

  } catch (err) {
    console.error("Billing summary API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================================
// ADMIN — UPDATE PAYMENT STATUS
// =====================================================
app.post("/api/admin/billing/update-payment", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { user_id, billing_date, is_paid } = req.body;

    if (!user_id || !billing_date || is_paid === undefined)
      return res.status(400).json({ error: "user_id, billing_date, and is_paid are required" });

    // Update the payment status
    await db.query(
      `
      UPDATE billing_records
      SET is_paid = $1, updated_at = NOW()
      WHERE user_id = $2 AND TO_CHAR(billing_month, 'YYYY-MM') = TO_CHAR($3, 'YYYY-MM')
      `,
      [is_paid, user_id, billing_date]
    );

    res.json({ success: true, message: is_paid ? "Successfully marked as paid" : "Marked as unpaid" });

  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================================
// ADMIN – DAILY REPORT
// =====================================================
app.get("/api/admin/reports/daily", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, error: "Admin access required" });

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, error: "Date parameter required" });
    }

    console.log('Fetching daily report for date:', date);

    // Get attendance data for the date
    const { rows: attendanceRows } = await db.query(
      `
      SELECT meal_type, status, COUNT(*) as count
      FROM attendance_logs
      WHERE meal_date = $1
      GROUP BY meal_type, status
      `,
      [date]
    );

    console.log('Attendance rows:', attendanceRows);

    // Aggregate attendance per meal type
    const attendanceMap = {};
    attendanceRows.forEach(row => {
      if (!attendanceMap[row.meal_type]) {
        attendanceMap[row.meal_type] = {
          total: 0,
          will_attend: 0,
          consumed: 0,
          not_attended: 0,
          skip: 0
        };
      }

      const count = parseInt(row.count) || 0;
      const status = row.status || 'not_set';

      attendanceMap[row.meal_type][status] = count;
      attendanceMap[row.meal_type].total += count;
    });

    const attendance = ['breakfast', 'lunch', 'dinner'].map(mealType => ({
      meal_type: mealType,
      total: attendanceMap[mealType]?.total || 0,
      will_attend: attendanceMap[mealType]?.will_attend || 0,
      consumed: attendanceMap[mealType]?.consumed || 0,
      not_attended: attendanceMap[mealType]?.not_attended || 0,
      skip: attendanceMap[mealType]?.skip || 0
    }));

    console.log('Processed attendance:', attendance);

    // Get billing summary for the month
    const { rows: billingRows } = await db.query(
      `
      SELECT
        COUNT(DISTINCT u.id) as total_students,
        COALESCE(SUM(b.total_meals), 0) as total_meals,
        COALESCE(SUM(b.total_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN b.is_paid = true OR b.is_paid = 1 THEN 1 ELSE 0 END), 0) as paid_count
      FROM users u
      LEFT JOIN billing_records b
        ON b.user_id = u.id
        AND DATE_TRUNC('month', b.billing_month) = DATE_TRUNC('month', $1::date)
      WHERE u.role = 'student'
      `,
      [date]
    );

    console.log('Billing rows:', billingRows);

    const billing = {
      total_students: parseInt(billingRows[0]?.total_students) || 0,
      total_meals: parseInt(billingRows[0]?.total_meals) || 0,
      total_amount: parseFloat(billingRows[0]?.total_amount) || 0,
      paid_count: parseInt(billingRows[0]?.paid_count) || 0
    };

    // Get leave count for the date
    const { rows: leaveRows } = await db.query(
      `
      SELECT COUNT(*) as leave_count
      FROM leave_requests
      WHERE status = 'approved'
      AND $1::date >= start_date
      AND $1::date <= end_date
      `,
      [date]
    );

    console.log('Leave rows:', leaveRows);

    const leaves = parseInt(leaveRows[0]?.leave_count) || 0;

    const response = {
      success: true,
      report: {
        date,
        attendance,
        billing,
        leaves
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));

    res.json(response);

  } catch (err) {
    console.error("Daily report API error:", err);
    console.error("Error stack:", err.stack);

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: err.message
    });
  }
});

// =====================================================
// STUDENT — DAILY REPORT (alias for frontend compatibility)
// =====================================================
app.get("/api/reports/daily", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter required" });

    // Get attendance data for the date
    const { rows: attendanceRows } = await db.query(
      `
      SELECT meal_type, status, COUNT(*) as count
      FROM attendance_logs
      WHERE meal_date = $1
      GROUP BY meal_type, status
      `,
      [date]
    );

    // Aggregate attendance per meal type
    const attendanceMap = {};
    attendanceRows.forEach(row => {
      if (!attendanceMap[row.meal_type]) {
        attendanceMap[row.meal_type] = { total: 0, will_attend: 0, consumed: 0, not_attended: 0 };
      }
      attendanceMap[row.meal_type][row.status] = row.count;
      attendanceMap[row.meal_type].total += row.count;
    });

    const attendance = ['breakfast', 'lunch', 'dinner'].map(mealType => ({
      meal_type: mealType,
      total: attendanceMap[mealType]?.total || 0,
      will_attend: attendanceMap[mealType]?.will_attend || 0,
      consumed: attendanceMap[mealType]?.consumed || 0,
      not_attended: attendanceMap[mealType]?.not_attended || 0
    }));

    // Get billing summary for the date
    const { rows: billingRows } = await db.query(
      `
      SELECT
        COUNT(u.id) as total_students,
        SUM(COALESCE(b.total_meals, 0)) as total_meals,
        SUM(COALESCE(b.total_amount, 0)) as total_amount,
        SUM(CASE WHEN COALESCE(b.is_paid, 0) = 1 THEN 1 ELSE 0 END) as paid_count
      FROM users u
      LEFT JOIN billing_records b
        ON b.user_id = u.id
        AND TO_CHAR(b.billing_month, 'YYYY-MM') = TO_CHAR($1, 'YYYY-MM')
      WHERE u.role = 'student'
      `,
      [date]
    );

    const billing = billingRows[0] || { total_students: 0, total_meals: 0, total_amount: 0, paid_count: 0 };

    // Get leave count for the date
    const { rows: leaveRows } = await db.query(
      `
      SELECT COUNT(*) as leaves
      FROM leave_requests
      WHERE status = 'approved'
      AND $1 BETWEEN start_date AND end_date
      `,
      [date]
    );

    const leaves = leaveRows[0]?.leaves || 0;

    res.json({
      report: {
        date,
        attendance,
        billing,
        leaves
      }
    });

  } catch (err) {
    console.error("Daily report API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// STUDENT — GET LEAVE REQUESTS
// ==================================================
app.get("/api/leave", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    const uid = user_id || req.user.id;

    const { rows } = await db.query(
      `
      SELECT id, user_id, start_date, end_date, reason, status, created_at
      FROM leave_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [uid]
    );

    res.json({ leaveRequests: rows });

  } catch (err) {
    console.error("Fetch leave requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// STUDENT — SUBMIT LEAVE REQUEST
// ==================================================
app.post("/api/leave", authenticateToken, async (req, res) => {
  try {
    const { user_id, start_date, end_date, reason } = req.body;
    const uid = user_id || req.user.id;

    if (!start_date || !end_date)
      return res.status(400).json({ error: "Start date and end date are required" });

    const id = uuidv4();

    await db.query(
      `
      INSERT INTO leave_requests (id, user_id, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [id, uid, start_date, end_date, reason || null]
    );

    res.status(201).json({ success: true, id });

  } catch (err) {
    console.error("Submit leave request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — GET ALL LEAVE REQUESTS
// ==================================================
app.get("/api/admin/leaves", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { rows } = await db.query(
      `
      SELECT lr.id, lr.user_id, u.full_name, u.email, lr.start_date, lr.end_date, lr.reason, lr.status, lr.created_at
      FROM leave_requests lr
      JOIN users u ON u.id = lr.user_id
      ORDER BY lr.created_at DESC
      `
    );

    res.json({ leaveRequests: rows });

  } catch (err) {
    console.error("Fetch admin leave requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — APPROVE/REJECT LEAVE REQUEST
// ==================================================
app.post("/api/admin/leaves/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    // Update leave status
    await db.query(
      `
      UPDATE leave_requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [status, id]
    );

    // If approved, mark attendance as not_attended for the leave period
    if (status === 'approved') {
      const { rows: leaveRows } = await db.query(
        "SELECT user_id, start_date, end_date FROM leave_requests WHERE id = $1",
        [id]
      );

      if (leaveRows.length > 0) {
        const { user_id, start_date, end_date } = leaveRows[0];
        const start = new Date(start_date);
        const end = new Date(end_date);

        // Loop through each day in the leave period
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const mealDate = d.toISOString().slice(0, 10);

          // For each meal type, set status to 'not_attended'
          const mealTypes = ['breakfast', 'lunch', 'dinner'];
          for (const mealType of mealTypes) {
            await db.query(
              `
              INSERT INTO attendance_logs (user_id, meal_date, meal_type, status)
              VALUES ($1, $2, $3, 'not_attended')
              ON CONFLICT (user_id, meal_date, meal_type)
              DO UPDATE SET
                status = EXCLUDED.status,
                updated_at = NOW()
              `,
              [user_id, mealDate, mealType]
            );
          }
        }

        // Recalculate billing for affected months
        // This is a simplified recalculation in production, you might want to batch this
        const billingMonths = new Set();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          billingMonths.add(d.toISOString().slice(0, 7) + '-01'); // First day of month
        }

        for (const billingMonth of billingMonths) {
          // Recalc logic similar to attendance POST
          const { rows: billingRows } = await db.query(
            `
            SELECT
              SUM(CASE WHEN meal_type = 'breakfast' AND status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as breakfast_count,
              SUM(CASE WHEN meal_type = 'lunch' AND status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as lunch_count,
              SUM(CASE WHEN meal_type = 'dinner' AND status IN ('will_attend', 'consumed') THEN 1 ELSE 0 END) as dinner_count
            FROM attendance_logs
            WHERE user_id = $1 AND TO_CHAR(meal_date, 'YYYY-MM') = TO_CHAR($2::date, 'YYYY-MM')
            `,
            [user_id, billingMonth]
          );

          const { breakfast_count = 0, lunch_count = 0, dinner_count = 0 } = billingRows[0] || {};
          const total_meals = breakfast_count + lunch_count + dinner_count;
          const total_amount = (breakfast_count * 30) + (lunch_count * 48) + (dinner_count * 42);

          await db.query(
            `
            INSERT INTO billing_records
            (user_id, billing_month, breakfast_count, lunch_count, dinner_count, total_meals, total_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, billing_month)
            DO UPDATE SET
              breakfast_count = EXCLUDED.breakfast_count,
              lunch_count = EXCLUDED.lunch_count,
              dinner_count = EXCLUDED.dinner_count,
              total_meals = EXCLUDED.total_meals,
              total_amount = EXCLUDED.total_amount,
              updated_at = NOW()
            `,
            [user_id, billingMonth, breakfast_count, lunch_count, dinner_count, total_meals, total_amount]
          );
        }
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Update leave status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — GET QR CODE
// ==================================================
app.get("/api/admin/payment/qr", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Fetch QR code path from database
    const { rows } = await db.query(
      "SELECT qr_code_path, upi_id, upi_name FROM payment_settings WHERE id = 1"
    );

    if (rows.length === 0 || !rows[0].qr_code_path) {
      return res.json({ qrCode: null, upiId: null, upiName: null });
    }

    res.json({
      qrCode: rows[0].qr_code_path,
      upiId: rows[0].upi_id,
      upiName: rows[0].upi_name
    });

  } catch (err) {
    console.error("Get QR code error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — UPLOAD QR CODE
// ==================================================
app.post("/api/admin/payment/qr", authenticateToken, upload.single("qrCode"), async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Admin access required" });

    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const filePath = `/uploads/payment_qr/${req.file.filename}`;

    await db.query(
      `UPDATE payment_settings
       SET qr_code_path = $1, updated_at = NOW()
       WHERE id = 1`,
      [filePath]
    );

    res.json({ success: true, qrCode: filePath });
  } catch (err) {
    console.error("Upload QR error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — DELETE QR CODE
// ==================================================
app.delete("/api/admin/payment/qr", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // In production, delete from database and file system
    res.json({ success: true, message: "QR code removed" });

  } catch (err) {
    console.error("Delete QR error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// STUDENT — GET QR CODE
// ==================================================
app.get("/api/payment/qr", authenticateToken, async (req, res) => {
  try {
    // Fetch QR code path from database
    const { rows } = await db.query(
      "SELECT qr_code_path, upi_id, upi_name FROM payment_settings WHERE id = 1"
    );

    if (rows.length === 0 || !rows[0].qr_code_path) {
      return res.json({ qrCode: null, upiId: null, upiName: null });
    }

    res.json({
      qrCode: rows[0].qr_code_path,
      upiId: rows[0].upi_id,
      upiName: rows[0].upi_name
    });

  } catch (err) {
    console.error("Get QR code error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// PAYMENT — SUBMIT PAYMENT
// ==================================================
app.post("/api/payment/submit", authenticateToken, async (req, res) => {
  try {
    const { amount, transactionId, paymentMethod, billingMonth } = req.body;

    if (!amount || !transactionId || !paymentMethod) {
      return res.status(400).json({ error: "Amount, transaction ID, and payment method are required" });
    }

    const userId = req.user.id;
    const paymentId = uuidv4();

    // Insert payment record
    await db.query(
      `
      INSERT INTO payments (id, user_id, amount, transaction_id, payment_method, billing_month, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      `,
      [paymentId, userId, amount, transactionId, paymentMethod, billingMonth || null]
    );

    res.json({
      success: true,
      message: "Payment submitted successfully",
      paymentId
    });

  } catch (err) {
    console.error("Submit payment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// PAYMENT — GET PAYMENT STATUS
// ==================================================
app.get("/api/payment/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { billingMonth } = req.query;

    let query = `
      SELECT id, amount, transaction_id, payment_method, billing_month, status, created_at
      FROM payments
      WHERE user_id = $1
    `;
    let params = [userId];

    if (billingMonth) {
      query += " AND TO_CHAR(billing_month, 'YYYY-MM') = $2";
      params.push(billingMonth);
    }

    query += " ORDER BY created_at DESC";

    const { rows } = await db.query(query, params);

    res.json({ payments: rows });

  } catch (err) {
    console.error("Get payment status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — GET ALL PAYMENTS
// ==================================================
app.get("/api/admin/payments", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { rows } = await db.query(
      `
      SELECT p.id, p.user_id, u.full_name, u.email, p.amount, p.transaction_id,
             p.payment_method, p.billing_month, p.status, p.created_at
      FROM payments p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      `
    );

    res.json({ payments: rows });

  } catch (err) {
    console.error("Get admin payments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — UPDATE PAYMENT STATUS
// ==================================================
app.post("/api/admin/payments/:id/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await db.query(
      `
      UPDATE payments
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [status, id]
    );

    res.json({ success: true, message: `Payment ${status}` });

  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — GET WASTE RECORDS
// ==================================================
app.get("/api/admin/waste", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { startDate, endDate, mealType } = req.query;

    let query = `
      SELECT id, meal_date, meal_type, total_served, total_consumed, waste_amount, waste_percentage, notes, created_at
      FROM waste_records
    `;
    let params = [];

    if (startDate && endDate) {
      query += " WHERE meal_date BETWEEN $1 AND $2";
      params = [startDate, endDate];
    }

    if (mealType && mealType !== 'all') {
      query += params.length ? " AND" : " WHERE";
      query += " meal_type = $" + (params.length + 1);
      params.push(mealType);
    }

    query += " ORDER BY meal_date DESC, meal_type ASC";

    const { rows } = await db.query(query, params);

    res.json(rows);

  } catch (err) {
    console.error("Get waste records error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// ADMIN — ADD WASTE RECORD
// ==================================================
app.post("/api/admin/waste", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { meal_date, meal_type, total_served, total_consumed, waste_amount, waste_percentage, notes } = req.body;

    // Validate required fields
    if (!meal_date || !meal_type || total_served === undefined || total_consumed === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that consumed doesn't exceed served
    if (total_consumed > total_served) {
      return res.status(400).json({ error: 'Total consumed cannot exceed total served' });
    }

    // Check if record already exists
    const { rows: existing } = await db.query(
      'SELECT id FROM waste_records WHERE meal_date = $1 AND meal_type = $2',
      [meal_date, meal_type]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Record already exists for this date and meal type' });
    }

    // Insert new record with ON CONFLICT DO UPDATE
    const { rows: resultRows } = await db.query(
      `INSERT INTO waste_records (meal_date, meal_type, total_served, total_consumed, waste_amount, waste_percentage, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (meal_date, meal_type)
       DO UPDATE SET
         total_served = EXCLUDED.total_served,
         total_consumed = EXCLUDED.total_consumed,
         waste_amount = EXCLUDED.waste_amount,
         waste_percentage = EXCLUDED.waste_percentage,
         notes = EXCLUDED.notes,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [meal_date, meal_type, total_served, total_consumed, waste_amount || 0, waste_percentage || 0, notes || '']
    );

    res.status(201).json({
      id: resultRows[0].id,
      message: 'Waste record added successfully'
    });
  } catch (error) {
    console.error('Error adding waste record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database before starting server
initDatabase().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// --------------------------------------------------
app.get("/", (req, res) => res.send("API running"));
