export const environment = {
  production: true,
  apiUrl: 'http://localhost:5263/api', // Replace with your production API URL
  endpoints: {
    products: '/products',
    categories: '/categories'
  },
  appConfig: {
    appName: 'Product Management System',
    version: '1.0.0',
    enableLogging: false
  }
};