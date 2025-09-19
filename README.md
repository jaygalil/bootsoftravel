# Time Tracker with Accident Prevention System

A comprehensive time tracking system designed to handle accidental clock in/out scenarios with smart validation, correction workflows, and admin oversight.

## 🚀 Features

### **Accident Prevention**
- **Confirmation Dialogs** for suspicious actions
- **Grace Period** (5 minutes) for quick undo
- **Time Validation** (prevents future timestamps, excessive shifts)
- **Duplicate Detection** (multiple clock ins/outs within grace period)
- **Location/IP Tracking** for context

### **Smart Correction System**
- **Self-Correction** (auto-approved within 15 minutes)
- **Approval Workflow** for older corrections
- **Admin Override** capabilities
- **Multiple Correction Types** (clock in/out, breaks, manual entries, cancellations)

### **Admin Dashboard**
- **Real-time Monitoring** of anomalies
- **Approval Queue** management
- **Department Metrics** and trends
- **Audit Trail** for all changes
- **Automated Anomaly Detection**

## 📁 Project Structure

```
exile/
├── schema.sql                 # Database schema with all tables
├── time_tracker_api.py       # Core time tracking API with validation
├── correction_system.py      # Correction request and approval system
├── admin_dashboard.py        # Admin interface with analytics
├── index.html                # Employee time tracking interface
└── README.md                 # This file
```

## 🔧 Setup Instructions

### **1. Database Setup**
```sql
-- Run the schema.sql file to create all necessary tables
-- Supports SQL Server, PostgreSQL, MySQL, SQLite
```

### **2. Install Dependencies**
```bash
pip install flask sqlite3 python-dateutil
```

### **3. Run the Applications**

**Employee Interface:**
```bash
python time_tracker_api.py
# Access at http://localhost:5000
# Main interface at http://localhost:5000/index.html (serve the HTML file)
```

**Admin Dashboard:**
```bash
python admin_dashboard.py
# Access at http://localhost:5001/admin
```

## 🎯 Key Components

### **TimeTracker Class** (`time_tracker_api.py`)
- **Validation Engine**: Prevents common accidents
- **Grace Period**: 5-minute undo window
- **API Endpoints**: RESTful interface for all operations
- **Audit Logging**: Complete change history

### **CorrectionSystem Class** (`correction_system.py`)
- **Smart Approval**: Auto-approve recent corrections
- **Workflow Management**: Track correction lifecycle
- **Admin Override**: Direct corrections for urgent cases
- **History Tracking**: Complete correction audit trail

### **AdminDashboard Class** (`admin_dashboard.py`)
- **Anomaly Detection**: Long shifts, missing clock outs, multiple entries
- **Real-time Metrics**: Correction rates by department
- **Approval Interface**: One-click approve/reject
- **Trend Analysis**: Historical patterns and insights

## 📊 Database Schema

### **Core Tables**
- `employees` - Employee information and departments
- `time_entries` - Clock in/out records with status tracking
- `correction_requests` - All correction requests with approval workflow
- `audit_logs` - Complete audit trail for all changes

### **Key Features**
- **Self-referencing corrections** via `original_entry_id`
- **Status tracking** (active, completed, corrected, cancelled)
- **Approval workflow** with timestamps and approver tracking
- **Audit logging** with before/after value tracking

## 🔄 Workflow Examples

### **Normal Clock In/Out**
1. Employee clicks "Clock In"
2. System validates (not already clocked in, reasonable time)
3. Creates time entry with status "active"
4. Shows undo option for 5 minutes

### **Accidental Clock In**
1. Employee already clocked in, clicks again
2. System shows warning: "Already clocked in 2 minutes ago"
3. Employee can confirm to force or cancel
4. If confirmed, cancels previous entry and creates new one

### **Correction Request**
1. Employee realizes mistake after grace period
2. Submits correction request with reason
3. If within 15 minutes → Auto-approved and applied
4. Otherwise → Sent to supervisor for approval
5. Admin reviews in dashboard and approves/rejects

### **Admin Override**
1. Admin identifies anomaly in dashboard
2. Uses direct override to fix immediately
3. System logs admin action with reason
4. Employee and audit trail updated

## 🛡️ Security & Validation

