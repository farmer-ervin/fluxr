# Database Schema

This document describes the database schema for the product management application.

## Users Table
- `id`: Primary key, UUID from auth.users
- `email`: User's email address, unique
- `full_name`: User's full name (optional)
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Products Table
- `id`: Primary key, UUID
- `user_id`: Foreign key to users.id
- `name`: Product name
- `description`: Product description
- `slug`: URL-friendly identifier, unique
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## PRDs Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `problem`: Problem statement
- `solution`: Proposed solution
- `target_audience`: Target audience description
- `tech_stack`: Technology stack details
- `success_metrics`: Success metrics and KPIs
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Features Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `name`: Feature name
- `description`: Feature description
- `priority`: One of: 'must-have', 'nice-to-have', 'not-prioritized'
- `implementation_status`: One of: 'not_started', 'in_progress', 'completed', 'blocked', 'deferred'
- `position`: Order position within status group
- `type`: One of: 'feature', 'page', 'task', 'bug' (nullable)
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Feature Dependencies Table
- `id`: Primary key, UUID
- `feature_id`: Foreign key to features.id
- `depends_on_id`: Foreign key to features.id
- `created_at`: Timestamp of creation

## Customer Profiles Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `name`: Profile name
- `overview`: JSON containing paragraphs about the customer
- `background`: JSON containing background details
- `problems`: JSON containing problem descriptions
- `scoring`: JSON containing scoring metrics
- `is_selected`: Boolean indicating if this is the active profile
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Flow Pages Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `name`: Page name
- `description`: Page description
- `layout_description`: Design terminology and layout description
- `features`: JSON array of features included on this page
- `position_x`: X coordinate in the flow diagram
- `position_y`: Y coordinate in the flow diagram
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Flow Connections Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `source_id`: Foreign key to flow_pages.id
- `target_id`: Foreign key to flow_pages.id
- `created_at`: Timestamp of creation

## Flow Layouts Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `layout_data`: JSON object containing layout information
- `created_at`: Timestamp of creation

## Prompt Templates Table
- `id`: Primary key, UUID
- `user_id`: Foreign key to users.id
- `name`: Template name
- `description`: Template description
- `template`: Prompt template text
- `category`: Category identifier
- `is_public`: Boolean indicating if publicly shared
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Product Prompts Table
- `id`: Primary key, UUID
- `product_id`: Foreign key to products.id
- `template_id`: Foreign key to prompt_templates.id
- `name`: Prompt name
- `description`: Prompt description
- `prompt`: Prompt text
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Notes Table
- `id`: Primary key, UUID
- `user_id`: Foreign key to users.id (for personal notes)
- `product_id`: Foreign key to products.id (for product notes)
- `title`: Note title
- `content`: Note content
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## OpenAI Logs Table
- `id`: Primary key, UUID
- `user_id`: Foreign key to users.id
- `request_type`: Type of request
- `model`: Model used
- `request_payload`: JSON of request data
- `response_payload`: JSON of response data
- `error`: Error message if any
- `input_tokens`: Number of tokens in the prompt/input
- `output_tokens`: Number of tokens in the completion/output
- `created_at`: Timestamp of creation

## Feedback Table
- `id`: Primary key, UUID
- `user_id`: Foreign key to users.id
- `type`: Either 'bug' or 'feature'
- `description`: Description of the bug or feature
- `page_url`: URL where the bug was encountered
- `use_case`: Use case description for feature requests
- `proposed_solution`: Proposed solution for feature requests
- `created_at`: Timestamp of creation

# Row Level Security (RLS) Policies

## Users Table
- `Users can read own data`: Allows users to read their own data
  ```sql
  FOR SELECT using (auth.uid() = id)
  ```
- `Users can update own data`: Allows users to update their own data
  ```sql
  FOR UPDATE using (auth.uid() = id)
  ```

## Products Table
- `Users can read own products`: Allows users to read their own products
  ```sql
  FOR SELECT using (user_id = auth.uid())
  ```
- `Users can insert own products`: Allows users to create new products
  ```sql
  FOR INSERT with check (user_id = auth.uid())
  ```
- `Users can update own products`: Allows users to update their own products
  ```sql
  FOR UPDATE using (user_id = auth.uid())
  ```
- `Users can delete own products`: Allows users to delete their own products
  ```sql
  FOR DELETE using (user_id = auth.uid())
  ```

