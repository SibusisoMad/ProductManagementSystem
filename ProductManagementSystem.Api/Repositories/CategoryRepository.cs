using ProductManagementSystem.Api.Models;
using ProductManagementSystem.Api.Repositories.Interfaces;

namespace ProductManagementSystem.Api.Repositories;

public class CategoryRepository : Repository<Category>, ICategoryRepository
{
    public CategoryRepository()
    {
        SeedData();
    }

    public async Task<IEnumerable<Category>> GetRootCategoriesAsync()
    {
        return await FindAsync(c => c.ParentCategoryId == null);
    }

    public async Task<IEnumerable<Category>> GetSubCategoriesAsync(int parentId)
    {
        return await FindAsync(c => c.ParentCategoryId == parentId);
    }

    public async Task<bool> HasSubCategoriesAsync(int categoryId)
    {
        var subCategories = await GetSubCategoriesAsync(categoryId);
        return subCategories.Any();
    }

    public async Task<bool> HasProductsAsync(int categoryId)
    {
        
        return false; 
    }

    private void SeedData()
    {
        var categories = new[]
        {
            new Category { Name = "Electronics", Description = "Electronic devices and accessories" },
            new Category { Name = "Computer Accessories", Description = "Accessories for computers", ParentCategoryId = 1 },
            new Category { Name = "Monitors", Description = "Computer monitors and displays", ParentCategoryId = 1 },
            new Category { Name = "Gaming", Description = "Gaming equipment and accessories", ParentCategoryId = 1 }
        };

        foreach (var category in categories)
        {
            AddAsync(category).Wait();
        }
    }
}