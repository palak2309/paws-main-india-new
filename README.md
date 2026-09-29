# Finance Guardian

You are a Senior Staff Frontend Engineer, Senior UI/UX Designer, and Design System Architect.

Your task is to build ONLY the frontend of an enterprise SaaS application called **AutoAudit**.

IMPORTANT RULES

• Build ONLY frontend.

• DO NOT create backend.

• DO NOT create API endpoints.

• DO NOT create Express, Node, NestJS, Django, Laravel or any server.

• DO NOT create database schemas.

• DO NOT use MongoDB, PostgreSQL, MySQL, Prisma, Firebase, Supabase or any database.

• DO NOT implement authentication logic.

• DO NOT generate JWT code.

• DO NOT generate Refresh Token code.

• DO NOT implement MFA.

• DO NOT implement RBAC logic.

• Only create frontend UI that visually represents these features.

• Use mock JSON, dummy data, placeholder services, fake authentication context, and static state.

• Simulate loading states, success states, empty states and error states using local mock data.

The output should be production-quality frontend architecture.

====================================================

PROJECT

AutoAudit

An AI-powered Financial Leakage Detection Platform that integrates with ERP and Accounting software to discover hidden financial losses such as:

• Duplicate Payments

• Duplicate Invoices

• Vendor Overcharging

• Invoice Errors

• Tax Errors

• Contract Violations

• Subscription Waste

• Fraud Indicators

• Spend Anomalies

• Financial Leakage

Existing ERP systems only record financial transactions.

AutoAudit intelligently analyzes them and provides AI-powered explanations, alerts, dashboards and recovery recommendations.

====================================================

TARGET USERS

• Admin

• CFO

• Finance Manager

• Accountant

• Procurement Manager

• Auditor

• Viewer

Design every screen according to enterprise software standards.

====================================================

TECH STACK

Use

Next.js (App Router)

or

React + Vite

TypeScript

TailwindCSS

shadcn/ui

Framer Motion

Lucide Icons

Recharts

React Hook Form

Zod (frontend validation only)

TanStack Table

React Query (mock only)

====================================================

DESIGN STYLE

Modern enterprise SaaS

Premium

Minimal

Professional

Financial Technology

AI Dashboard

Glassmorphism (light usage)

Soft Shadows

Rounded XL Cards

Professional spacing

8px design system

Accessible typography

Excellent UX

Responsive

Dark Mode

Light Mode

Animated transitions

Micro interactions

Smooth loading skeletons

Beautiful empty states

Professional tables

Premium charts

Modern navigation

High information density

====================================================

COLOR PALETTE

Primary

#4F46E5

Secondary

#7C3AED

Accent

#06B6D4

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Background

#F8FAFC

Dark Background

#0F172A

Cards

White / Slate-900

====================================================

TYPOGRAPHY

Inter

Large headings

Readable tables

Professional dashboards

====================================================

APPLICATION LAYOUT

Create a scalable SaaS layout.

Desktop Sidebar

Top Navigation

Breadcrumbs

Search

Notifications

Profile Menu

Workspace Switcher

Theme Toggle

Responsive Mobile Navigation

====================================================

SIDEBAR

Dashboard

AI Insights

Financial Leaks

Transactions

Invoices

Payments

Contracts

Vendors

Recovery Center

Reports

Analytics

Notifications

Users

Roles & Permissions

Integrations

Settings

====================================================

PHASE 3

Authentication UI ONLY

Build frontend pages for

Login

Register

Forgot Password

Reset Password

Verify Email

OTP Verification

MFA Verification

Choose MFA Method

Session Expired

Access Denied

Unauthorized

Role Selection

User Profile

Account Security

Sessions

Password Changed

Loading Authentication

No backend.

Only beautiful UI.

====================================================

Authentication Screens

Login

Email

Password

Remember Me

Forgot Password

Social Login placeholders

Company Logo

Illustration

Background Pattern

Animated Hero Section

Register

Full Name

Company Name

Organization

Email

Phone

Password

Confirm Password

Terms Checkbox

Create Account Button

OTP Verification

6-digit OTP boxes

Resend timer

Verify button

Animated success

Forgot Password

Email input

Send Reset Link

Success Screen

Reset Password

New Password

Confirm Password

Password Strength Meter

Success Screen

MFA

Authenticator App

SMS

Email

Recovery Codes

QR Code placeholder

Verification Code Input

Success Screen

====================================================

Role UI

Create beautiful role badges

Admin

CFO

Finance Manager

Accountant

Procurement Manager

Auditor

Viewer

Each role should have

Icon

Color

Description

Permissions Preview

This is UI only.

====================================================

Permissions UI

Create permission matrix table

View

Create

Edit

Delete

Approve

Recover

Manage Users

Manage Roles

Export

Configure

Use checkboxes.

No backend.

====================================================

Dashboard Preview After Login

Financial Health Score

Potential Savings

Money Recovered

AI Risk Score

Active Alerts

Fraud Alerts

Leak Detection Summary

Charts

KPIs

Recent Activity

Notifications

AI Recommendations

====================================================

Animations

Use Framer Motion.

Animated page transitions

Hover cards

Animated charts

Loading shimmer

Skeletons

Fade

Scale

Slide

====================================================

Components

Create reusable components.

Button

Input

Card

Modal

Drawer

Dialog

Tabs

Table

Badge

Avatar

Dropdown

Tooltip

Toast

Alert

Pagination

Search

Breadcrumb

Sidebar

Navbar

Stat Card

Chart Card

Metric Card

AI Insight Card

Alert Card

====================================================

Use Mock Data

Create realistic mock JSON.

Mock Users

Mock Alerts

Mock Financial Leaks

Mock Transactions

Mock Vendors

Mock Contracts

Mock KPIs

Mock AI Explanations

====================================================

Folder Structure

Use scalable enterprise architecture.

app/

components/

features/

hooks/

lib/

constants/

types/

data/

layouts/

providers/

styles/

public/

====================================================

Coding Standards

Use reusable components.

No duplicated code.

Proper TypeScript.

Clean folder structure.

Proper naming.

Responsive.

Accessible.

Maintainable.

Enterprise-grade.

====================================================

OUTPUT REQUIREMENTS

Whenever I request a page or feature:

1. Generate ONLY frontend code.

2. Never generate backend.

3. Never generate database code.

4. Never create API routes.

5. Use mock data only.

6. Make the UI look like a premium enterprise SaaS product comparable to Stripe, Linear, Vercel, Notion, Ramp, or Microsoft.

7. Ensure every page is fully responsive, polished, and production-ready.

8. Focus on exceptional UX, accessibility, and reusable components.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://finance-leak-finder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b97629c6-a067-4071-8634-58a388fa6a2e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
