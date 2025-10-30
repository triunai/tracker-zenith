# 🏦 Tracker Zenith - Personal Finance Management System

> **Modern. Intelligent. Comprehensive.**  
> A full-stack personal finance management application built with React, TypeScript, and Supabase, featuring AI-powered document processing and real-time financial insights.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 🌟 Key Features

### 💰 **Core Financial Management**
- **Transaction Tracking**: Record and categorize income/expenses with detailed metadata
- **Budget Management**: Create, monitor, and track budgets across multiple time periods
- **Payment Methods**: Manage various payment methods and track spending patterns
- **Category Management**: Flexible expense and income categorization system

### 🤖 **AI-Powered Document Processing**
- **Smart OCR**: Extract text from receipts, invoices, and financial documents
- **Intelligent Parsing**: AI-powered data extraction with confidence scoring
- **Auto-Categorization**: Suggest categories and payment methods based on document content
- **Seamless Integration**: Convert processed documents directly into transactions

### 📊 **Advanced Analytics & Insights**
- **Real-time Dashboard**: Live financial overview with trend analysis
- **Interactive Charts**: Spending patterns by category, payment method, and time
- **Budget Analytics**: Performance tracking with health scores and alerts
- **Custom Reports**: Flexible reporting with date range filtering

### 🎨 **Modern User Experience**
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark/Light Themes**: Comprehensive theming system
- **Real-time Updates**: Live data synchronization across sessions
- **Intuitive Navigation**: Clean, modern interface with smooth animations

## 🏗️ Architecture Overview

### **Frontend Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│    Pages    │ Components  │   Context   │     Hooks       │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│  • Index    │ • Auth      │ • Auth      │ • useAuth       │
│  • Budgets  │ • Budgets   │ • Dashboard │ • useDashboard  │
│  • Txns     │ • Charts    │ • Toast     │ • useTransaction│
│  • Reports  │ • Layout    │             │ • useQuery      │
│  • Profile  │ • UI        │             │                 │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

### **Backend Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                       │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ PostgreSQL  │ Edge Funcs  │ Auth        │ Real-time       │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ • Tables    │ • Process   │ • JWT       │ • Subscriptions │
│ • Views     │   Document  │ • RLS       │ • Broadcasts    │
│ • RPCs      │ • AI OCR    │ • Profiles  │ • Presence      │
│ • Triggers  │ • Mistral   │ • Sessions  │                 │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

## 📁 Project Structure

### **Root Level**
```
tracker-zenith/
├── 📄 README.md                    # This comprehensive guide
├── 📄 package.json                 # Dependencies and scripts
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 tailwind.config.ts           # Tailwind CSS configuration
├── 📄 vite.config.ts               # Vite build configuration
├── 📄 vercel.json                  # Deployment configuration
└── 📄 components.json              # shadcn/ui component configuration
```

### **Source Directory (`src/`)**
```
src/
├── 📁 components/                   # Reusable React components
│   ├── 📁 auth/                    # Authentication components
│   ├── 📁 Budgets/                 # Budget management components
│   ├── 📁 Charts/                  # Data visualization components
│   ├── 📁 Dashboard/               # Dashboard-specific components
│   ├── 📁 Layout/                  # Layout and navigation components
│   ├── 📁 Reports/                 # Reporting components
│   ├── 📁 Transactions/            # Transaction management components
│   └── 📁 ui/                      # Base UI components (shadcn/ui)
├── 📁 context/                     # React Context providers
├── 📁 hooks/                       # Custom React hooks
├── 📁 interfaces/                  # TypeScript type definitions
├── 📁 lib/                         # Core libraries and utilities
│   ├── 📁 api/                     # API layer and data access
│   ├── 📁 auth/                    # Authentication logic
│   ├── 📁 supabase/                # Supabase client configuration
│   ├── 📁 utils/                   # Utility functions
│   └── 📁 validation/              # Form validation schemas
├── 📁 pages/                       # Route components (pages)
│   ├── 📁 auth/                    # Authentication pages
│   ├── 📁 budgets/                 # Budget management pages
│   ├── 📁 payment-methods/         # Payment method pages
│   ├── 📁 profile/                 # User profile pages
│   ├── 📁 reports/                 # Reporting pages
│   └── 📁 transactions/            # Transaction pages
└── 📄 main.tsx                     # Application entry point
```

