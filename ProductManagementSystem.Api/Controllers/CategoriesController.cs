using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ProductManagementSystem.Api.DTOs;
using ProductManagementSystem.Api.Services.Interfaces;

namespace ProductManagementSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private readonly ILogger<CategoriesController> _logger;
    private readonly ICategoryService _categoryService;

    public CategoriesController(
        ILogger<CategoriesController> logger,
        ICategoryService categoryService)
    {
        _logger = logger;
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IEnumerable<CategoryDto>> GetCategories()
    {
        _logger.LogDebug("{Method}", nameof(GetCategories));
        return await _categoryService.GetAllCategoriesAsync();
    }

    [HttpGet("tree")]
    public async Task<CategoryTreeDto> GetCategoryTree()
    {
        _logger.LogDebug("{Method}", nameof(GetCategoryTree));
        return await _categoryService.GetCategoryTreeAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<CategoryDto> GetCategory(int id)
    {
        _logger.LogDebug("{Method}", nameof(GetCategory));
        return await _categoryService.GetCategoryByIdAsync(id);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto createDto)
    {
        _logger.LogDebug("{Method}", nameof(CreateCategory));
        var category = await _categoryService.CreateCategoryAsync(createDto);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteCategory(int id)
    {
        _logger.LogDebug("{Method}", nameof(DeleteCategory));
        var deleted = await _categoryService.DeleteCategoryAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
