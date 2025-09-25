using ProductManagementSystem.Api.DTOs;

namespace ProductManagementSystem.Api.Services.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
    Task<CategoryTreeDto> GetCategoryTreeAsync();
    Task<CategoryDto> GetCategoryByIdAsync(int id);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createDto);
    Task<bool> DeleteCategoryAsync(int id);
}