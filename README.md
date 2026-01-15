# Knockster Super Admin (Development Branch)

A hierarchical, multi-layer visitor & security access management system for enterprises.

## Quick Start (MySQL)

### 1. Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Configure Database

Edit `.env` with your MySQL connection:

```env
DATABASE_URL="mysql://root:password@localhost:3306/knockster_super"
JWT_SECRET="your-super-secret-jwt-key"
```

### 4. Create MySQL Database

```sql
CREATE DATABASE knockster_super CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Initialize Database

**Option A: Using SQL file (Recommended)**
```bash
mysql -u root -p knockster_super < db/init.sql
```

**Option B: Using Drizzle**
```bash
npm run db:push
```

### 6. Seed Database

```bash
npm run db:seed
```

### 7. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Test Credentials

After seeding:

**SuperAdmin:**
- Email: `superadmin@knockster.io`
- Password: `SuperAdmin@123`

**Org Admin:**
- Email: `admin@techcorp.com`
- Password: `Admin@123`

**Security Guard:**
- Username: `guard_main_001`
- Password: `Guard@123`

## Database Schema

The system includes 17 tables:

1. **super_admin** - Root system administrators
2. **organization_node** - Hierarchical tree (Tech Park → Block → Building → Company → Gate)
3. **subscription_plan** - L1-L4 security tier plans
4. **organization_plan** - Plan assignments
5. **org_admin** - Organization administrators
6. **security_personnel** - Security guards
7. **guard_device** - Guard devices tracking
8. **guest** - Guest users
9. **guest_device** - Guest app devices
10. **guest_invitation** - Access invitations
11. **guest_qr_session** - Rotating QR codes
12. **guest_otp** - One-time passwords
13. **invitation_scan_event** - Access audit trail
14. **notification_tokens** - Push notifications
15. **audit_log** - System-wide audit logs
16. **billing_record** - Subscription billing
17. **geo_gate_location** - Gate GPS coordinates

## Security Levels

- **L1**: QR code scan
- **L2**: QR + OTP
- **L3**: Guest app scan
- **L4**: App scan + OTP (Multi-factor)

## API Endpoints

All SuperAdmin APIs require `Authorization: Bearer {token}`

### Authentication
- `POST /api/superadmin/auth/login` - SuperAdmin login

### Organizations
- `GET /api/superadmin/organizations` - List organizations
- `POST /api/superadmin/organizations` - Create organization
- `GET /api/superadmin/organizations/{id}` - Get organization
- `PATCH /api/superadmin/organizations/{id}` - Update organization
- `DELETE /api/superadmin/organizations/{id}` - Delete organization

### Subscription Plans
- `GET /api/superadmin/plans` - List plans
- `POST /api/superadmin/plans` - Create plan

### Admins
- `GET /api/superadmin/admins` - List admins
- `POST /api/superadmin/admins` - Create admin

### Audit Logs
- `GET /api/superadmin/audit-logs` - View audit logs with filtering

## Database Commands

```bash
# Generate migration after schema changes
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Project Structure

```
knockster-super/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (innerpages)/          # Protected dashboard pages
│   └── api/superadmin/        # API routes
├── components/                 # React components
├── db/
│   ├── schema.ts              # Drizzle schema (17 tables)
│   ├── index.ts               # Database connection
│   ├── init.sql               # MySQL initialization
│   └── seed.ts                # Sample data seeder
├── lib/
│   ├── auth.ts                # JWT authentication
│   └── api-response.ts        # API response helpers
├── types.ts                   # TypeScript types
└── constants.ts               # Mock data (for frontend demo)
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MySQL 8.0+
- **ORM**: Drizzle ORM
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **UI**: React 19 + Tailwind CSS 4
- **Icons**: Lucide React

## Development

```bash
# Start dev server
npm run dev

# Type checking
npx tsc --noEmit

# Lint code
npm run lint

# Build for production
npm run build
```

## Documentation

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed database setup and API documentation
- [db/schema.ts](./db/schema.ts) - Full schema definitions with relationships

## Production Deployment

1. Change all default passwords
2. Use strong JWT_SECRET (32+ characters)
3. Enable MySQL SSL connections
4. Set up database backups
5. Configure proper user permissions
6. Enable 2FA for SuperAdmin
7. Set up rate limiting
8. Configure CORS properly

## License

Proprietary - Knockster Enterprise System
