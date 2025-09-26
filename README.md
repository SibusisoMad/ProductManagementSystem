# Product Management System

A full-stack web application built with **Angular 17** and **.NET 8**.

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SibusisoMad/ProductManagementSystem.git
cd ProductManagementSystem
```

### 2. Backend Setup (.NET 8 API)

```bash
# Navigate to the API project
cd ProductManagementSystem.Api

# Restore NuGet packages
dotnet restore

# Build the project
dotnet build
```

### 3. Frontend Setup (Angular 17)

```bash
# Navigate to the frontend project
cd ../product-management-frontend

# Install npm dependencies
npm install

# Verify Angular CLI (install if needed)
npm install -g @angular/cli
ng version
```

---

## Running the Application

### Run Both Projects Simultaneously (Recommended)

#### Terminal 1 - Backend API:
```bash
cd ProductManagementSystem.Api
dotnet run
```
**API will be available at:** `https://localhost:5263`

#### Terminal 2 - Frontend Application:
```bash
cd product-management-frontend
ng serve
```
**Frontend will be available at:** `http://localhost:4200`


## Testing

```bash
cd product-management-frontend

# Run unit tests
ng test

# Run end-to-end tests
ng e2e
```

### API Testing with Swagger

1. Start the backend API: `dotnet run`
2. Navigate to: https://localhost:5263/swagger
3. Test endpoints directly from the Swagger UI

