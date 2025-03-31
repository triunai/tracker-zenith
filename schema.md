# Expense Tracking Schema

## Overview

This schema defines the structure for an expense tracking system with budgeting capabilities. The design centers around `expense` and `budget` as aggregate roots, with supporting tables for categorization and payment methods.

## Big Picture

1. **Expense** is the central "transaction" record. One expense → many **expense_item** rows, each row referencing a **expense_category**.
2. **payment_methods** is a lookup for how an expense was paid.
3. **budget** sets spending limits; **budget_category** picks which categories the budget tracks.
4. **active_expense** and `total_expense()` are convenience features to filter or sum your expense data easily.

## Tables

### 1. payment_methods

- **Purpose**: Lookup table for payment methods (e.g., cash, debit, e-wallet)
- **Columns**:
  - `id` (SERIAL, PK): Unique identifier
  - `method_name` (VARCHAR(50)): Name of payment method
  - Standard audit columns: `created_by`, `created_at`, `updated_by`, `updated_at`, `isdeleted`
- **Constraints**:
  - Unique constraint on `method_name`
- **Relationships**:
  - Referenced by `expense.payment_method_id`

```sql
CREATE TABLE public.payment_methods (
  id serial NOT NULL,
  method_name character varying(50) NOT NULL,
  created_by uuid NULL,
  created_at timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_at timestamp WITHOUT time zone NULL,
  isdeleted boolean NOT NULL DEFAULT false,
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_method_name_key UNIQUE (method_name)
) TABLESPACE pg_default;
```

### 2. expense (Aggregate Root)

- **Purpose**: Stores top-level details of each expense transaction
- **Columns**:
  - `id` (BIGSERIAL, PK): Unique identifier
  - `user_id` (UUID, FK to auth.users): User who made the expense
  - `date` (TIMESTAMP): When expense occurred
  - `description` (TEXT): Optional description
  - `payment_method_id` (INTEGER, FK): How expense was paid
  - Standard audit columns
- **Relationships**:
  - Parent of `expense_item` (one-to-many)
  - References `payment_methods`

```sql
CREATE TABLE public.expense (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  date timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  description text NULL,
  payment_method_id integer NULL,
  created_by uuid NULL,
  created_at timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_at timestamp WITHOUT time zone NULL,
  isdeleted boolean NOT NULL DEFAULT false,
  CONSTRAINT expense_pkey PRIMARY KEY (id),
  CONSTRAINT expense_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id),
  CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES auth.users (id)
) TABLESPACE pg_default;
```

### 3. expense_category

- **Purpose**: Global list of expense categories
- **Columns**:
  - `id` (BIGSERIAL, PK)
  - `name` (VARCHAR(100)): Category name
  - `description` (TEXT): Category description
  - Standard audit columns
- **Relationships**:
  - Referenced by `expense_item.category_id`

```sql
CREATE TABLE public.expense_category (
  id bigserial NOT NULL,
  name character varying(100) NOT NULL,
  description text NOT NULL,
  created_by uuid NULL,
  created_at timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_at timestamp WITHOUT time zone NULL,
  isdeleted boolean NOT NULL DEFAULT false,
  CONSTRAINT expense_category_pkey PRIMARY KEY (id),
  CONSTRAINT expense_category_name_key UNIQUE (name)
) TABLESPACE pg_default;
```

### 4. expense_item

- **Purpose**: Itemized breakdown of expenses
- **Columns**:
  - `id` (BIGSERIAL, PK)
  - `expense_id` (BIGINT, FK): Parent expense
  - `category_id` (BIGINT, FK): Expense category
  - `amount` (NUMERIC(10,2)): Item amount
  - `description` (TEXT): Optional item description
  - Standard audit columns
- **Relationships**:
  - Child of `expense`
  - References `expense_category`

```sql
CREATE TABLE public.expense_item (
  id bigserial NOT NULL,
  expense_id bigint NOT NULL,
  category_id bigint NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text NULL,
  created_by uuid NULL,
  created_at timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_at timestamp WITHOUT time zone NULL,
  isdeleted boolean NOT NULL DEFAULT false,
  CONSTRAINT expense_item_pkey PRIMARY KEY (id),
  CONSTRAINT fk_expense_item_category FOREIGN KEY (category_id) REFERENCES expense_category (id),
  CONSTRAINT fk_expense_item_expense FOREIGN KEY (expense_id) REFERENCES expense (id)
) TABLESPACE pg_default;
```

### 5. budget (Aggregate Root)

- **Purpose**: Tracks user's spending limits over time periods
- **Columns**:
  - `id` (BIGSERIAL, PK)
  - `user_id` (UUID, FK): Budget owner
  - `name` (VARCHAR(100)): Budget name
  - `amount` (NUMERIC(10,2)): Budget amount
  - `period` (ENUM): Time period (daily, weekly, monthly)
  - `start_date`, `end_date`: Budget validity period
  - Standard audit columns
- **Relationships**:
  - Parent of `budget_category`

```sql
CREATE TABLE public.budget (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  amount numeric(10, 2) NOT NULL,
  period public.period_enum NOT NULL,
  start_date date NULL DEFAULT now(),
  end_date date NULL,
  created_by uuid NULL,
  created_at timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_at timestamp WITHOUT time zone NULL,
  isdeleted boolean NOT NULL DEFAULT false,
  CONSTRAINT budget_pkey PRIMARY KEY (id),
  CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES auth.users (id)
) TABLESPACE pg_default;
```

### 6. budget_category (Join Table)

- **Purpose**: Links budgets to expense categories
- **Columns**:
  - `budget_id` (BIGINT, FK): Budget reference
  - `category_id` (BIGINT, FK): Category reference
  - `alert_threshold` (NUMERIC(10,2)): Optional spending alert level
  - Standard audit columns
- **Relationships**:
  - Many-to-many between `budget` and `expense_category`
  - Composite primary key on (`budget_id`, `category_id`)

```sql
CREATE TABLE public.budget_category (
  budget_id bigint NOT NULL,
  category_id bigint NOT NULL,
  alert_threshold numeric(10, 2) NULL,
  created_by uuid NULL,
  created_at timestamp WITHOUT time zone NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_at timestamp WITHOUT time zone NULL,
  isdeleted boolean NOT NULL DEFAULT false,
  CONSTRAINT budget_category_pkey PRIMARY KEY (budget_id, category_id),
  CONSTRAINT fk_budgetcat_budget FOREIGN KEY (budget_id) REFERENCES budget (id),
  CONSTRAINT fk_budgetcat_category FOREIGN KEY (category_id) REFERENCES expense_category (id)
) TABLESPACE pg_default;
```

## Views & Functions

### active_expense

- **Purpose**: Shows only non-deleted expenses
- **Definition**: Filtered view of `expense` where `isdeleted = false`

### total_expense(exp_id)

- **Purpose**: Calculates total amount for an expense
- **Parameters**:
  - `exp_id`: Expense ID to calculate
- **Returns**: Sum of all non-deleted `expense_item.amount` for the given expense