# 🚽 Cleanliness of Toilets (CoT) Module: Architecture & Workflow
**Built for Taskforce 2025**

## 1. Module Overview
The Cleanliness of Toilets (CoT) module digitizes the management of public sanitation infrastructure (CT/PT/Urinals). It replaces manual attendance with a **GPS-locked, evidence-based inspection system**, ensuring that assigned staff physically visit and clean their designated toilets daily.

---

## 2. Core Entities & Roles

### 🏛️ Toilet Types
*   **CT (Community Toilet)**: For residential/slum usage.
*   **PT (Public Toilet)**: Market/transit areas.
*   **Urinals**: Standalone units.

### 👥 Roles & Responsibilities (Code-Aligned)

| Role | Access | Responsibilities |
| :--- | :--- | :--- |
| **Taskforce Member / Employee** | Mobile App | • **Register** new toilets (if missing)<br>• **Inspect** assigned toilets daily<br>• View own history |
| **QC (Quality Control)** | Web Portal / Mobile | • **Approve** new toilet registrations<br>• **Review** daily inspections (Accept/Reject)<br>• Monitor Ward/Zone specific stats |
| **City Admin** | Web Portal | • **Assign** staff to toilets<br>• **Bulk Import** data<br>• Master Dashboard monitoring |
| **Action Officer** | Web/Mobile | • Supervisory role (Ward/Zone level oversight) |

---

## 3. Workflow 1: Enrollment (Registration & Assignment)

How a toilet gets into the system and gets a cleaner assigned.

1.  **Field Registration (Mobile)**
    *   **Who**: Taskforce/Employee.
    *   **Action**: Opens "Register Toilet" → Captures Name, Type, Ward, **GPS Location**, Seats.
    *   **Status**: `PENDING`.
    *   *Code validation*: `POST /register` stores request linked to User ID.

2.  **Approval (Web Portal)**
    *   **Who**: QC / City Admin.
    *   **Action**: Views "Pending Registrations". Checks location accuracy.
    *   **Outcome**: `APPROVE` or `REJECT`.
    *   *Result*: Toilet enters Master Database (`APPROVED`).

3.  **Staff Assignment (Web Portal)**
    *   **Who**: City Admin (`POST /assignments/bulk`).
    *   **Action**: Selects one or multiple toilets → Selects an Employee.
    *   **Result**: Link created. Toilet immediately appears in that Employee's mobile app.

---

## 4. Workflow 2: Daily Inspection Loop

The core daily activity.

1.  **Start Inspection (Mobile)**
    *   **Who**: Taskforce/Employee.
    *   **View**: Sees only **"My Assigned Toilets"** (`GET /assigned`).
    *   **Action**: Clicks "Inspect".

2.  **GPS Validation (The Check)**
    *   **Mechanism**: App captures current GPS. Backend calculates distance from Toilet's registered GPS (`haversineMeters`).
    *   *Rule*: Ensures staff is on-site (Audit trail of distance recorded).

3.  **Report Submission**
    *   **Data**: Cleanliness Status (Yes/No), Water Supply, Lighting.
    *   **Evidence**: **Live Camera Photo** (Mandatory).
    *   **Status**: `SUBMITTED`.

---

## 5. Workflow 3: Quality Control & Audit

1.  **Review (Web Portal)**
    *   **Who**: QC Officer.
    *   **Stats**: View Dashboard (`GET /stats`) for Submission count vs Approval count.
    *   **Review**: Open specific report. Check Photo evidence & Distance deviation.
    *   **Action**:
        *   ✅ **APPROVE**: Compliant.
        *   ❌ **REJECT**: Non-compliant.
        *   ⚠️ **ACTION REQUIRED**: Critical infra issue (e.g., Broken pipe).

---

## 6. Key Technical Features
*   **Geotagging**: Every inspection stores `latitude`, `longitude`, and `distanceMeters` deviation.
*   **Role-Based Scope**: QC officers only see data for their assigned **Zone/Ward** (Backend logic confirmed).
*   **Real-Time Dashboard**: "Performance Rate" calculated instantly based on Approved vs Rejected ratios.
*   **Bulk Operations**: CSV Import and Bulk Assignment capabilities for fast city-wide rollout.

---
*Based on `hms-backend/src/modules/toilet/router.ts` and `prisma/schema.prisma` logic.*
