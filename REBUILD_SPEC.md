# Property Manager Rebuild Spec

## Square Integration
- Location ID: L0TPJWTVTRA7B
- Merchant ID: ML4P8DBYPSVJC
- Currency: USD
- Business: Total Property Solutions
- Address: 100 State St, Albany, NY 12207

## Architecture
- Frontend: React + Vite + Tailwind CSS (in frontend/)
- Backend: Express + Drizzle ORM + libsql (in backend/)
- Deployment: Netlify (static frontend + Netlify Functions for API)
- DB: Turso (cloud libsql) in production, local SQLite for dev

## Pages (Sidebar Order)
1. Dashboard
2. Properties
3. Tenants
4. Work Orders
5. Incidents (NEW)
6. Invoices (Square-connected)
7. Contacts
8. Vendors
9. Staff

## Features Required
- Sign in/out (simple auth with JWT tokens)
- All CRUD pages working with clean polished UI
- Incidents page: type, severity, status, linked to properties
- Square invoices: create invoice in Square when creating invoice in app
- SMS/Email notifications on work order lifecycle:
  - Assigned → notify assigned staff
  - In Progress → notify admin
  - Completed → notify admin + SMS
- Consistent badge colors across app
- Dashboard with real stats from all data
- Quick actions on dashboard that navigate to pages

## DO NOT TOUCH
- backend/src/services/email.ts (working, leave alone)
- backend/src/services/sms.ts (working, leave alone)
