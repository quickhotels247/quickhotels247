-- Destination suggestions match any word of a region's name as the visitor
-- types ("del" → NEW DELHI). A trigram index keeps that fast over ~330k
-- regions. pg_trgm is available on Neon and AWS RDS.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "supplier_regions_name_trgm_idx"
  ON "supplier_regions" USING gin (lower("name") gin_trgm_ops);
