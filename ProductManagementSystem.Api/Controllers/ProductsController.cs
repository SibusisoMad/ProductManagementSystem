using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ProductManagementSystem.Api.DTOs;
using ProductManagementSystem.Api.Services.Interfaces;
using System.Text.Json;

namespace ProductManagementSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly ILogger<ProductsController> _logger;
    private readonly IProductService _productService;

    public ProductsController(
        ILogger<ProductsController> logger,
        IProductService productService)
    {
        _logger = logger;
        _productService = productService;
    }

    /// <summary>
    /// Get products with optional search and filtering
    /// </summary>
    /// <param name="search">
    [HttpGet]
    public async Task<PagedResultDto<ProductDto>> GetProducts([FromQuery] string? search = null,[FromQuery] int? categoryId = null,[FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogDebug("{Method}", nameof(GetProducts));

        page = Math.Max(1, page);
        pageSize = Math.Max(1, Math.Min(100, pageSize));

        var searchDto = new ProductSearchDto(search, categoryId, page, pageSize);
        return await _productService.GetProductsAsync(searchDto);
    }

    [HttpGet("{id:int}")]
    public async Task<ProductDto> GetProduct(int id)
    {
        _logger.LogDebug("{Method}", nameof(GetProduct));
        return await _productService.GetProductByIdAsync(id);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createDto)
    {
        _logger.LogDebug("{Method}", nameof(CreateProduct));
        var product = await _productService.CreateProductAsync(createDto);
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    public async Task<ProductDto> UpdateProduct(int id, UpdateProductDto updateDto)
    {
        _logger.LogDebug("{Method}", nameof(UpdateProduct));
        return await _productService.UpdateProductAsync(id, updateDto);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        _logger.LogDebug("{Method}", nameof(DeleteProduct));
        var deleted = await _productService.DeleteProductAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("search")]
    public async Task<IEnumerable<ProductDto>> SearchProducts(
        [FromQuery] string query,
        [FromQuery] int maxResults = 10)
    {
        _logger.LogDebug("{Method}", nameof(SearchProducts));
        return await _productService.SearchProductsAsync(query, maxResults);
    }

    // Demonstrates manual model binding and custom JSON serialization
    [HttpPost("bulk")]
    public async Task<ActionResult<string>> CreateProductsBulk()
    {
        _logger.LogDebug("{Method}", nameof(CreateProductsBulk));

        // Manual model binding - reading from request body manually
        using var reader = new StreamReader(Request.Body);
        var requestBody = await reader.ReadToEndAsync();

        // Manual JSON deserialization with custom options
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var products = JsonSerializer.Deserialize<List<CreateProductDto>>(requestBody, jsonOptions);
        var createdProducts = await _productService.BulkCreateProductsAsync(products ?? new List<CreateProductDto>());

        // Custom JSON serialization for response
        var response = new
        {
            CreatedCount = createdProducts.Count(),
            CreatedProducts = createdProducts,
            ProcessedAt = DateTime.UtcNow
        };

        var responseJson = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        return Content(responseJson, "application/json");
    }
}