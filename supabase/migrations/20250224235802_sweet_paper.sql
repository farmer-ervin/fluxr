/*
  # Add product slugs

  1. Changes
    - Add slug column to products table
    - Create function to generate URL-friendly slugs
    - Create function to ensure unique slugs
    - Add trigger to auto-generate slugs on product creation/update
    - Create index on slug column
    - Backfill existing products with slugs
*/

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'slug'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE products ADD COLUMN slug text UNIQUE;
  END IF;
END $$;

-- Create function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  slug text;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  slug := lower(input_text);
  -- Replace special characters and spaces with hyphens
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$;

-- Create function to ensure unique slugs
CREATE OR REPLACE FUNCTION ensure_unique_slug(base_slug text, product_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_slug text := base_slug;
  counter integer := 1;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM products 
    WHERE slug = new_slug 
    AND (product_id IS NULL OR id != product_id)
  ) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

-- Create trigger function to handle slug generation
CREATE OR REPLACE FUNCTION products_handle_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate base slug from name
  NEW.slug := generate_slug(NEW.name);
  -- Ensure it's unique
  NEW.slug := ensure_unique_slug(NEW.slug, NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for slug generation
DROP TRIGGER IF EXISTS products_slug_trigger ON products;
CREATE TRIGGER products_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_handle_slug();

-- Create index on slug column
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);

-- Backfill existing products with slugs
UPDATE products
SET slug = ensure_unique_slug(generate_slug(name), id)
WHERE slug IS NULL;

-- Make slug column NOT NULL after backfill
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;