using ProductManagementSystem.Api.DTOs;

namespace ProductManagementSystem.Api.Services.Interfaces;

public interface IProductService
{
    Task<PagedResultDto<ProductDto>> GetProductsAsync(ProductSearchDto searchDto);
    Task<ProductDto> GetProductByIdAsync(int id);
    Task<ProductDto> CreateProductAsync(CreateProductDto createDto);
    Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto updateDto);
    Task<bool> DeleteProductAsync(int id);
    Task<IEnumerable<ProductDto>> SearchProductsAsync(string query, int maxResults = 10);
    Task<IEnumerable<ProductDto>> BulkCreateProductsAsync(IEnumerable<CreateProductDto> products);

    Task<string> ProcessBulkCreateFromJsonAsync(string requestBody);
}