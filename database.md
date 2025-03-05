# Database Schema

## Public Schema Overview

### customer_profiles
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key)
- `name` (text)
- `overview` (jsonb)
- `background` (jsonb)
- `problems` (jsonb)
- `scoring` (jsonb)
- `is_selected` (boolean, default false)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

### error_logs
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `error_type` (text)
- `error_code` (text)
- `error_message` (text)
- `stack_trace` (text)
- `severity` (text)
- `metadata` (jsonb, default '{}')
- `request_payload` (jsonb)
- `browser_info` (jsonb)
- `created_at` (timestamp with time zone, default now())

### feature_dependencies
- `id` (uuid, primary key)
- `feature_id` (uuid, foreign key)
- `depends_on_id` (uuid, foreign key)
- `created_at` (timestamp with time zone, default now())

### features
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key)
- `name` (text)
- `description` (text)
- `priority` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `implementation_status` (text, default 'not_started')
- `position` (integer)
- `type` (text, default 'feature')

### flow_connections
- `id` (uuid, primary key)
- `source_id` (uuid, foreign key)
- `target_id` (uuid, foreign key)
- `created_at` (timestamp with time zone, default now())
- `product_id` (uuid, foreign key)

### flow_layouts
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key)
- `layout_data` (jsonb)
- `created_at` (timestamp with time zone, default now())

### flow_pages
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key)
- `name` (text)
- `description` (text)
- `position_x` (double precision, default 0)
- `position_y` (double precision, default 0)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `layout_description` (text)
- `features` (jsonb, default '[]')
- `implementation_status` (text, default 'not_started')

### notes
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `product_id` (uuid, foreign key)
- `title` (text, default 'Untitled Note')
- `content` (text, default '')
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

### openai_logs
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `request_type` (text)
- `request_payload` (jsonb)
- `response_payload` (jsonb)
- `error` (text)
- `created_at` (timestamp with time zone, default now())
- `model` (text, default 'gpt-4')
- `input_tokens` (integer)
- `output_tokens` (integer)

### payment_history
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `subscription_id` (uuid, foreign key)
- `amount` (numeric)
- `currency` (text, default 'usd')
- `status` (text)
- `stripe_payment_intent_id` (text)
- `stripe_payment_method` (text)
- `error_message` (text)
- `created_at` (timestamp with time zone, default now())

### prds
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key)
- `problem` (text, default '')
- `solution` (text, default '')
- `target_audience` (text, default '')
- `tech_stack` (text, default '')
- `success_metrics` (text, default '')
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `custom_sections` (jsonb, default '{}')

### product_prompts
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key)
- `template_id` (uuid, foreign key)
- `name` (text)
- `description` (text)
- `prompt` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

### products
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text)
- `description` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `slug` (text, unique)

### prompt_templates
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text)
- `description` (text)
- `template` (text)
- `category` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `is_public` (boolean, default false)

### subscription_plans
- `id` (uuid, primary key)
- `name` (text)
- `description` (text)
- `price` (numeric)
- `currency` (text, default 'usd')
- `interval` (text)
- `stripe_product_id` (text)
- `stripe_price_id` (text)
- `is_active` (boolean, default true)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

### user_subscriptions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `plan_id` (uuid, foreign key)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `status` (text)
- `current_period_start` (timestamp with time zone)
- `current_period_end` (timestamp with time zone)
- `cancel_at_period_end` (boolean, default false)
- `payment_type` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `trial_end` (timestamp with time zone)

### users
- `id` (uuid, primary key)
- `email` (text, unique)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `full_name` (text)
- `avatar_url` (text)

## Row Level Security (RLS) Policies

### Subscription and Payment Policies
- **Anyone can view active plans**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(is_active = true)`

- **Only admins can modify plans**
  - Action: ALL
  - Roles: authenticated
  - Definition: `(auth.uid() IN (SELECT users.id FROM users WHERE (users.email ~~ '%@fluxr.ai'::text)))`
  - Check: `(auth.uid() IN (SELECT users.id FROM users WHERE (users.email ~~ '%@fluxr.ai'::text)))`

- **Users can view own subscription**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())`

- **System can manage subscriptions**
  - Action: ALL
  - Roles: service_role
  - Definition: `true`
  - Check: `true`

