/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key, matches auth.users)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `prds`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `overview` (jsonb)
      - `problem_solution` (jsonb)
      - `target_audience` (jsonb)
      - `features` (jsonb)
      - `tech_stack` (jsonb)
      - `success_metrics` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create PRDs table
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prds ENABLE ROW LEVEL SECURITY;

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

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prds_updated_at
  BEFORE UPDATE ON prds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();