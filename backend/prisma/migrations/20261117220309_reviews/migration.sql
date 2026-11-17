-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "barber_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "reviews_appointment_id_key" ON "reviews"("appointment_id");
-- AddForeignKey
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Stars must be between 1 and 5, even if someone calls the API directly
ALTER TABLE reviews
ADD CONSTRAINT reviews_rating_range CHECK (
        rating BETWEEN 1 AND 5
    );