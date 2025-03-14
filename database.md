# Database Schema

## Tables

### users
- `id` (uuid primary key)
- `email` (text, unique)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `full_name` (text)
- `avatar_url` (text)

Indexes:
- Primary key on `id`

### products
- `id` (uuid primary key)
- `user_id` (uuid, foreign key references users(id))
- `name` (text)
- `description` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `slug` (text, unique)

Indexes:
- Primary key on `id`
- Foreign key on `user_id`

### customer_profiles
- `id` (uuid primary key)
- `product_id` (uuid, foreign key references products(id), ON DELETE CASCADE)
- `name` (text)
- `overview` (jsonb)
- `background` (jsonb)
- `problems` (jsonb)
- `scoring` (jsonb)
- `is_selected` (boolean, default false)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)

Indexes:
- Primary key on `id`
- Foreign key on `product_id`

### bugs
- `id` (uuid primary key)
- `name` (text, not null)
- `description` (text)
- `bug_url` (text)
- `screenshot_url` (text)
- `status` (text, default 'not_started')
- `priority` (text, default 'not-prioritized')
- `position` (integer)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `product_id` (uuid, foreign key, ON DELETE CASCADE)

Indexes:
- Primary key on `id`
- Foreign key on `product_id`

### features
- `id` (uuid primary key)
- `product_id` (uuid, foreign key references products(id), ON DELETE CASCADE)
- `name` (text)
- `description` (text)
- `priority` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `implementation_status` (text, default 'not_started')
- `position` (integer)

Indexes:
- Primary key on `id`
- Foreign key on `product_id`

### tasks
- `id` (uuid primary key)
- `name` (text, not null)
- `description` (text)
- `status` (text, default 'not_started')
- `priority` (text, default 'not-prioritized')
- `position` (integer, default 0)
- `product_id` (uuid, foreign key references products(id))
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)

Indexes:
- Primary key on `id`
- Foreign key on `product_id`

### prompt_templates
- `id` (uuid primary key)
- `user_id` (uuid, foreign key references users(id))
- `name` (text)
- `description` (text)
- `template` (text)
- `category` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `is_public` (boolean, default false)

Indexes:
- Primary key on `id`
- Foreign key on `user_id`

### error_logs
- `id` (uuid primary key)
- `user_id` (uuid, foreign key references users(id), ON DELETE SET NULL)
- `error_type` (text, not null)
- `error_code` (text)
- `error_message` (text, not null)
- `stack_trace` (text)
- `severity` (text, not null)
- `metadata` (jsonb, default '{}')
- `request_payload` (jsonb)
- `browser_info` (jsonb)
- `created_at` (timestamp with time zone, default now())

Indexes:
- Primary key on `id`
- Foreign key on `user_id`

### payment_history
- `id` (uuid primary key)
- `user_id` (uuid, foreign key references users(id), ON DELETE CASCADE)
- `subscription_id` (uuid, foreign key references user_subscriptions(id), ON DELETE SET NULL)
- `amount` (numeric, not null)
- `currency` (text, default 'usd')
- `status` (text, not null)
- `stripe_payment_intent_id` (text, unique)
- `stripe_payment_method` (text)
- `error_message` (text)
- `created_at` (timestamp with time zone, default now())

Indexes:
- Primary key on `id`
- Foreign key on `user_id`

### user_subscriptions
- `id` (uuid primary key)
- `user_id` (uuid, foreign key references users(id), ON DELETE CASCADE)
- `plan_id` (uuid, foreign key references subscription_plans(id))
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `status` (text, not null)
- `current_period_start` (timestamp with time zone)
- `current_period_end` (timestamp with time zone)
- `cancel_at_period_end` (boolean, default false)
- `payment_type` (text, not null)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

Indexes:
- Primary key on `id`
- Foreign key on `user_id`

## Row Level Security (RLS) Policies

### Users

1. Users can read own data
   - Action: SELECT
   - Roles: authenticated
   - Definition: (auth.uid() = id)

2. Users can update own data
   - Action: UPDATE
   - Roles: authenticated
   - Definition: (auth.uid() = id)
   - Check: (auth.uid() = id)

### Products

1. Users can read own products
   - Action: SELECT
   - Roles: authenticated
   - Definition: (user_id = auth.uid())

