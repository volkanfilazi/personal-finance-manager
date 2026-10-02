# Personal Finance Manager

A small single-user application for tracking income, expenses and monthly budgets. Built with Angular 21, ASP.NET Core 10 and MongoDB. Authentication is not included.

## Requirements

- Node.js 22.12 or later within version 22, with npm
- .NET 10 SDK
- A running MongoDB instance, either locally or through Docker

## Project structure

- `personal-finance-manager-frontend`: Angular application
- `personal-finance-manager-backend/PersonalFinanceManager.Api`: REST API

The commands below start from the repository root. Keep the backend and frontend running in separate terminals.

## Architecture

The application is organized by feature (`Categories`, `Transactions`, `Budgets`)
on both the frontend and backend.

The Angular application uses standalone components, reactive forms and signals
for local UI state. Shared UI components are used for reusable dialog and
action-button behavior.

The ASP.NET Core API separates request/response DTOs from MongoDB persistence
models. Categories are soft-deleted so historical transactions can continue
to resolve their category after a category is removed from active use.

## 1. Start MongoDB

The default connection is `mongodb://localhost:27017` and the database name is `PersonalFinanceManager`.

If MongoDB is already running locally on this port, no additional step is needed. Otherwise, you can start it with Docker:

```sh
docker run --name pfm-mongodb -p 127.0.0.1:27017:27017 -v pfm-mongodb-data:/data/db -d mongo:8
```

For subsequent starts, use `docker start pfm-mongodb`. The named volume keeps the database data between container restarts. Docker is only used for MongoDB here; the application runs locally.

To use a different database connection, update the `MongoDb` section in:

```text
personal-finance-manager-backend/PersonalFinanceManager.Api/appsettings.json
```

The database and collections are created when data is first written. No migration command is required.

## 2. Start the backend

In a terminal at the repository root:

```sh
cd personal-finance-manager-backend/PersonalFinanceManager.Api
dotnet restore
dotnet run --launch-profile http
```

The API runs at `http://localhost:5271`. The `http` profile uses the Development environment, which also enables Swagger.

Open [Swagger UI](http://localhost:5271/swagger) to try the category, transaction and budget endpoints. The OpenAPI document is available at [openapi/v1.json](http://localhost:5271/openapi/v1.json).

## 3. Start the frontend

Open another terminal at the repository root:

```sh
cd personal-finance-manager-frontend
npm ci
npm start
```

Open [the application](http://localhost:4200). A global Angular CLI installation is not needed.

The frontend API base URL is defined by `API_BASE_URL` in `personal-finance-manager-frontend/src/app/core/api/api.config.ts`. It defaults to `http://localhost:5271/api`, so local development needs no additional configuration. If you change the backend host or port, update this value. If you change the frontend origin, update the CORS configuration in the backend's `Program.cs`.

## First use

There is no automatic demo data. Create an Income category such as Salary and an Expense category such as Food. Add transactions with dates in the month you want to inspect, then select that month in the dashboard.

Budgets can be created for Expense categories, with one budget per category and month. The dashboard shows monthly totals, spending by category, the highest spending category and budget usage. Categories without a budget are still included in the spending breakdown.

## Build and checks

From `personal-finance-manager-frontend`:

```sh
npm run build
npm test -- --watch=false
```

The frontend build is written to `dist/personal-finance-manager-frontend`. It currently exceeds the configured 500 kB warning threshold; this produces a warning rather than a build failure.

From `personal-finance-manager-backend/PersonalFinanceManager.Api`:

```sh
dotnet build
```

For a manual API check, use Swagger to create a category, add a transaction using its ID, and query transactions for the same year and month. For budget requests, use an Expense category. Month parameters use values from 1 to 12.
