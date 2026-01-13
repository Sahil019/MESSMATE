# Messmate - Mess Management System

Messmate is a comprehensive web-based mess management system designed for hostels, colleges, and other communal dining facilities. It streamlines meal attendance tracking, billing, payment processing, and administrative operations to ensure efficient mess operations.

## Features

### For Students
- **Meal Attendance Tracking**: Mark attendance for breakfast, lunch, and dinner with options like "will attend", "consumed", "skip", or "not attended"
- **Leave Management**: Submit leave requests with date ranges and reasons
- **Billing & Payments**: View monthly billing summaries, payment history, and make payments via UPI
- **Menu Selection**: Choose from different meal packages (Basic, Premium, Deluxe)
- **Dashboard**: Overview of attendance statistics, billing information, and quick actions

### For Administrators
- **User Management**: Add, edit, delete, and manage student accounts
- **Attendance Oversight**: Monitor and manage student meal attendance
- **Billing Management**: Generate and manage monthly billing records, update payment status
- **Leave Approval**: Review and approve/reject student leave requests
- **Payment Processing**: Handle payment submissions and status updates
- **Waste Analysis**: Track food waste with detailed analytics and reporting
- **Daily Reports**: Generate comprehensive daily attendance and billing reports
- **System Settings**: Configure payment QR codes and system preferences

## Tech Stack

### Frontend (Client)
- **React 18** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Declarative routing for React
- **Context API** - State management for authentication
- **Axios** - HTTP client for API calls
- **React Toast** - Notification system

### Backend (Server)
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **multer** - File upload handling
- **CORS** - Cross-origin resource sharing

## Database Schema

The system uses MySQL with the following main tables:

- **users**: User accounts with roles (student/admin)
- **attendance_logs**: Daily meal attendance records
- **billing_records**: Monthly billing summaries
- **leave_requests**: Student leave applications
- **payments**: Payment transaction records
- **waste_records**: Food waste tracking data
- **meal_plans**: Available meal package options
- **payment_settings**: Payment configuration (QR codes, UPI details)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn package manager

### Backend Setup

1. Navigate to the Server directory:
```bash
cd Server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the Server directory with:
```env
PORT=3000
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=messmate_db
```

4. Initialize the database:
```bash
npm run init-db  # If you have this script, otherwise run the schema manually
```

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the Client directory:
```bash
cd Client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (Vite default port).

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Student Endpoints
- `GET /api/attendance` - Get attendance history
- `POST /api/attendance` - Mark meal attendance
- `GET /api/billing/summary` - Get billing summary
- `GET /api/billing/history` - Get billing history
- `POST /api/leave` - Submit leave request
- `GET /api/leave` - Get leave requests
- `POST /api/menu/select-package` - Select meal package
- `POST /api/payment/submit` - Submit payment

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/billing` - Get billing records
- `POST /api/admin/billing/update-payment` - Update payment status
- `GET /api/admin/leaves` - Get all leave requests
- `POST /api/admin/leaves/:id/status` - Approve/reject leave
- `GET /api/admin/reports/daily` - Get daily reports
- `GET /api/admin/waste` - Get waste records
- `POST /api/admin/waste` - Add waste record

## Usage

### First Time Setup
1. Register an admin account through the registration form
2. Log in as admin to access the admin dashboard
3. Add student users through the User Management section
4. Configure payment settings (QR code upload)

### Daily Operations
1. **Students**: Log in and mark their meal attendance daily
2. **Admins**: Monitor attendance, manage leave requests, and generate reports
3. **Billing**: System automatically calculates monthly bills based on attendance
4. **Payments**: Students can view and pay bills through integrated payment system

## Project Structure

```
Messmate/
├── Client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Admin/      # Admin-specific components
│   │   │   ├── Auth/       # Authentication components
│   │   │   ├── Student/    # Student-specific components
│   │   │   └── Layout/     # Layout components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   └── integrations/   # External integrations
│   ├── public/             # Static assets
│   └── package.json
├── Server/                 # Backend Node.js application
│   ├── db.js               # Database connection
│   ├── index.js            # Main server file
│   ├── schema.sql          # Database schema
│   ├── uploads/            # File uploads directory
│   └── package.json
├── TODO.md                 # Project tasks and notes
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