### **Supabase Directory (`supabase/`)**
```
supabase/
└── 📁 functions/                   # Edge Functions
    └── 📁 process-document/        # AI document processing
        ├── 📄 index.ts             # Main function logic
        └── 📄 README.md            # Function documentation
```

## 🎯 Core Components Deep Dive

### **🏠 Dashboard (`src/pages/Index.tsx`)**
**Purpose**: Main application hub providing financial overview and quick actions
**Features**:
- Real-time financial summary (balance, income, expenses)
- Trend analysis with period comparisons
- Quick transaction entry (income/expense)
- Budget overview and management
- Spending visualization charts

**Key Dependencies**:
- `DashboardContext` for state management
- `TransactionList` for recent transactions
- `BudgetTracker` for budget monitoring
- `SpendingChart` for visual analytics

### **💳 Transaction Management**
**Components**: `TransactionList`, `TransactionForm`, `TransactionFormFields`
**Features**:
- Advanced filtering (category, payment method, date range, type)
- Real-time updates with optimistic UI
- Inline editing and deletion
- Pagination and search
- Bulk operations support

**Data Flow**:
```
User Action → Form Validation → API Call → Database Update → Real-time Sync → UI Update
```

### **💰 Budget System**
**Components**: `BudgetTracker`, `BudgetForm`, `BudgetList`, `BudgetAnalytics`
**Features**:
- Multi-period budgets (daily, weekly, monthly, quarterly, yearly)
- Category-based budget allocation
- Real-time spending tracking
- Alert thresholds and notifications
- Performance analytics with health scores

### **📊 Analytics & Charts**
**Components**: `SpendingChart`, `BudgetAnalytics`, `DashboardSummary`
**Visualization Types**:
- Pie charts for spending distribution
- Bar charts for comparative analysis
- Progress bars for budget tracking
- Trend indicators for financial health

### **🤖 AI Document Processing**
**Components**: `DocumentUploader`
**Edge Function**: `process-document`
**Workflow**:
1. **Upload**: Drag-and-drop or file selection
2. **Storage**: Secure file storage in Supabase
3. **Processing**: AI-powered OCR and data extraction via Mistral AI
4. **Review**: User verification of extracted data with confidence scoring
5. **Integration**: Automatic transaction creation with suggested categorization

### **🔐 Authentication Pages**
**Components**: `Login.tsx`, `Signup.tsx`, `LoginForm`, `SignupForm`
**Features**:
- Email/password authentication
- Form validation with error handling
- Password visibility toggle
- Responsive design with centered layout
- Integration with Supabase Auth

## 🗺️ Application Routes & Pages

### **📄 Application Pages**
**Route Structure**:
```
/                           # Dashboard (Index.tsx)
├── /budgets               # Budget management page
├── /transactions          # Transaction list and management
├── /payment-methods       # Payment method configuration
├── /profile              # User profile management
├── /reports              # Financial reports and analytics
├── /auth/login           # Login page
└── /auth/signup          # Registration page
```

**Page Components**:
- **`Index.tsx`**: Main dashboard with overview widgets
- **`budgets/index.tsx`**: Comprehensive budget management
- **`transactions/index.tsx`**: Transaction list with document uploader
- **`payment-methods/index.tsx`**: Payment method CRUD operations
- **`profile/index.tsx`**: User profile settings and information

### **🗺️ Detailed Route Information**

#### **🏠 Dashboard (`/` - `src/pages/Index.tsx`)**
**Purpose**: Main application hub providing comprehensive financial overview
**Features**:
- **Welcome Message**: Personalized greeting with user's display name
- **Date Filter**: Dynamic date range selection (month, quarter, year, custom)
- **Quick Actions**: 
  - Add Income (with PlusCircle icon)
  - Add Expense (with MinusCircle icon)  
  - Add New Budget
- **Dashboard Summary**: Real-time financial metrics and trends
- **Transaction List**: Recent transactions with filtering capabilities
- **Budget Tracker**: Active budgets with progress indicators
- **Spending Chart**: Visual analytics of spending patterns

**Key Components**:
- `DashboardSummary` - Financial overview cards
- `TransactionList` - Recent transaction display
- `BudgetTracker` - Budget progress monitoring
- `SpendingChart` - Data visualization
- `DateFilter` - Date range selection
- `TransactionForm` - Quick transaction entry

