-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "employeeCount" INTEGER,
ADD COLUMN     "industry" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "profileImage" TEXT;
