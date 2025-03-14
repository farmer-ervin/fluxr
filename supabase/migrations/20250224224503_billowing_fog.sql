/*
  # Set up database schema for PRD Generator

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `prds`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `overview` (jsonb)
      - `problem_solution` (jsonb)
      - `target_audience` (jsonb)
      - `features` (jsonb)
      - `tech_stack` (jsonb)
      - `success_metrics` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public') THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY REFERENCES auth.users(id),
      email text UNIQUE NOT NULL,
      full_name text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create products table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
    CREATE TABLE products (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create PRDs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'prds' AND schemaname = 'public') THEN
    CREATE TABLE prds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      overview jsonb DEFAULT '{}'::jsonb,
      problem_solution jsonb DEFAULT '{}'::jsonb,
      target_audience jsonb DEFAULT '{}'::jsonb,
      features jsonb DEFAULT '{}'::jsonb,
      tech_stack jsonb DEFAULT '{}'::jsonb,
      success_metrics jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Users can read own PRDs" ON prds;
DROP POLICY IF EXISTS "Users can insert own PRDs" ON prds;
DROP POLICY IF EXISTS "Users can update own PRDs" ON prds;
DROP POLICY IF EXISTS "Users can delete own PRDs" ON prds;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Create policies for products table
CREATE POLICY "Users can read own products" ON products
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create policies for PRDs table
CREATE POLICY "Users can read own PRDs" ON prds
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own PRDs" ON prds
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own PRDs" ON prds
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own PRDs" ON prds
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));