#### **💰 Budget Management (`/budgets` - `src/pages/budgets/index.tsx`)**
**Purpose**: Comprehensive budget creation, monitoring, and analytics
**Features**:
- **Budget Creation**: Multi-step form with category selection
- **Budget List**: All user budgets with edit/delete actions
- **Budget Analytics**: Performance metrics and health scores
- **Period Support**: Daily, weekly, monthly, quarterly, yearly budgets
- **Category Allocation**: Assign specific categories to budgets
- **Alert Thresholds**: Configurable spending alerts
- **Progress Tracking**: Real-time spending vs budget comparison

**Key Components**:
- `BudgetForm` - Create/edit budget dialog
- `BudgetList` - Budget management table
- `BudgetTracker` - Progress visualization
- `BudgetAnalytics` - Performance insights

#### **💳 Transaction Management (`/transactions` - `src/pages/transactions/index.tsx`)**
**Purpose**: Complete transaction lifecycle management with AI document processing
**Layout**: Split-screen design (70% transactions, 30% document uploader)
**Features**:
- **Transaction List**: Comprehensive transaction table with advanced filtering
- **Document Uploader**: AI-powered receipt processing with OCR and intelligent parsing
- **Date Filtering**: Transaction date range selection
- **Real-time Updates**: Live transaction synchronization

**AI Processing Workflow**:
1. **Upload** → Secure file storage
2. **OCR** → Text extraction via Mistral AI
3. **Parse** → Data extraction via OpenRouter GPT-4o-mini
4. **Review** → User verification with confidence scores
5. **Create** → Automatic transaction generation

#### **💳 Payment Methods (`/payment-methods` - `src/pages/payment-methods/index.tsx`)**
**Purpose**: Manage payment methods for expense categorization
**Features**:
- **CRUD Operations**: Create, read, update, delete payment methods
- **Inline Editing**: Edit payment method names directly in the list
- **Validation**: Prevent duplicate payment method names
- **Usage Tracking**: See which payment methods are actively used

#### **👤 User Profile (`/profile` - `src/pages/profile/index.tsx`)**
**Purpose**: User account management and profile customization
**Features**:
- **Profile Information**: Display and edit user details
- **Display Name**: Customizable user display name
- **Avatar URL**: Profile picture management
- **Account Details**: Email (read-only), creation date
- **Back Navigation**: Return to previous page

#### **📊 Reports & Analytics (`/reports` - `src/pages/reports/index.tsx`)**
**Purpose**: Advanced financial reporting and data visualization
**Features**:
- **Custom Report Builder**: Create tailored financial reports
- **Expense Categories**: Detailed category-wise spending analysis
- **Income vs Expense Summary**: Comparative financial overview
- **Audit Trail**: Transaction history and changes

#### **🔐 Authentication Pages (`/auth/*`)**

**Login Page (`/auth/login` - `src/pages/auth/Login.tsx`)**
- **Purpose**: User authentication entry point
- **Features**: Email/password login with validation
- **Components**: `LoginForm` with error handling
- **Layout**: Centered card design with welcome message

**Signup Page (`/auth/signup` - `src/pages/auth/Signup.tsx`)**
- **Purpose**: New user registration
- **Features**: Account creation with email verification
- **Components**: `SignupForm` with validation
- **Layout**: Centered card design with account creation flow

**Forget Password (`/auth/forget-password` - `src/pages/auth/ForgetPassword.tsx`)**
- **Purpose**: Password reset functionality
- **Features**: 
  - Email-based password reset
  - Success confirmation with visual feedback
  - Link back to login page
- **State Management**: Form submission state with success/error handling
- **UI/UX**: Clean card-based layout with green success indicator

#### **❌ Not Found Page (`/404` - `src/pages/NotFound.tsx`)**
**Purpose**: Handle invalid routes gracefully
**Features**:
- **Error Logging**: Console logging of attempted routes
- **User-Friendly Message**: Clear 404 error display
- **Navigation**: Link back to home page
- **Responsive Design**: Centered layout with proper styling

### **🔒 Route Protection**

**Protected Routes** (Require Authentication):
- `/` (Dashboard)
- `/budgets`
- `/transactions` 
- `/payment-methods`
- `/profile`
- `/reports`

**Public Routes**:
- `/auth/login`
- `/auth/signup`
- `/auth/forget-password`
- `/404`

**Route Guards**:
- `ProtectedRoute` component wraps authenticated pages
- Automatic redirect to login for unauthenticated users
- Session persistence across browser refreshes

### **📱 Page Details**

