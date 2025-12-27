# Knockster Super Admin - Database Setup Guide

## Overview

This document provides comprehensive setup instructions for the Knockster Super Admin database system - a hierarchical, multi-layer visitor & security access management platform.

## System Architecture

### Database Tables (17 Total)

1. **super_admin** - System root administrators
2. **organization_node** - Hierarchical tree structure (unlimited depth)
3. **subscription_plan** - Available security tier plans (L1-L4)
4. **organization_plan** - Active plan assignments
5. **org_admin** - Organization-level administrators
6. **security_personnel** - Security guards assigned to gates
7. **guard_device** - Devices used by security personnel
8. **guest** - Guest users receiving access invitations
9. **guest_device** - Guest mobile devices (for L3/L4 auth)
10. **guest_invitation** - Access invitations created by org admins
11. **guest_qr_session** - Rotating QR codes for guest access
12. **guest_otp** - One-time passwords for L2/L4 authentication
13. **invitation_scan_event** - Audit trail of all access attempts
14. **notification_tokens** - Push notification device tokens
15. **audit_log** - System-wide activity audit trail
16. **billing_record** - Payment and subscription history
17. **geo_gate_location** - Geographic coordinates for gates

### Security Levels

- **L1**: Basic rotating QR code access
- **L2**: QR + OTP verification
- **L3**: Guest App scanning + auto-validation
- **L4**: Multi-factor (L3 + OTP)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ database server
- Git

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `drizzle-orm` - TypeScript ORM
- `drizzle-kit` - Database migrations and schema management
- `postgres` - PostgreSQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `zod` - Runtime type validation

### 2. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE knockster_super;

# Create user (optional)
CREATE USER knockster_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE knockster_super TO knockster_admin;

# Exit
\q
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:

```env
DATABASE_URL="postgresql://knockster_admin:your_secure_password@localhost:5432/knockster_super"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
QR_EXPIRY_SECONDS=300
OTP_EXPIRY_SECONDS=300
```

### 4. Initialize Database

You have two options:

#### Option A: Use SQL File (Recommended for fresh setup)

```bash
psql -U knockster_admin -d knockster_super -f db/init.sql
```

This will:
- Create all 17 tables
- Set up enums and constraints
- Create performance indexes
- Insert default subscription plans
- Add a default SuperAdmin account

#### Option B: Use Drizzle Kit

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:push
```

### 5. Seed Database with Sample Data

```bash
npm run db:seed
```

This will create:
- SuperAdmin account
- 4 subscription plans (L1-L4)
- Sample organization hierarchy
- Sample org admins and security guards
- Sample guests and invitations
- Audit logs

**Test Credentials After Seeding:**

```
SuperAdmin:
  Email: superadmin@knockster.io
  Password: SuperAdmin@123

Org Admin:
  Email: admin@techcorp.com
  Password: Admin@123

Security Guard:
  Username: guard_main_001
  Password: Guard@123
```

## Database Management Commands

```bash
# Generate new migration after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

## API Endpoints

### Authentication

#### SuperAdmin Login
```http
POST /api/superadmin/auth/login
Content-Type: application/json

{
  "email": "superadmin@knockster.io",
  "password": "SuperAdmin@123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "superadmin@knockster.io",
      "twoFactorEnabled": false
    }
  },
  "message": "Login successful"
}
```

### Organizations

#### List Organizations
```http
GET /api/superadmin/organizations
Authorization: Bearer {token}

Query Parameters:
- parentId (optional): Filter by parent node
- includeChildren (optional): Include all nodes in tree

Response:
{
  "success": true,
  "data": [...]
}
```

#### Create Organization
```http
POST /api/superadmin/organizations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Tech Park",
  "type": "techpark",
  "parentId": null,
  "planOverrideLevel": null
}
```

#### Get Single Organization
```http
GET /api/superadmin/organizations/{id}
Authorization: Bearer {token}
```

#### Update Organization
```http
PATCH /api/superadmin/organizations/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active"
}
```

#### Delete Organization
```http
DELETE /api/superadmin/organizations/{id}
Authorization: Bearer {token}

Note: Cannot delete nodes with children
```