2. Users can insert own products
   - Action: INSERT
   - Roles: authenticated
   - Definition: null
   - Check: (user_id = auth.uid())

3. Users can update own products
   - Action: UPDATE
   - Roles: authenticated
   - Definition: (user_id = auth.uid())
   - Check: (user_id = auth.uid())

4. Users can delete own products
   - Action: DELETE
   - Roles: authenticated
   - Definition: (user_id = auth.uid())

### Customer Profiles

1. Users can manage own customer profiles
   - Action: ALL
   - Roles: authenticated
   - Definition: (EXISTS (SELECT 1 FROM products WHERE (products.id = customer_profiles.product_id AND products.user_id = auth.uid())))

### Bugs

1. Users can view bugs for their own products
   - Action: SELECT
   - Roles: authenticated
   - Definition: (product_id IN (SELECT products.id FROM products WHERE (products.user_id = auth.uid())))

2. Users can insert bugs for their own products
   - Action: INSERT
   - Roles: authenticated
   - Definition: null
   - Check: (product_id IN (SELECT products.id FROM products WHERE (products.user_id = auth.uid())))

3. Users can update bugs for their own products
   - Action: UPDATE
   - Roles: authenticated
   - Definition: (product_id IN (SELECT products.id FROM products WHERE (products.user_id = auth.uid())))
   - Check: (product_id IN (SELECT products.id FROM products WHERE (products.user_id = auth.uid())))

4. Users can delete bugs for their own products
   - Action: DELETE
   - Roles: authenticated
   - Definition: (product_id IN (SELECT products.id FROM products WHERE (products.user_id = auth.uid())))

### Features

1. Users can read own features
   - Action: SELECT
   - Roles: authenticated
   - Definition: (EXISTS (SELECT 1 FROM products WHERE (products.id = features.product_id AND products.user_id = auth.uid())))

2. Users can insert own features
   - Action: INSERT
   - Roles: authenticated
   - Definition: null
   - Check: (EXISTS (SELECT 1 FROM products WHERE (products.id = features.product_id AND products.user_id = auth.uid())))

3. Users can update own features
   - Action: UPDATE
   - Roles: authenticated
   - Definition: (EXISTS (SELECT 1 FROM products WHERE (products.id = features.product_id AND products.user_id = auth.uid())))
   - Check: (EXISTS (SELECT 1 FROM products WHERE (products.id = features.product_id AND products.user_id = auth.uid())))

4. Users can delete own features
   - Action: DELETE
   - Roles: authenticated
   - Definition: (EXISTS (SELECT 1 FROM products WHERE (products.id = features.product_id AND products.user_id = auth.uid())))

### Notes

1. Users can read own notes
   - Action: SELECT
   - Roles: authenticated
   - Definition: (((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE (products.id = notes.product_id AND products.user_id = auth.uid())))))

2. Users can insert own notes
   - Action: INSERT
   - Roles: authenticated
   - Definition: null
   - Check: (((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE (products.id = notes.product_id AND products.user_id = auth.uid())))))

3. Users can update own notes
   - Action: UPDATE
   - Roles: authenticated
   - Definition: (((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE (products.id = notes.product_id AND products.user_id = auth.uid())))))

4. Users can delete own notes
   - Action: DELETE
   - Roles: authenticated
   - Definition: (((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE (products.id = notes.product_id AND products.user_id = auth.uid())))))

### Payment History

1. Users can view own payment history
   - Action: SELECT
   - Roles: authenticated
   - Definition: (user_id = auth.uid())

### Error Logs

1. Users can view own error logs
   - Action: SELECT
   - Roles: authenticated
   - Definition: (user_id = auth.uid())

### Subscription Plans

1. Anyone can view active plans
   - Action: SELECT
   - Roles: authenticated
   - Definition: (is_active = true)

2. Only admins can modify plans
   - Action: ALL
   - Roles: authenticated
   - Definition: (auth.uid() IN (SELECT users.id FROM users WHERE (users.email ~~ '%@fluxr.ai')))

### System Policies

1. System can manage subscriptions
   - Action: ALL
   - Roles: service_role
   - Definition: true

2. System can record payments
   - Action: INSERT
   - Roles: service_role
   - Definition: null
   - Check: true

3. System can insert error logs
   - Action: INSERT
   - Roles: authenticated
   - Definition: null
   - Check: true