### **Prevention Mechanisms**
- **Time Validation**: No future dates, reasonable shift lengths
- **Location Tracking**: IP address and location logging
- **Duplicate Prevention**: Grace period checks
- **Confirmation Dialogs**: For suspicious actions

### **Audit & Compliance**
- **Complete Audit Trail**: All changes logged with user and timestamp
- **Immutable History**: Original records preserved
- **Approval Chain**: Clear approval hierarchy
- **Department Segregation**: Role-based access controls

## 🎨 User Interface

### **Employee Interface** (`index.html`)
- **Status Display**: Clear current state (clocked in/out)
- **Smart Buttons**: Disabled/enabled based on state
- **Confirmation Modals**: For potentially accidental actions
- **Recent Activity**: Last 10 actions with timestamps
- **Quick Undo**: Prominent button during grace period
- **Correction Request**: Easy form for requesting changes

### **Admin Dashboard**
- **Key Metrics**: Correction rates, pending approvals
- **Anomaly Alerts**: Long shifts, missing clock outs
- **Approval Queue**: All pending requests with context
- **Department Views**: Metrics by team/department
- **Real-time Updates**: Auto-refresh every 30 seconds

## 🚀 Advanced Features

### **Anomaly Detection**
- **Long Shifts**: Automatic detection of >12 hour shifts
- **Missing Clock Outs**: Entries without end times
- **Multiple Clock Ins**: Duplicate entries on same day
- **Time Patterns**: Unusual timing patterns

### **Smart Notifications**
- **Warning Messages**: Clear explanations of issues
- **Grace Period Timer**: Countdown for undo window
- **Approval Reminders**: For pending corrections
- **Anomaly Alerts**: Real-time issue detection

### **Reporting & Analytics**
- **Correction Trends**: By time period, department, employee
- **Approval Rates**: Success/rejection statistics
- **Anomaly Patterns**: Recurring issues identification
- **Department Metrics**: Comparative performance

## 🔧 Configuration Options

### **Grace Periods**
- **Quick Undo**: 300 seconds (5 minutes)
- **Self-Correction**: 900 seconds (15 minutes)
- **Max Shift Length**: 16 hours

### **Validation Rules**
- **Future Date Prevention**: Enabled
- **Location Tracking**: Optional
- **IP Logging**: Enabled
- **Duplicate Detection**: 5-minute window

## 📈 Benefits

### **For Employees**
- **Mistake Recovery**: Easy correction of accidents
- **Clear Feedback**: Immediate validation and warnings
- **Self-Service**: Request corrections without manager involvement
- **Transparency**: View own correction history

### **For Managers**
- **Reduced Interruptions**: Fewer correction requests
- **Clear Oversight**: Dashboard view of team patterns
- **Quick Approvals**: One-click correction processing
- **Anomaly Awareness**: Proactive issue identification

### **For Organizations**
- **Data Integrity**: Accurate time tracking
- **Compliance**: Complete audit trails
- **Efficiency**: Automated correction workflows
- **Cost Reduction**: Less manual time tracking administration

## 🏃‍♂️ Getting Started

1. **Set up database** using `schema.sql`
2. **Start API server** with `python time_tracker_api.py`
3. **Launch admin dashboard** with `python admin_dashboard.py`
4. **Open employee interface** at the main HTML file
5. **Test the workflow** with mock data

The system includes mock data and fallbacks, so you can see it working immediately even without a full database setup!

---

*Built with Python Flask, SQLite/SQL Server, and modern web technologies for a robust time tracking solution.*

# 🚀 Welcome to JELITE Code Scaffold


## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## 🤖 Powered by JELite



- **💻 Code Generation** - Generate components, pages, and features instantly
- **🎨 UI Development** - Create beautiful interfaces with AI assistance  
- **🔧 Bug Fixing** - Identify and resolve issues with intelligent suggestions
- **📝 Documentation** - Auto-generate comprehensive documentation
- **🚀 Optimization** - Performance improvements and best practices



## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🎨 Available Features & Components

This scaffold includes a comprehensive set of modern web development tools:

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### 🔐 Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Axios + TanStack Query
- **State Management**: Simple and scalable with Zustand

### 🌍 Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns




---


