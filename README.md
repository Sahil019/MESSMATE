# MESSMATE
🚀 Messmate — Smart Mess Management System

Messmate is a full-stack, production-ready Mess Management System designed for hostels, colleges, and institutional dining facilities.
It automates attendance, billing, payments, leave handling, reporting, and waste analysis — all in one powerful platform.

✨ Why Messmate?

Traditional mess systems suffer from:

Manual attendance errors

Billing disputes

Poor transparency

No real-time reporting

Inefficient admin workflows

Messmate solves all of this by providing:

Automated meal tracking

Transparent billing

Secure payments

Role-based dashboards

Actionable analytics

Built with real-world use cases, not just as a demo project.

🧠 Key Highlights

🔐 Secure authentication using JWT

🧑‍🎓 Student & Admin role separation

📊 Automated billing based on attendance

💳 Integrated UPI payment workflow

🗓 Leave management with approval flow

🗑 Waste analysis & reporting

📈 Daily & monthly admin reports

☁️ Deployable on free cloud tiers

👥 User Roles & Features
👨‍🎓 Student Features

✅ Mark meal attendance (Breakfast / Lunch / Dinner)

🕒 Attendance statuses: Will Attend, Consumed, Skipped, Not Attended

🧾 View monthly billing & payment history

💸 Pay mess fees via UPI

🗓 Submit leave requests

📦 Select meal packages (Basic / Premium / Deluxe)

📊 Dashboard overview of stats & bills

🛠 Admin Features

👤 Add / Edit / Delete students

🍽 Monitor attendance in real time

🧮 Generate & manage billing records

💰 Update payment statuses

🗓 Approve / reject leave requests

📉 Track food waste & wastage percentage

📊 Daily operational reports

⚙️ Configure payment QR & system settings

🧰 Tech Stack
Frontend (Client)

React 18

Vite

Tailwind CSS

React Router

Context API

Axios

Toast Notifications

Backend (Server)

Node.js

Express.js

MySQL

JWT Authentication

bcrypt

multer

CORS

🗄 Database Design

Core tables used:

users

attendance_logs

billing_records

leave_requests

payments

waste_records

meal_plans

payment_settings

Designed with relational integrity and scalability in mind.

⚙️ Installation & Setup
Prerequisites

Node.js (v16+)

MySQL (v8+)

npm

🔧 Backend Setup
cd Server
npm install


Create a .env file inside Server/:

PORT=3000
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASS=your-db-password
DB_NAME=messmate_db
DB_PORT=3306


Import schema.sql into MySQL.

Start server:

npm start

🎨 Frontend Setup
cd Client
npm install
npm run dev


Frontend runs on:

http://localhost:5173

🔌 API Overview
Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

Student APIs

GET /api/attendance

POST /api/attendance

GET /api/billing/summary

GET /api/billing/history

POST /api/leave

POST /api/menu/select-package

POST /api/payment/submit

Admin APIs

GET /api/admin/users

PUT /api/admin/users/:id

DELETE /api/admin/users/:id

GET /api/admin/billing

POST /api/admin/billing/update-payment

GET /api/admin/leaves

POST /api/admin/leaves/:id/status

GET /api/admin/reports/daily

GET /api/admin/waste

POST /api/admin/waste

☁️ Deployment

Messmate can be deployed 100% FREE using:

Frontend → Netlify / Vercel

Backend → Render

Database → Railway MySQL / Aiven

Free Tier Notes

Backend may sleep after inactivity (cold starts)

Perfect for portfolios, demos, and academic projects

Easily upgradeable for production usage

📁 Project Structure
Messmate/
├── Client/
│   ├── src/
│   ├── public/
│   └── package.json
├── Server/
│   ├── index.js
│   ├── db.js
│   ├── schema.sql
│   ├── uploads/
│   └── package.json
├── TODO.md
└── README.md

🚀 Future Enhancements

📱 Mobile app version

📊 Advanced analytics dashboards

🔔 Notifications & reminders

📦 Subscription-based plans

🧾 Invoice generation

🤝 Contributing

Contributions are welcome!

Fork the repo

Create a feature branch

Commit your changes

Open a Pull Request
