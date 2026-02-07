-- Make password_hash nullable (Google OAuth users have no password)
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Make mobile nullable (Google OAuth users may not provide a mobile)
ALTER TABLE "User" ALTER COLUMN "mobile" DROP NOT NULL;

-- Add google_id column for OAuth users
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255);
ALTER TABLE "User" ADD CONSTRAINT "User_google_id_key" UNIQUE ("google_id");
