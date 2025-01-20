# Weather App - PM Accelerator Tech Assessment

## Project Overview

This Weather App is a comprehensive solution developed for the Product Manager Accelerator (PMA) Software Engineer Intern Tech Assessment. The application provides real-time weather information with advanced features including location-based forecasting, historical weather data retrieval, and database persistence.

## 🌟 Features

### Tech Assessment 1

- 🌍 Location Input Support
  - Zip Codes
  - GPS Coordinates
  - City/Town Names
  - Landmarks
- 🌡️ Current Weather Display
- 🗓️ 5-Day Weather Forecast
- 📍 Geolocation Support

### Tech Assessment 2

- 💾 Full CRUD Operations
  - Create weather records
  - Read historical weather data
  - Update existing records
  - Delete weather records
- 🌐 Multiple API Integrations
  - OpenWeatherMap
  - Google Maps Geocoding
- 📊 Comprehensive Weather Data Tracking

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **APIs**:
  - OpenWeatherMap
  - Google Maps Geocoding

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm/yarn/pnpm
- API Keys:
  - OpenWeatherMap
  - Google Maps

### Installation

1. Clone the repository

```bash
git clone https://github.com/calvin-www/weather-app.git
cd weather-app
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file with the following variables:

```
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
DATABASE_URL=your_postgresql_connection_string
```

4. Run database migrations

```bash
npx prisma migrate dev
```

5. Start the development server

```bash
npm run dev
```
