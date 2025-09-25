# Product Management System - Frontend

This is the Angular frontend application for the Product Management System. It provides a modern, responsive web interface for managing products and categories.

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Angular CLI 17+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:4200`

### Development Commands

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests

## API Integration

The frontend is configured to work with the Product Management API. Update the API URLs in the service files if your API runs on a different port:

- Default API URL: `https://localhost:7189/api`
- Product endpoints: `/api/products`
- Category endpoints: `/api/categories`


## Testing

The application includes comprehensive unit tests:

- **Service Tests**: API integration and state management
- **Component Tests**: UI behavior and user interactions
- **Form Validation Tests**: Input validation and error handling

Run tests with:
```bash
npm test
```

## Build and Deployment

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build --prod
```

## API Requirements

This frontend expects the following API endpoints:

### Products
- `GET /api/products` - Get all products (with pagination/filtering)
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Categories
- `GET /api/categories` - Get all categories (flat list)
- `GET /api/categories/tree` - Get categories as hierarchical tree
- `GET /api/categories/{id}` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category