- **Users can view own payment history**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())`

- **System can record payments**
  - Action: INSERT
  - Roles: service_role
  - Definition: `null`
  - Check: `true`

### User Data and Authentication Policies
- **Users can manage own prompt templates**
  - Action: ALL
  - Roles: public
  - Definition: `(user_id = auth.uid())`

- **Users can manage own product prompts**
  - Action: ALL
  - Roles: public
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = product_prompts.product_id) AND (products.user_id = auth.uid()))))`

- **Users can read own data**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(auth.uid() = id)`

- **Users can update own data**
  - Action: UPDATE
  - Roles: authenticated
  - Definition: `(auth.uid() = id)`

### Product and Feature Management Policies
- **Users can read own products**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())`

- **Users can insert own products**
  - Action: INSERT
  - Roles: authenticated
  - Definition: `null`
  - Check: `(user_id = auth.uid())`

- **Users can update own products**
  - Action: UPDATE
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())`

- **Users can delete own products**
  - Action: DELETE
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())`

### Feature Management Policies
- **Users can read own features**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = features.product_id) AND (products.user_id = auth.uid()))))`

- **Users can insert own features**
  - Action: INSERT
  - Roles: authenticated
  - Definition: `null`
  - Check: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = features.product_id) AND (products.user_id = auth.uid()))))`

- **Users can update own features**
  - Action: UPDATE
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = features.product_id) AND (products.user_id = auth.uid()))))`
  - Check: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = features.product_id) AND (products.user_id = auth.uid()))))`

- **Users can delete own features**
  - Action: DELETE
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = features.product_id) AND (products.user_id = auth.uid()))))`

- **Users can manage own features**
  - Action: ALL
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = features.product_id) AND (products.user_id = auth.uid()))))`

### Flow and Page Management Policies
- **Users can manage own customer profiles**
  - Action: ALL
  - Roles: public
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = customer_profiles.product_id) AND (products.user_id = auth.uid()))))`

- **Users can manage own flow pages**
  - Action: ALL
  - Roles: public
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = flow_pages.product_id) AND (products.user_id = auth.uid()))))`

- **Users can manage own flow connections**
  - Action: ALL
  - Roles: public
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = flow_connections.product_id) AND (products.user_id = auth.uid()))))`

### Note Management Policies
- **Users can read own notes**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE ((products.id = notes.product_id) AND (products.user_id = auth.uid()))))))`

- **Users can insert own notes**
  - Action: INSERT
  - Roles: authenticated
  - Definition: `null`
  - Check: `(((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE ((products.id = notes.product_id) AND (products.user_id = auth.uid()))))))`

- **Users can update own notes**
  - Action: UPDATE
  - Roles: authenticated
  - Definition: `(((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE ((products.id = notes.product_id) AND (products.user_id = auth.uid()))))))`

- **Users can delete own notes**
  - Action: DELETE
  - Roles: authenticated
  - Definition: `(((user_id = auth.uid()) AND (product_id IS NULL)) OR ((product_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM products WHERE ((products.id = notes.product_id) AND (products.user_id = auth.uid()))))))`

### PRD Management Policies
- **Users can read own PRDs**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = prds.product_id) AND (products.user_id = auth.uid()))))`

- **Users can insert own PRDs**
  - Action: INSERT
  - Roles: authenticated
  - Definition: `null`
  - Check: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = prds.product_id) AND (products.user_id = auth.uid()))))`

- **Users can update own PRDs**
  - Action: UPDATE
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = prds.product_id) AND (products.user_id = auth.uid()))))`

- **Users can delete own PRDs**
  - Action: DELETE
  - Roles: authenticated
  - Definition: `(EXISTS (SELECT 1 FROM products WHERE ((products.id = prds.product_id) AND (products.user_id = auth.uid()))))`

### Logging and Error Management Policies
- **System can insert error logs**
  - Action: INSERT
  - Roles: authenticated
  - Definition: `null`
  - Check: `true`

- **Users can view own error logs**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())`

- **Users can insert own logs**
  - Action: INSERT
  - Roles: authenticated
  - Definition: `null`
  - Check: `(user_id = auth.uid())`

- **Users can read own logs**
  - Action: SELECT
  - Roles: authenticated
  - Definition: `(user_id = auth.uid())` 