#### **🏠 Dashboard (`/` - `src/pages/Index.tsx`)**
**Purpose**: Main application hub providing comprehensive financial overview
**Features**:
- **Welcome Message**: Personalized greeting with user's display name
- **Date Filter**: Dynamic date range selection (month, quarter, year, custom)
- **Quick Actions**: 
  - Add Income (with PlusCircle icon)
  - Add Expense (with MinusCircle icon)  
  - Add New Budget
- **Dashboard Summary**: Real-time financial metrics and trends
- **Transaction List**: Recent transactions with filtering capabilities
- **Budget Tracker**: Active budgets with progress indicators
- **Spending Chart**: Visual analytics of spending patterns

**Key Components**:
- `DashboardSummary` - Financial overview cards
- `TransactionList` - Recent transaction display
- `BudgetTracker` - Budget progress monitoring
- `SpendingChart` - Data visualization
- `DateFilter` - Date range selection
- `TransactionForm` - Quick transaction entry

**State Management**:
- Uses `DashboardContext` for date filtering and financial data
- React Query for data fetching and caching
- Real-time updates via Supabase subscriptions

---

#### **💰 Budget Management (`/budgets` - `src/pages/budgets/index.tsx`)**
**Purpose**: Comprehensive budget creation, monitoring, and analytics
**Features**:
- **Budget Creation**: Multi-step form with category selection
- **Budget List**: All user budgets with edit/delete actions
- **Budget Analytics**: Performance metrics and health scores
- **Period Support**: Daily, weekly, monthly, quarterly, yearly budgets
- **Category Allocation**: Assign specific categories to budgets
- **Alert Thresholds**: Configurable spending alerts
- **Progress Tracking**: Real-time spending vs budget comparison

**Key Components**:
- `BudgetForm` - Create/edit budget dialog
- `BudgetList` - Budget management table
- `BudgetTracker` - Progress visualization
- `BudgetAnalytics` - Performance insights

**CRUD Operations**:
- ✅ Create new budgets with category assignments
- ✅ Update budget amounts and periods
- ✅ Delete budgets with confirmation dialog
- ✅ Real-time spending calculations

---

#### **💳 Transaction Management (`/transactions` - `src/pages/transactions/index.tsx`)**
**Purpose**: Complete transaction lifecycle management with AI document processing
**Layout**: Split-screen design (70% transactions, 30% document uploader)
**Features**:
- **Transaction List**: Comprehensive transaction table with:
  - Advanced filtering (category, payment method, date, type)
  - Inline editing capabilities
  - Bulk operations support
  - Pagination and search
- **Document Uploader**: AI-powered receipt processing:
  - Drag-and-drop file upload
  - OCR text extraction via Mistral AI
  - Intelligent data parsing with OpenRouter
  - Automatic transaction creation
  - Confidence scoring and manual review

**Key Components**:
- `TransactionList` - Main transaction management interface
- `DocumentUploader` - AI document processing system
- `DateFilter` - Transaction date filtering

**AI Processing Workflow**:
1. **Upload** → Secure file storage
2. **OCR** → Text extraction via Mistral AI
3. **Parse** → Data extraction via OpenRouter GPT-4o-mini
4. **Review** → User verification with confidence scores
5. **Create** → Automatic transaction generation

---

#### **💳 Payment Methods (`/payment-methods` - `src/pages/payment-methods/index.tsx`)**
**Purpose**: Manage payment methods for expense categorization
**Features**:
- **CRUD Operations**: Create, read, update, delete payment methods
- **Inline Editing**: Edit payment method names directly in the list
- **Validation**: Prevent duplicate payment method names
- **Usage Tracking**: See which payment methods are actively used

**Key Components**:
- Form for adding new payment methods
- Editable list with inline editing capabilities
- Confirmation dialogs for destructive actions

**Data Management**:
- Real-time updates with React Query
- Optimistic UI updates for better UX
- Error handling with toast notifications

---

#### **👤 User Profile (`/profile` - `src/pages/profile/index.tsx`)**
**Purpose**: User account management and profile customization
**Features**:
- **Profile Information**: Display and edit user details
- **Display Name**: Customizable user display name
- **Avatar URL**: Profile picture management
- **Account Details**: Email (read-only), creation date
- **Back Navigation**: Return to previous page

**Form Fields**:
- **Email**: Read-only, managed by Supabase Auth
- **Display Name**: Editable text field
- **Avatar URL**: Optional profile picture URL

**Security**:
- Protected route requiring authentication
- Profile updates via Supabase Auth
- Form validation and error handling

---

