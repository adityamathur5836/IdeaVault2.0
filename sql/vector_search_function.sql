-- SQL function for vector similarity search in Supabase_a
-- This needs to be run in the Supabase_a database SQL editor

-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the match_ideas function for vector similarity search
CREATE OR REPLACE FUNCTION match_ideas (
  query_embedding vector(384), -- Assuming 384-dimensional embeddings from all-MiniLM-L6-v2
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  name text,
  tagline text,
  description text,
  category text,
  target_audience text,
  tags text[],
  upvotes int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    product_hunt_products.id,
    product_hunt_products.name,
    product_hunt_products.tagline,
    product_hunt_products.description,
    product_hunt_products.category,
    product_hunt_products.target_audience,
    product_hunt_products.tags,
    product_hunt_products.upvotes,
    (product_hunt_products.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM product_hunt_products
  WHERE product_hunt_products.embedding <=> query_embedding < 1 - match_threshold
  ORDER BY product_hunt_products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Alternative function for OpenAI embeddings (1536 dimensions)
CREATE OR REPLACE FUNCTION match_ideas_openai (
  query_embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  name text,
  tagline text,
  description text,
  category text,
  target_audience text,
  tags text[],
  upvotes int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    product_hunt_products.id,
    product_hunt_products.name,
    product_hunt_products.tagline,
    product_hunt_products.description,
    product_hunt_products.category,
    product_hunt_products.target_audience,
    product_hunt_products.tags,
    product_hunt_products.upvotes,
    (product_hunt_products.embedding_openai <=> query_embedding) * -1 + 1 AS similarity
  FROM product_hunt_products
  WHERE product_hunt_products.embedding_openai <=> query_embedding < 1 - match_threshold
  ORDER BY product_hunt_products.embedding_openai <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS product_hunt_products_embedding_idx 
ON product_hunt_products 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS product_hunt_products_embedding_openai_idx 
ON product_hunt_products 
USING ivfflat (embedding_openai vector_cosine_ops) 
WITH (lists = 100);

-- Add embedding columns if they don't exist
ALTER TABLE product_hunt_products 
ADD COLUMN IF NOT EXISTS embedding vector(384);

ALTER TABLE product_hunt_products 
ADD COLUMN IF NOT EXISTS embedding_openai vector(1536);

-- Create a function to update embeddings (to be called from the application)
CREATE OR REPLACE FUNCTION update_product_embedding(
  product_id bigint,
  new_embedding vector(384)
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE product_hunt_products 
  SET embedding = new_embedding 
  WHERE id = product_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_product_embedding_openai(
  product_id bigint,
  new_embedding vector(1536)
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE product_hunt_products 
  SET embedding_openai = new_embedding 
  WHERE id = product_id;
END;
$$;
