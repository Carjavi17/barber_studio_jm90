/*
 Warnings:
 
 - You are about to drop the `offers` table. If the table is not empty, all the data it contains will be lost.
 - Added the required column `ends_at` to the `appointments` table without a default value. This is not possible if the table is not empty.
 - Added the required column `price` to the `appointments` table without a default value. This is not possible if the table is not empty.
 - Added the required column `service_id` to the `appointments` table without a default value. This is not possible if the table is not empty.
 - Added the required column `service_name` to the `appointments` table without a default value. This is not possible if the table is not empty.
 
 */
-- AlterTable
ALTER TABLE "appointments"
ADD COLUMN "ends_at" TIMESTAMPTZ NOT NULL,
  ADD COLUMN "price" INTEGER NOT NULL,
  ADD COLUMN "service_id" INTEGER NOT NULL,
  ADD COLUMN "service_name" TEXT NOT NULL;
-- DropTable
DROP TABLE "offers";
-- CreateTable
CREATE TABLE "services" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);
-- AddForeignKey
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- A barber can't have two overlapping active appointments.
-- btree_gist lets "=" (barber) and "&&" (time ranges overlap) work in the same constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;
DROP INDEX IF EXISTS one_active_appointment_per_slot;
ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  )
WHERE (status <> 'cancelled');