#### **📊 Reports & Analytics (`/reports` - `src/pages/reports/index.tsx`)**
**Purpose**: Advanced financial reporting and data visualization
**Features**:
- **Custom Report Builder**: Create tailored financial reports
- **Expense Categories**: Detailed category-wise spending analysis
- **Income vs Expense Summary**: Comparative financial overview
- **Audit Trail**: Transaction history and changes
- **Export Capabilities**: Download reports in various formats

**Key Components**:
- `ReportsDashboard` - Main reporting interface
- `CustomReportBuilder` - Report customization tools
- `ExpenseCategories` - Category analysis
- `IncomeExpenseSummary` - Financial overview
- `AuditTrail` - Transaction history

---

#### **🔐 Authentication Pages (`/auth/*`)**

**Login Page (`/auth/login` - `src/pages/auth/Login.tsx`)**
- **Purpose**: User authentication entry point
- **Features**: Email/password login with validation
- **Components**: `LoginForm` with error handling
- **Layout**: Centered card design with welcome message

**Signup Page (`/auth/signup` - `src/pages/auth/Signup.tsx`)**
- **Purpose**: New user registration
- **Features**: Account creation with email verification
- **Components**: `SignupForm` with validation
- **Layout**: Centered card design with account creation flow

**Forget Password (`/auth/forget-password` - `src/pages/auth/ForgetPassword.tsx`)**
- **Purpose**: Password reset functionality
- **Features**: 
  - Email-based password reset
  - Success confirmation with visual feedback
  - Link back to login page
- **State Management**: Form submission state with success/error handling
- **UI/UX**: 
  - Clean card-based layout
  - Green success indicator with checkmark icon
  - Responsive design with proper spacing

---

#### **❌ Not Found Page (`/404` - `src/pages/NotFound.tsx`)**
**Purpose**: Handle invalid routes gracefully
**Features**:
- **Error Logging**: Console logging of attempted routes
- **User-Friendly Message**: Clear 404 error display
- **Navigation**: Link back to home page
- **Responsive Design**: Centered layout with proper styling

**Error Handling**:
- Automatic logging of invalid route attempts
- Clean, professional error page design
- Easy navigation back to the application

---

### **🔒 Route Protection**

**Protected Routes** (Require Authentication):
- `/` (Dashboard)
- `/budgets`
- `/transactions` 
- `/payment-methods`
- `/profile`
- `/reports`

**Public Routes**:
- `/auth/login`
- `/auth/signup`
- `/auth/forget-password`
- `/404`

**Route Guards**:
- `ProtectedRoute` component wraps authenticated pages
- Automatic redirect to login for unauthenticated users
- Session persistence across browser refreshes

### **🧭 Navigation Flow**

```mermaid
graph TD
    A[Landing] --> B{Authenticated?}
    B -->|No| C[/auth/login]
    B -->|Yes| D[/ Dashboard]
    C --> E[Login Success]
    E --> D
    D --> F[/budgets]
    D --> G[/transactions]
    D --> H[/payment-methods]
    D --> I[/profile]
    D --> J[/reports]
    F --> K[Budget Management]
    G --> L[Transaction Management]
    H --> M[Payment Method Config]
    I --> N[Profile Settings]
    J --> O[Financial Reports]
```

## 🔗 Data Flow & State Management

### **Context Providers**
**`AuthContext.tsx`** (Legacy - now re-exports from `lib/auth`):
- User authentication state
- Login/logout functions
- Profile management
- Session persistence

**`DashboardContext.tsx`**:
- Date filter state management (month, quarter, year, custom ranges)
- Financial summary data (balance, income, expenses, trends)
- Real-time data refresh capabilities
- URL state synchronization for date filters

### **React Query Integration**
- **Query Keys**: Consistent key patterns for cache management
  - `['expenses', userId, startDate, endDate]`
  - `['budgets', userId]`
  - `['dashboardSummary', userId, startDate, endDate]`
  - `['spendingByCategory', userId, startDate, endDate]`
- **Cache Invalidation**: Strategic invalidation on mutations
- **Real-time Updates**: Supabase subscriptions trigger cache invalidation

### **Authentication Flow**
```mermaid
graph TD
    A[User Login] --> B[Supabase Auth]
    B --> C{Valid Credentials?}
    C -->|Yes| D[JWT Token Generated]
    C -->|No| E[Error Message]
    D --> F[AuthContext Updates]
    F --> G[User Profile Loaded]
    G --> H[Protected Routes Accessible]
    H --> I[DashboardContext Initialized]
```

