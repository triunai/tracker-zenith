CREATE TABLE public.user_profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     display_name VARCHAR(100),
     email VARCHAR(255) NOT NULL,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE,
     preferences JSONB DEFAULT '{}'::jsonb,
     is_active BOOLEAN DEFAULT TRUE
   );

create table public.expense_category (

  id bigserial not null,

  name character varying(100) not null,

  description text not null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  constraint expense_category_pkey primary key (id),

  constraint expense_category_name_key unique (name)

) TABLESPACE pg_default;

create table public.expense_item (

  id bigserial not null,

  expense_id bigint not null,

  category_id bigint not null,

  amount numeric(10, 2) not null,

  description text null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  income_category_id bigint null,

  constraint expense_item_pkey primary key (id),

  constraint fk_expense_item_category foreign KEY (category_id) references expense_category (id),

  constraint fk_expense_item_expense foreign KEY (expense_id) references expense (id),

  constraint fk_expense_item_income_category foreign KEY (income_category_id) references income_category (id),

  constraint check_single_category check (

    (

      (

        (category_id is null)

        and (income_category_id is not null)

      )

      or (

        (category_id is not null)

        and (income_category_id is null)

      )

    )

  )

) TABLESPACE pg_default;

create table public.expense (

  id bigserial not null,

  user_id uuid not null,

  date timestamp without time zone not null default now(),

  description text null,

  payment_method_id integer null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  constraint expense_pkey primary key (id),

  constraint expense_payment_method_id_fkey foreign KEY (payment_method_id) references payment_methods (id),

  constraint fk_expense_user foreign KEY (user_id) references auth.users (id)

) TABLESPACE pg_default;


create table public.budget_category (

  budget_id bigint not null,

  category_id bigint not null,

  alert_threshold numeric(10, 2) null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  constraint budget_category_pkey primary key (budget_id, category_id),

  constraint fk_budgetcat_budget foreign KEY (budget_id) references budget (id),

  constraint fk_budgetcat_category foreign KEY (category_id) references expense_category (id)

) TABLESPACE pg_default;

create table public.budget (

  id bigserial not null,

  user_id uuid not null,

  name character varying(100) not null,

  amount numeric(10, 2) not null,

  period public.period_enum not null,

  start_date date null default now(),

  end_date date null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  constraint budget_pkey primary key (id),

  constraint fk_budget_user foreign KEY (user_id) references auth.users (id)

) TABLESPACE pg_default;

create table public.payment_methods (

  id serial not null,

  method_name character varying(50) not null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  constraint payment_methods_pkey primary key (id),

  constraint payment_methods_method_name_key unique (method_name)

) TABLESPACE pg_default;

create table public.income_category (

  id bigserial not null,

  name character varying(100) not null,

  description text not null,

  created_by uuid null,

  created_at timestamp without time zone not null default now(),

  updated_by uuid null,

  updated_at timestamp without time zone null,

  isdeleted boolean not null default false,

  constraint income_category_pkey primary key (id),

  constraint income_category_name_key unique (name)

) TABLESPACE pg_default;