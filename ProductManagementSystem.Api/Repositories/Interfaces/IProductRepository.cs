using ProductManagementSystem.Api.Models;

namespace ProductManagementSystem.Api.Repositories.Interfaces;

public interface IProductRepository : IRepository<Product>
{
    Task<IEnumerable<Product>> GetProductsByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
    Task<bool> IsSkuUniqueAsync(string sku, int? excludeId = null);
}