### **Dashboard State Management**
```mermaid
graph TD
    A[DashboardContext] --> B[Date Filter State]
    A --> C[Financial Summary]
    A --> D[Real-time Updates]
    B --> E[URL State Sync]
    B --> F[API Queries]
    C --> G[React Query Cache]
    D --> H[Supabase Subscriptions]
    E --> I[Component Re-renders]
    F --> I
    G --> I
    H --> J[Cache Invalidation]
    J --> I
```

### **Transaction Lifecycle**
```mermaid
graph LR
    A[Create Transaction] --> B[Form Validation]
    B --> C[API Call]
    C --> D[Database Insert]
    D --> E[Real-time Broadcast]
    E --> F[Cache Invalidation]
    F --> G[UI Update]
    G --> H[Dashboard Refresh]
```

## 🛠️ Technology Stack

### **Frontend Technologies**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI library for building interactive interfaces |
| **TypeScript** | 5.x | Type-safe JavaScript development |
| **Vite** | 5.x | Fast build tool and development server |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | High-quality, accessible component library |
| **React Query** | 5.x | Server state management and caching |
| **React Router** | 6.x | Client-side routing and navigation |
| **React Hook Form** | 7.x | Performant form handling |
| **date-fns** | 3.x | Date manipulation and formatting |
| **Recharts** | 2.x | Composable charting library |

### **Backend Technologies**
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service platform |
| **PostgreSQL** | Primary database with advanced features |
| **Row Level Security** | Fine-grained access control |
| **Real-time** | Live data synchronization |
| **Edge Functions** | Serverless compute with Deno runtime |
| **Mistral AI** | AI-powered document processing |

### **Development & Deployment**
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and quality enforcement |
| **Prettier** | Code formatting |
| **Vercel** | Frontend deployment and hosting |
| **GitHub Actions** | CI/CD pipeline |
| **TypeScript** | Static type checking |

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** 18.x or higher
- **npm** or **bun** package manager
- **Supabase** account and project
- **Git** for version control

### **Environment Setup**
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tracker-zenith.git
   cd tracker-zenith
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using bun (recommended)
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database schema**
   ```bash
   # Initialize Supabase (if not already done)
   supabase init
   
   # Run migrations
   supabase db reset
   ```

5. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

### **Supabase Setup**
1. Create a new Supabase project
2. Run the provided SQL schema (see database schema in project)
3. Set up Row Level Security policies
4. Configure authentication providers
5. Deploy Edge Functions:
   ```bash
   supabase functions deploy process-document
   ```

## 🗄️ Database Schema

### **Core Tables**
```sql
-- Users (managed by Supabase Auth)
auth.users

-- Expense Categories
expense_category (id, name, description, created_by, created_at, updated_at, isdeleted)

-- Income Categories  
income_category (id, name, description, created_by, created_at, updated_at, isdeleted)

-- Payment Methods
payment_methods (id, method_name, created_by, created_at, updated_at, isdeleted)

-- Expenses (main transaction table)
expense (id, user_id, date, description, payment_method_id, created_by, created_at, updated_at, isdeleted)

-- Expense Items (transaction line items)
expense_item (id, expense_id, category_id, income_category_id, amount, description, created_by, created_at, updated_at, isdeleted)

-- Budgets
budget (id, user_id, name, amount, period, start_date, end_date, created_by, created_at, updated_at, isdeleted)

-- Budget Categories (many-to-many relationship)
budget_category (budget_id, category_id, alert_threshold, created_by, created_at, updated_at, isdeleted)
```

### **Key Relationships**
- Users → Expenses (one-to-many)
- Expenses → Expense Items (one-to-many)
- Categories → Expense Items (many-to-many)
- Payment Methods → Expenses (many-to-one)
- Budgets → Categories (many-to-many via budget_category)

## 🔧 API Layer

### **API Structure (`src/lib/api/`)**
```
api/
├── 📄 budgetApi.ts              # Budget CRUD operations
├── 📄 expenseApi.ts             # Transaction management
├── 📄 paymentMethodApi.ts       # Payment method operations
└── 📄 transactionApi.ts         # Transaction utilities
```

