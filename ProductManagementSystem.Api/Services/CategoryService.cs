using ProductManagementSystem.Api.DTOs;
using ProductManagementSystem.Api.Models;
using ProductManagementSystem.Api.Repositories.Interfaces;
using ProductManagementSystem.Api.Services.Interfaces;

namespace ProductManagementSystem.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly ILogger<CategoryService> _logger;
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(
        ILogger<CategoryService> logger,
        ICategoryRepository categoryRepository)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _categoryRepository = categoryRepository ?? throw new ArgumentNullException(nameof(categoryRepository));
    }

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        _logger.LogDebug("Getting all categories");

        try
        {
            var categories = await _categoryRepository.GetAllAsync();
            var result = categories.Select(MapToDto).ToList();

            _logger.LogDebug("Successfully retrieved {CategoryCount} categories", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all categories");
            throw;
        }
    }

    public async Task<CategoryTreeDto> GetCategoryTreeAsync()
    {
        var allCategories = (await _categoryRepository.GetAllAsync()).ToList();
        var rootCategories = allCategories.Where(c => c.ParentCategoryId == null).ToList();

        
        var tree = new CategoryTreeDto(
            Id: 0,
            Name: "Root",
            Description: "Root category",
            ParentCategoryId: null,
            SubCategories: rootCategories.Select(c => BuildCategoryTree(c, allCategories)).ToList()
        );

        return tree;
    }

    public async Task<CategoryDto> GetCategoryByIdAsync(int id)
    {
        _logger.LogDebug("Getting category by ID: {CategoryId}", id);

        if (id <= 0)
        {
            _logger.LogWarning("Invalid category ID provided: {CategoryId}", id);
            throw new ArgumentException("Category ID must be greater than zero", nameof(id));
        }

        try
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                _logger.LogWarning("Category not found with ID: {CategoryId}", id);
                throw new KeyNotFoundException($"Category with ID {id} not found");
            }

            var result = MapToDto(category);
            _logger.LogDebug("Successfully retrieved category: {CategoryId}", id);
            return result;
        }
        catch (Exception ex) when (!(ex is KeyNotFoundException || ex is ArgumentException))
        {
            _logger.LogError(ex, "Error retrieving category with ID: {CategoryId}", id);
            throw;
        }
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createDto)
    {
        _logger.LogInformation("Creating category with name: {CategoryName}", createDto.Name);

        try
        {
            
            var validationResult = createDto switch
            {
                { Name: null or "" } => "Category name is required",
                { ParentCategoryId: <= 0 } => "Parent category ID must be greater than 0 if provided",
                _ => null
            };

            if (validationResult != null)
            {
                _logger.LogWarning("Category creation validation failed: {ValidationError}", validationResult);
                throw new ArgumentException(validationResult);
            }

          
            if (createDto.ParentCategoryId.HasValue)
            {
                var parentExists = await _categoryRepository.ExistsAsync(createDto.ParentCategoryId.Value);
                if (!parentExists)
                {
                    _logger.LogWarning("Parent category not found: {ParentCategoryId}", createDto.ParentCategoryId.Value);
                    throw new ArgumentException("Parent category not found", nameof(createDto.ParentCategoryId));
                }
            }

            var category = new Category
            {
                Name = createDto.Name!,
                Description = createDto.Description,
                ParentCategoryId = createDto.ParentCategoryId
            };

            var createdCategory = await _categoryRepository.AddAsync(category);
            _logger.LogInformation("Category created successfully with ID: {CategoryId}", createdCategory.Id);

            return MapToDto(createdCategory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category with name: {CategoryName}", createDto.Name);
            throw;
        }
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        _logger.LogInformation("Deleting category with ID: {CategoryId}", id);

        try
        {
            
            var exists = await _categoryRepository.ExistsAsync(id);
            if (!exists)
            {
                _logger.LogWarning("Category not found for deletion: {CategoryId}", id);
                return false;
            }

            
            var hasSubCategories = await _categoryRepository.HasSubCategoriesAsync(id);
            var hasProducts = await _categoryRepository.HasProductsAsync(id);

            if (hasSubCategories || hasProducts)
            {
                _logger.LogWarning("Cannot delete category {CategoryId} - has subcategories or products", id);
                throw new InvalidOperationException("Cannot delete category that has subcategories or products");
            }

            var deleted = await _categoryRepository.DeleteAsync(id);
            if (deleted)
            {
                _logger.LogInformation("Category deleted successfully: {CategoryId}", id);
            }
            else
            {
                _logger.LogWarning("Failed to delete category: {CategoryId}", id);
            }

            return deleted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting category with ID: {CategoryId}", id);
            throw;
        }
    }

    private CategoryTreeDto BuildCategoryTree(Category category, List<Category> allCategories)
    {
        var subCategories = allCategories
            .Where(c => c.ParentCategoryId == category.Id)
            .Select(c => BuildCategoryTree(c, allCategories))
            .ToList();

        return new CategoryTreeDto(
            Id: category.Id,
            Name: category.Name,
            Description: category.Description,
            ParentCategoryId: category.ParentCategoryId,
            SubCategories: subCategories
        );
    }

    private static CategoryDto MapToDto(Category category)
    {
        return new CategoryDto(
            Id: category.Id,
            Name: category.Name,
            Description: category.Description,
            ParentCategoryId: category.ParentCategoryId,
            ParentCategoryName: category.ParentCategory?.Name
        );
    }
}