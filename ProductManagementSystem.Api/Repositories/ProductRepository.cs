using ProductManagementSystem.Api.Models;
using ProductManagementSystem.Api.Repositories.Interfaces;

namespace ProductManagementSystem.Api.Repositories;

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository()
    {
        SeedData();
    }

    public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId)
    {
        return await FindAsync(p => p.CategoryId == categoryId);
    }

    public async Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await GetAllAsync();

        var lowerSearchTerm = searchTerm.ToLowerInvariant();
        return await FindAsync(p =>
            p.Name.ToLowerInvariant().Contains(lowerSearchTerm) ||
            (p.Description != null && p.Description.ToLowerInvariant().Contains(lowerSearchTerm)) ||
            p.SKU.ToLowerInvariant().Contains(lowerSearchTerm));
    }

    public async Task<bool> IsSkuUniqueAsync(string sku, int? excludeId = null)
    {
        var products = await FindAsync(p => p.SKU.ToLowerInvariant() == sku.ToLowerInvariant());

        if (excludeId.HasValue)
            products = products.Where(p => p.Id != excludeId.Value);

        return !products.Any();
    }

    private void SeedData()
    {
        var products = new[]
        {
            new Product { Name = "Gaming Laptop", Description = "High-performance gaming laptop", SKU = "LAP001", Price = 24999.99m, Quantity = 10, CategoryId = 1 },
            new Product { Name = "Wireless Mouse", Description = "Ergonomic wireless mouse", SKU = "MOU001", Price = 599.99m, Quantity = 50, CategoryId = 2 },
            new Product { Name = "Mechanical Keyboard", Description = "RGB mechanical keyboard", SKU = "KEY001", Price = 2499.99m, Quantity = 25, CategoryId = 2 },
            new Product { Name = "4K Monitor", Description = "27-inch 4K monitor", SKU = "MON001", Price = 7999.99m, Quantity = 15, CategoryId = 3 }
        };

        foreach (var product in products)
        {
            AddAsync(product).Wait();
        }
    }
}