### **Utilities & Validation (`src/lib/`)**
```
lib/
├── 📁 auth/                     # Authentication utilities
│   ├── 📁 api/                 # Auth API functions
│   ├── 📁 hooks/               # Auth React hooks (useAuth, useAuthState)
│   ├── 📁 state/               # Auth state management
│   └── 📁 utils/               # Auth utility functions
├── 📁 supabase/                # Supabase client configuration
│   └── 📄 supabase.ts          # Supabase client initialization
├── 📁 utils/                   # General utilities
│   ├── 📄 expense-helpers.ts   # Transaction processing utilities
│   └── 📄 index.ts             # Common utility functions (formatCurrency, etc.)
└── 📁 validation/              # Form validation schemas
    └── 📄 transactionValidation.ts # Transaction form validation
```

### **Key Utility Functions**
```typescript
// General Utilities
formatCurrency(amount: number): string
cn(...classes): string // Tailwind class name merging
getPaymentMethodName(methodId: number): string

// Expense Helpers
groupItemsByExpenseId(items: ExpenseItem[]): Record<number, ExpenseItem[]>
combineExpensesWithItems(expenses, items, paymentMethods): Expense[]
loadExpensesWithRelations(expenses: Expense[]): Promise<Expense[]>
handleSupabaseError(error: any, context: string): never

// Validation
validateTransaction(data: TransactionData): FormErrors
isFormValid(data: TransactionData): boolean
```

### **Key API Functions**
```typescript
// Budget Management
budgetApi.create(budget: CreateBudgetRequest)
budgetApi.getAllByUser(userId: string)
budgetApi.getByPeriod(userId: string, period: PeriodEnum)
budgetApi.update(id: number, data: UpdateBudgetRequest)
budgetApi.delete(id: number)
budgetApi.getCategories() // Expense categories for budget forms

// Transaction Management
expenseApi.getAllByUser(userId: string, options?: QueryOptions)
expenseApi.create(expense: CreateExpenseRequest)
expenseApi.update(id: number, data: UpdateExpenseRequest)
expenseApi.delete(id: number)
expenseApi.getSummaryByCategory(userId: string, startDate: string, endDate: string)
expenseApi.getSummaryByPaymentMethod(userId: string, startDate: string, endDate: string)
expenseApi.getCategories() // Get all expense categories
expenseApi.getPaymentMethods() // Get all payment methods

// Payment Method Management
paymentMethodApi.getAll()
paymentMethodApi.create(method: CreatePaymentMethodRequest)
paymentMethodApi.update(id: number, data: Partial<PaymentMethod>)
paymentMethodApi.delete(id: number)

// Real-time Subscriptions
expenseApi.subscribeToExpenses(userId: string, callback: Function)

// Supabase RPC Functions (stored procedures)
supabase.rpc('get_total_income', { p_user_id, p_start_date, p_end_date })
supabase.rpc('get_total_expenses', { p_user_id, p_start_date, p_end_date })
supabase.rpc('get_user_balance', { p_user_id, p_start_date, p_end_date })
supabase.rpc('get_period_comparison', { p_user_id, p_current_start, p_current_end, p_previous_start, p_previous_end, p_transaction_type })
supabase.rpc('calculate_budget_spending_by_date', { budget_id, p_start_date, p_end_date })
supabase.rpc('get_spending_by_category', { p_user_id, p_start_date, p_end_date })
supabase.rpc('insert_document_data', { p_user_id, p_file_path, p_original_filename, p_file_size, p_mime_type })
supabase.rpc('update_document_processing_status', { p_document_id, p_status })
supabase.rpc('create_transaction_from_document', { p_document_id, p_category_id, p_category_type, p_payment_method_id, p_amount, p_description })
```

## 🎨 UI Component System

### **Design System**
- **Colors**: Custom finance-themed color palette
- **Typography**: Inter font family with responsive scales
- **Spacing**: Consistent 4px grid system
- **Components**: shadcn/ui as the foundation
- **Icons**: Lucide React icon library
- **Animations**: Tailwind CSS transitions

### **Component Hierarchy**
```
Layout
├── Navigation (Sidebar/Header)
├── Main Content Area
│   ├── Page Header
│   ├── Action Bar
│   ├── Content Grid
│   │   ├── Cards
│   │   ├── Tables
│   │   ├── Charts
│   │   └── Forms
│   └── Modals/Dialogs
└── Toast Notifications
```

### **Responsive Breakpoints**
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large**: 1440px+

## 🔒 Security & Authentication

### **Authentication Features**
- **Email/Password** authentication via Supabase Auth
- **JWT-based** session management
- **Protected routes** with authentication guards
- **Profile management** with custom user data
- **Session persistence** across browser sessions