### Subscription Plans

#### List Plans
```http
GET /api/superadmin/plans
Authorization: Bearer {token}
```

#### Create Plan
```http
POST /api/superadmin/plans
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Custom L3",
  "allowL1": true,
  "allowL2": true,
  "allowL3": true,
  "allowL4": false,
  "maxGuards": 50,
  "maxGuestPasses": 1000,
  "price": "699.00"
}
```

### Org Admins

#### List Admins
```http
GET /api/superadmin/admins
Authorization: Bearer {token}

Query Parameters:
- organizationNodeId (optional): Filter by organization
```

#### Create Admin
```http
POST /api/superadmin/admins
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationNodeId": "uuid",
  "email": "newadmin@company.com",
  "password": "SecurePass123"
}
```

### Audit Logs

#### List Audit Logs
```http
GET /api/superadmin/audit-logs
Authorization: Bearer {token}

Query Parameters:
- page (default: 1)
- limit (default: 50)
- actorType (optional): SuperAdmin, OrgAdmin, Guard, System
- actorId (optional): Filter by actor ID
- action (optional): Filter by action type
- startDate (optional): ISO date string
- endDate (optional): ISO date string

Response:
{
  "success": true,
  "data": {
    "logs": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

## Schema Highlights

### Hierarchical Organization Tree

The `organization_node` table supports unlimited depth hierarchy:

```
Tech Park (root)
├── Block A
│   ├── Building 1
│   │   ├── Company X
│   │   │   ├── Gate - Main Entrance
│   │   │   └── Gate - Parking
│   │   └── Company Y
│   └── Building 2
└── Block B
```

Key features:
- Self-referencing `parent_id` foreign key
- Cascade deletion support
- Flexible node types

### Security Level Priority Override

When a guest has multiple active invitations:
- Highest security level invitation wins
- L4 accepts L1-L4
- L3 accepts L1-L3
- L2 accepts L1-L2
- L1 accepts only L1

### Cascading Deletes

Configured for data integrity:
- Deleting organization → deletes admins, guards, invitations
- Deleting invitation → deletes QR sessions, OTPs, scan events
- Deleting guest → deletes devices, tokens
- Deleting security personnel → deletes devices, tokens

## Development Workflow

### 1. Making Schema Changes

```bash
# Edit db/schema.ts
# Then generate migration
npm run db:generate

# Apply changes
npm run db:push
```

### 2. Testing Locally

```bash
# Start dev server
npm run dev

# In another terminal, test API
curl -X POST http://localhost:3000/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@knockster.io","password":"SuperAdmin@123"}'
```

### 3. Database Debugging

```bash
# Open visual database browser
npm run db:studio

# Or connect via psql
psql -U knockster_admin -d knockster_super
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords in seed file
- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable SSL for database connection
- [ ] Set up database backups
- [ ] Configure proper PostgreSQL user permissions
- [ ] Enable two-factor authentication for SuperAdmin
- [ ] Set up rate limiting on API endpoints
- [ ] Use environment variables (never commit .env)
- [ ] Enable CORS only for trusted domains
- [ ] Set up monitoring for audit logs

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
JWT_SECRET="use-a-very-long-random-string-here"
NODE_ENV="production"
```

## Troubleshooting

### Issue: "relation does not exist"
**Solution**: Run migrations again
```bash
npm run db:push
```

### Issue: Connection refused to PostgreSQL
**Solution**: Check if PostgreSQL is running
```bash
# macOS/Linux
sudo service postgresql status

# Windows
pg_ctl status
```

### Issue: Seed script fails
**Solution**: Drop and recreate database
```bash
psql -U postgres
DROP DATABASE knockster_super;
CREATE DATABASE knockster_super;
\q

# Then re-run initialization
psql -U knockster_admin -d knockster_super -f db/init.sql
npm run db:seed
```

## Support

For issues or questions:
1. Check the audit logs for error details
2. Review PostgreSQL logs
3. Enable verbose logging in drizzle.config.ts
4. Check API response error messages

## License

Proprietary - Knockster Enterprise System
