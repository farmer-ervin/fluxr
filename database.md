# Database Schema

## Tables

### users
- `id` (uuid, primary key)
- `email` (text, unique)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `full_name` (text)
- `avatar_url` (text)

### products
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text)
- `description` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone)
- `slug` (text, unique)

### bugs
- `id` (uuid, primary key)
- `name` (text, not null)
- `description` (text)
- `bug_url` (text)
- `screenshot_url` (text)
- `status` (text, default 'not_started')
- `priority` (text, default 'not-prioritized')
- `position` (integer)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `product_id` (uuid, foreign key, ON DELETE CASCADE)

### customer_profiles
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key, ON DELETE CASCADE)
- `name` (text)
- `overview` (jsonb)
- `background` (jsonb)
- `problems` (jsonb)
- `scoring` (jsonb)
- `is_selected` (boolean, default false)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

### features
- `id` (uuid, primary key)
- `product_id` (uuid, foreign key, ON DELETE CASCADE)
- `name` (text)
- `description` (text)
- `priority` (text)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())
- `implementation_status` (text, default 'not_started')
- `position` (integer)

### tasks
- `id` (uuid, primary key)
- `name` (text, not null)
- `description` (text)
- `status` (text, default 'not_started')
- `priority` (text, default 'not-prioritized')
- `position` (integer, default 0)
- `product_id` (uuid, foreign key)
- `created_at` (timestamp with time zone, default now())
- `updated_at` (timestamp with time zone, default now())

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

## Row Level Security (RLS) Policies

### Prompt Templates
1. **Users can read public prompt templates**
   - Action: SELECT
   - Definition: Allows users to read prompt templates that are marked as public (is_public = true)

2. **Users can manage own prompt templates**
   - Action: ALL
   - Definition: Allows users to manage their own prompt templates (user_id = auth.uid())

### Bugs
1. **Users can view bugs for their own products**
   - Action: SELECT
   - Definition: Allows users to view bugs if the product_id is associated with their own products

2. **Users can insert bugs for their own products**
   - Action: INSERT
   - Definition: Allows users to insert bugs if the product_id is associated with their own products

3. **Users can update bugs for their own products**
   - Action: UPDATE
   - Definition: Allows users to update bugs if the product_id is associated with their own products

4. **Users can delete bugs for their own products**
   - Action: DELETE
   - Definition: Allows users to delete bugs if the product_id is associated with their own products

### Tasks
1. **Users can read their own tasks**
   - Action: SELECT
   - Definition: Allows users to read tasks if the product_id is associated with their own products

2. **Users can insert their own tasks**
   - Action: INSERT
   - Definition: Allows users to insert tasks if the product_id is associated with their own products

3. **Users can update their own tasks**
   - Action: UPDATE
   - Definition: Allows users to update tasks if the product_id is associated with their own products

4. **Users can delete their own tasks**
   - Action: DELETE
   - Definition: Allows users to delete tasks if the product_id is associated with their own products

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