### **Security Measures**
- **Row Level Security (RLS)** on all database tables
- **Input validation** on all forms and API endpoints
- **SQL injection prevention** through parameterized queries
- **XSS protection** via proper input sanitization
- **CORS configuration** for API security

## 📱 Progressive Web App Features

### **PWA Capabilities**
- **Responsive design** works on all device sizes
- **Offline functionality** for core features (planned)
- **Fast loading** with Vite's optimized bundling
- **Modern browser features** utilizing latest web APIs

## 🚀 Deployment

### **Frontend Deployment (Vercel)**
1. **Connect repository** to Vercel
2. **Configure build settings**:
   ```json
   {
     "buildCommand": "bun run build",
     "outputDirectory": "dist",
     "installCommand": "bun install"
   }
   ```
3. **Set environment variables** in Vercel dashboard
4. **Deploy** automatically on push to main branch

### **Backend Deployment (Supabase)**
1. **Database migrations** are automatically applied
2. **Edge Functions** deployed via Supabase CLI:
   ```bash
   supabase functions deploy --project-ref your-project-ref
   ```
3. **Environment variables** configured in Supabase dashboard

## 🧪 Testing Strategy

### **Testing Approach**
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API and database interaction testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load and stress testing

### **Testing Tools**
- **Vitest**: Fast unit testing framework
- **Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking for tests

## 🤝 Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following the coding standards
4. **Test** your changes thoroughly
5. **Commit** with conventional commit messages
6. **Push** to your fork: `git push origin feature/amazing-feature`
7. **Open** a Pull Request with detailed description

### **Coding Standards**
- **TypeScript**: Strict typing, no `any` types
- **ESLint**: Follow the configured rules
- **Prettier**: Consistent code formatting
- **Naming**: Use descriptive, camelCase naming
- **Components**: Use functional components with hooks
- **Comments**: Document complex logic and business rules

### **Commit Convention**
```
type(scope): description

feat(transactions): add bulk delete functionality
fix(dashboard): resolve date filter bug
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): optimize query performance
test(budgets): add unit tests for budget calculations
```

## 📊 Performance Optimization

### **Frontend Optimizations**
- **Code Splitting**: Route-based lazy loading
- **Bundle Analysis**: Regular bundle size monitoring
- **Image Optimization**: WebP format with fallbacks
- **Caching**: React Query for intelligent caching
- **Memoization**: React.memo and useMemo for expensive operations

### **Backend Optimizations**
- **Database Indexing**: Strategic index placement
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Supabase handles connection management
- **Real-time Efficiency**: Targeted subscriptions

## 🐛 Troubleshooting

### **Common Issues**

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run dev -- --force
```

**Database Connection Issues**
- Verify Supabase URL and API keys
- Check Row Level Security policies
- Ensure user has proper permissions

**Authentication Problems**
- Clear browser localStorage
- Check Supabase Auth configuration
- Verify JWT token expiration

## 📈 Roadmap

### **Short Term (1-3 months)**
- [ ] Reports based on semantic search
- [ ] Notification events based on data transactions
- [ ] Better ui components and ux
- [ ] Detailed budget tracking

### **Medium Term (3-6 months)**
- [ ] Financial goal tracking
- [ ] ChatBot capable of tool calls and api calls

### **Long Term (6+ months)**
- [ ] Investment portfolio tracking
- [ ] Tax preparation assistance
- [ ] Financial advisor integration
- [ ] Multi-user family accounts

## 📞 Support & Community

### **Getting Help**
- **Documentation**: Comprehensive guides and API references
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas
- **Discord**: Community chat server (link in repository)

### **Links**
- **Live Demo**: [https://tracker-zenith.onrender.com/](https://tracker-zenith.onrender.com/)
- **Documentation**: [https://tracker-zenith.onrender.com/](https://tracker-zenith.onrender.com/)
- **API Reference**: [https://tracker-zenith.onrender.com/](https://tracker-zenith.onrender.com/)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using React, TypeScript, and Supabase**

[![GitHub stars](https://img.shields.io/github/stars/your-username/tracker-zenith?style=social)](https://github.com/your-username/tracker-zenith)
[![GitHub forks](https://img.shields.io/github/forks/your-username/tracker-zenith?style=social)](https://github.com/your-username/tracker-zenith/fork)
[![GitHub issues](https://img.shields.io/github/issues/your-username/tracker-zenith)](https://github.com/your-username/tracker-zenith/issues)

</div> 