-- CreateTable
CREATE TABLE "WeatherRecord" (
    "id" SERIAL NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "temperature_min" DOUBLE PRECISION NOT NULL,
    "temperature_max" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "weatherData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherRecord_location_idx" ON "WeatherRecord"("location");

-- CreateIndex
CREATE INDEX "WeatherRecord_startDate_endDate_idx" ON "WeatherRecord"("startDate", "endDate");
