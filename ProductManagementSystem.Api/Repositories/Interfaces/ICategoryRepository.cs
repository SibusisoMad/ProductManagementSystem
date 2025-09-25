using ProductManagementSystem.Api.Models;

namespace ProductManagementSystem.Api.Repositories.Interfaces;

public interface ICategoryRepository : IRepository<Category>
{
    Task<IEnumerable<Category>> GetRootCategoriesAsync();
    Task<IEnumerable<Category>> GetSubCategoriesAsync(int parentId);
    Task<bool> HasSubCategoriesAsync(int categoryId);
    Task<bool> HasProductsAsync(int categoryId);
}