## Feedback Table
- `Users can create feedback`: Allows users to submit feedback
  ```sql
  FOR INSERT with check (auth.uid() = user_id)
  ```
- `Users can read own feedback`: Allows users to read their own feedback
  ```sql
  FOR SELECT using (auth.uid() = user_id)
  ```

## PRDs Table
- `Users can read own PRDs`: Allows users to read PRDs for their products
  ```sql
  FOR SELECT using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ))
  ```
- `Users can insert own PRDs`: Allows users to create PRDs for their products
  ```sql
  FOR INSERT with check (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id
    AND products.user_id = auth.uid()
  ))
  ```
- `Users can update own PRDs`: Allows users to update PRDs for their products
  ```sql
  FOR UPDATE using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ))
  ```
- `Users can delete own PRDs`: Allows users to delete PRDs for their products
  ```sql
  FOR DELETE using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ))
  ```

## Features Table
- `Users can read own features`: Allows users to read features for their products
  ```sql
  FOR SELECT using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ))
  ```
- `Users can insert own features`: Allows users to create features for their products
  ```sql
  FOR INSERT with check (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id
    AND products.user_id = auth.uid()
  ))
  ```
- `Users can update own features`: Allows users to update features and their implementation status
  ```sql
  FOR UPDATE using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ))
  ```

  This policy ensures that users can:
  1. Update feature properties including implementation_status
  2. Maintain consistency with kanban card movements
  3. Only modify features they own through their products

- `Users can delete own features`: Allows users to delete features for their products
  ```sql
  FOR DELETE using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ))
  ```

## Feature Dependencies Table
- `Users can manage feature dependencies`: Allows users to manage dependencies for their features
  ```sql
  FOR ALL using (EXISTS (
    SELECT 1 FROM features
    JOIN products ON products.id = features.product_id
    WHERE features.id = feature_dependencies.feature_id
    AND products.user_id = auth.uid()
  ))
  ```

## Customer Profiles Table
- `Users can manage own customer profiles`: Allows users to manage customer profiles for their products
  ```sql
  FOR ALL using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = customer_profiles.product_id
    AND products.user_ 
    AND products.user_id = auth.uid()
  ))
  ```

## OpenAI Logs Table
- `Users can read own logs`: Allows users to read their own OpenAI logs
  ```sql
  FOR SELECT using (user_id = auth.uid())
  ```
- `Users can insert own logs`: Allows users to create their own OpenAI logs
  ```sql
  FOR INSERT with check (user_id = auth.uid())
  ```

## Flow Pages Table
- `Users can manage own flow pages`: Allows users to manage flow pages for their products
  ```sql
  FOR ALL using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = flow_pages.product_id
    AND products.user_id = auth.uid()
  ))
  ```

## Flow Connections Table
- `Users can manage own flow connections`: Allows users to manage flow connections for their products
  ```sql
  FOR ALL using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = flow_connections.product_id
    AND products.user_id = auth.uid()
  ))
  ```

## Flow Layouts Table
- `Users can manage own flow layouts`: Allows users to manage flow layouts for their products
  ```sql
  FOR ALL using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = flow_layouts.product_id
    AND products.user_id = auth.uid()
  ))
  ```

## Prompt Templates Table
- `Users can manage own prompt templates`: Allows users to manage their prompt templates
  ```sql
  FOR ALL using (user_id = auth.uid())
  ```

## Product Prompts Table
- `Users can manage own product prompts`: Allows users to manage prompts for their products
  ```sql
  FOR ALL using (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_prompts.product_id
    AND products.user_id = auth.uid()
  ))
  ```

## Notes Table
- `Users can read own notes`: Allows users to read their own notes
  ```sql
  FOR SELECT using (
    -- Allow access to user's personal notes
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    -- Allow access to notes of products owned by the user
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    )
  )
  ```
- `Users can insert own notes`: Allows users to create notes for themselves or their products
  ```sql
  FOR INSERT with check (
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    )
  )
  ```
- `Users can update own notes`: Allows users to update their own notes
  ```sql
  FOR UPDATE using (
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    )
  )
  ```
- `Users can delete own notes`: Allows users to delete their own notes
  ```sql
  FOR DELETE using (
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    )
  )
  ```

## Notes
- All policies use `auth.uid()` to identify the authenticated user
- Most policies are scoped through the products table to establish ownership
- `FOR ALL` policies apply to all operations (SELECT, INSERT, UPDATE, DELETE)
- Nested EXISTS queries are used to establish ownership through relationships