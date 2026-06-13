# PesoPilot-v1.0-Feature-Page-Designs.md

## Purpose

This document serves as the UI/UX source of truth for all PesoPilot screens.

The Stitch Dashboard design is the visual authority.

All future pages must follow the same:

* Layout language
* Component hierarchy
* Information density
* Financial operating system aesthetic

The goal is:

Not:

"Expense Tracker"

But:

"Personal Financial Operating System"

---

# Global Design Principles

## Design Style

PesoPilot should feel like:

* Bloomberg Terminal (simplified)
* Modern Finance SaaS
* Linear
* Stripe Dashboard
* Arc Browser settings
* Premium spreadsheet

Avoid:

* Social media styling
* Consumer banking styling
* Cartoon visuals
* Large empty spaces

---

## Layout Structure

Every major page follows:

┌─────────────────────────────┐
│ Page Header                 │
├─────────────────────────────┤
│ KPI Cards                   │
├─────────────────────────────┤
│ Filters                     │
├─────────────────────────────┤
│ Main Content                │
└─────────────────────────────┘

---

## Card Hierarchy

### Level 1

Primary metrics.

Examples:

* Total Income
* Total Expenses
* Remaining Cash
* Savings

### Level 2

Supporting data.

Examples:

* Variance
* Category Breakdown
* Status

### Level 3

Operational actions.

Examples:

* Add Expense
* Edit
* Assign Cutoff

---

## Financial Colors

Green

Income
Positive variance
Healthy cashflow

Red

Overspending
Warnings
Negative variance

Blue

Informational
Primary actions

Yellow

Watch state
Potential risks

Gray

Inactive
Historical
Archived

---

# Dashboard

## Purpose

Executive overview of financial health.

---

## KPI Row

Display:

* Expected Income
* Actual Income
* Expenses
* Savings
* Remaining Cash

---

## Financial Health Card

Display:

* Score
* Status
* Summary

Examples:

85
Stable

92
Excellent

65
Watch

---

## Budget Shock Warning

Display only when:

* Expense rate exceeds threshold
* Remaining cash becomes dangerous

---

## Allocation Matrix

Columns:

Category
Budget
Spent
Variance
Status

---

## Velocity Analysis

Display:

Daily spending trend.

No forecasting in MVP.

---

## AI Insight Panel

Reserved for future phases.

Use placeholders only.

---

# Expenses Page

## Purpose

Manage spending records.

---

## KPI Cards

Total Expenses

Transactions

Largest Category

Average Expense

---

## Filters

Search

Category

Payment Method

Date Range

Cutoff

---

## Main Content

Desktop:

DataGrid

Columns:

Date
Merchant
Category
Amount
Payment Method
Cutoff
Actions

Mobile:

Expense Cards

---

## Quick Actions

Add Expense

Edit

Delete

---

# Income Page

## Purpose

Manage income records.

---

## KPI Cards

Total Income

Salary Income

Other Income

Income Records

---

## Filters

Search

Source

Date Range

Cutoff

---

## Main Content

Desktop:

DataGrid

Columns:

Date
Source
Amount
Cutoff
Actions

Mobile:

Income Cards

---

# Savings Page

## Purpose

Track money intentionally set aside.

---

## KPI Cards

Total Savings

Current Cutoff Savings

Largest Savings Type

Savings Records

---

## Filters

Search

Type

Date Range

Cutoff

---

## Main Content

Desktop:

DataGrid

Columns:

Date
Type
Amount
Cutoff
Actions

Mobile:

Savings Cards

---

# Salary Cutoff Page

## Purpose

Define budgeting periods.

---

## KPI Cards

Current Cutoff

Expected Income

Days Remaining

Cutoff Status

---

## Main Content

Desktop:

DataGrid

Columns:

Name
Start
End
Expected Income
Status
Actions

---

## Operational Card

Current Active Cutoff

Assign Expenses

Assign Income

Assign Savings

---

# Cashflow Page

## Purpose

Show current financial position.

---

## KPI Cards

Expected Income

Actual Income

Expenses

Savings

Remaining Cash

---

## Financial Metrics

Expense Rate

Savings Rate

Income Variance

---

## Cutoff Summary

Expected Income

Actual Income

Total Expenses

Total Savings

Remaining Cash

---

## Status Card

Healthy

Watch

Critical

Derived from:

Remaining Cash

No forecasting in MVP.

---

# Reports Page

## Purpose

Historical analysis.

Future Phase.

Placeholder only.

---

# Expense Inbox

## Purpose

Future AI categorization workflow.

Placeholder only.

---

# Goals

## Purpose

Future financial goals.

Placeholder only.

---

# Payback Tracker

## Purpose

Track money owed and money to receive.

Future Phase.

Placeholder only.

---

# Settings

## Sections

General

Appearance

Salary Settings

AI Settings

Data Management

Import / Export

---

# Mobile Design Rules

Use cards instead of tables.

Stack KPI cards vertically.

Keep primary actions fixed and accessible.

Avoid horizontal scrolling.

---

# Future Enhancements

Not MVP:

* AI Coach
* Budget Shock Predictions
* Goal Protection
* Forecasting
* Financial Health Algorithms
* Scenario Simulation
* Investment Tracking
* Net Worth Tracking

These must not influence MVP page designs.
