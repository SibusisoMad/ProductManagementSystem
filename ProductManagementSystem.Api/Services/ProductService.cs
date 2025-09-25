using ProductManagementSystem.Api.DTOs;
using ProductManagementSystem.Api.Models;
using ProductManagementSystem.Api.Repositories.Interfaces;
using ProductManagementSystem.Api.Services.Interfaces;

namespace ProductManagementSystem.Api.Services;

public class ProductService : IProductService
{
    private readonly ILogger<ProductService> _logger;
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICacheService _cacheService;
    private readonly ProductSearchEngine<Product> _searchEngine;

    public ProductService(
        ILogger<ProductService> logger,
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        ICacheService cacheService)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _categoryRepository = categoryRepository ?? throw new ArgumentNullException(nameof(categoryRepository));
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));

       
        _searchEngine = new ProductSearchEngine<Product>()
            .AddField(p => p.Name, 3.0)       
            .AddField(p => p.Description, 1.5)   
            .AddField(p => p.SKU, 2.0);
    }

    public async Task<PagedResultDto<ProductDto>> GetProductsAsync(ProductSearchDto searchDto)
    {
        var cacheKey = $"products_{searchDto.Name}_{searchDto.CategoryId}_{searchDto.Page}_{searchDto.PageSize}";

       
        var cachedResult = _cacheService.Get<PagedResultDto<ProductDto>>(cacheKey);
        if (cachedResult != null)
            return cachedResult;

        var allProducts = (await _productRepository.GetAllAsync()).AsEnumerable();

        
        var categoryFilteredProducts = allProducts.FilterByCategory(searchDto.CategoryId);

        List<Product> filteredProducts;

        
        if (!string.IsNullOrWhiteSpace(searchDto.Name))
        {
            _logger.LogDebug("Using fuzzy search for term: {SearchTerm}", searchDto.Name);

            
            var searchResults = _searchEngine.Search(categoryFilteredProducts, searchDto.Name, int.MaxValue);
            filteredProducts = searchResults.Select(r => r.Item).ToList();
        }
        else
        {
           
            filteredProducts = categoryFilteredProducts.SortProducts("name").ToList();
        }

        var totalItems = filteredProducts.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)searchDto.PageSize);

        var pagedProducts = filteredProducts
            .Skip((searchDto.Page - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToList();

        var productDtos = new List<ProductDto>();
        foreach (var product in pagedProducts)
        {
            var category = await _categoryRepository.GetByIdAsync(product.CategoryId);
            productDtos.Add(MapToDto(product, category?.Name));
        }

        var result = new PagedResultDto<ProductDto>(
            Items: productDtos,
            Page: searchDto.Page,
            PageSize: searchDto.PageSize,
            TotalItems: totalItems,
            TotalPages: totalPages
        );

       
        _cacheService.Set(cacheKey, result, TimeSpan.FromMinutes(5));

        return result;
    }

    public async Task<ProductDto> GetProductByIdAsync(int id)
    {
        _logger.LogDebug("Getting product by ID: {ProductId}", id);

        if (id <= 0)
        {
            _logger.LogWarning("Invalid product ID provided: {ProductId}", id);
            throw new ArgumentException("Product ID must be greater than zero", nameof(id));
        }

        try
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
            {
                _logger.LogWarning("Product not found with ID: {ProductId}", id);
                throw new KeyNotFoundException($"Product with ID {id} not found");
            }

            var category = await _categoryRepository.GetByIdAsync(product.CategoryId);
            var result = MapToDto(product, category?.Name);

            _logger.LogDebug("Successfully retrieved product: {ProductId}", id);
            return result;
        }
        catch (Exception ex) when (!(ex is KeyNotFoundException || ex is ArgumentException))
        {
            _logger.LogError(ex, "Error retrieving product with ID: {ProductId}", id);
            throw;
        }
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto createDto)
    {
        
        var isSkuUnique = await _productRepository.IsSkuUniqueAsync(createDto.SKU);
        if (!isSkuUnique)
            throw new ArgumentException("SKU must be unique", nameof(createDto.SKU));

       
        var categoryExists = await _categoryRepository.ExistsAsync(createDto.CategoryId);
        if (!categoryExists)
            throw new ArgumentException("Category not found", nameof(createDto.CategoryId));

        var product = new Product
        {
            Name = createDto.Name,
            Description = createDto.Description,
            SKU = createDto.SKU,
            Price = createDto.Price,
            Quantity = createDto.Quantity,
            CategoryId = createDto.CategoryId
        };

        var createdProduct = await _productRepository.AddAsync(product);

       
        ClearProductCache();

        var category = await _categoryRepository.GetByIdAsync(createdProduct.CategoryId);
        return MapToDto(createdProduct, category?.Name);
    }

    public async Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto updateDto)
    {
        _logger.LogDebug("Updating product with ID: {ProductId}", id);

        if (id <= 0)
        {
            _logger.LogWarning("Invalid product ID provided for update: {ProductId}", id);
            throw new ArgumentException("Product ID must be greater than zero", nameof(id));
        }

        if (updateDto == null)
        {
            _logger.LogWarning("Update DTO is null for product ID: {ProductId}", id);
            throw new ArgumentNullException(nameof(updateDto));
        }

        try
        {
            var existingProduct = await _productRepository.GetByIdAsync(id);
            if (existingProduct == null)
            {
                _logger.LogWarning("Product not found for update with ID: {ProductId}", id);
                throw new KeyNotFoundException($"Product with ID {id} not found");
            }

            
            if (!string.IsNullOrWhiteSpace(updateDto.SKU) && updateDto.SKU != existingProduct.SKU)
            {
                var isSkuUnique = await _productRepository.IsSkuUniqueAsync(updateDto.SKU, id);
                if (!isSkuUnique)
                {
                    _logger.LogWarning("SKU already exists during update: {SKU} for product ID: {ProductId}", updateDto.SKU, id);
                    throw new ArgumentException("SKU must be unique", nameof(updateDto.SKU));
                }
            }

         
            if (updateDto.CategoryId.HasValue && updateDto.CategoryId != existingProduct.CategoryId)
            {
                var categoryExists = await _categoryRepository.ExistsAsync(updateDto.CategoryId.Value);
                if (!categoryExists)
                {
                    _logger.LogWarning("Category not found during update: {CategoryId} for product ID: {ProductId}", updateDto.CategoryId.Value, id);
                    throw new ArgumentException("Category not found", nameof(updateDto.CategoryId));
                }
            }

        
            if (!string.IsNullOrWhiteSpace(updateDto.Name))
                existingProduct.Name = updateDto.Name;

            if (updateDto.Description != null)
                existingProduct.Description = updateDto.Description;

            if (!string.IsNullOrWhiteSpace(updateDto.SKU))
                existingProduct.SKU = updateDto.SKU;

            if (updateDto.Price.HasValue)
                existingProduct.Price = updateDto.Price.Value;

            if (updateDto.Quantity.HasValue)
                existingProduct.Quantity = updateDto.Quantity.Value;

            if (updateDto.CategoryId.HasValue)
                existingProduct.CategoryId = updateDto.CategoryId.Value;

            var updatedProduct = await _productRepository.UpdateAsync(existingProduct);

           
            ClearProductCache();

            var category = await _categoryRepository.GetByIdAsync(updatedProduct.CategoryId);
            var result = MapToDto(updatedProduct, category?.Name);

            _logger.LogDebug("Successfully updated product: {ProductId}", id);
            return result;
        }
        catch (Exception ex) when (!(ex is KeyNotFoundException || ex is ArgumentException))
        {
            _logger.LogError(ex, "Error updating product with ID: {ProductId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteProductAsync(int id)
    {
        var result = await _productRepository.DeleteAsync(id);

        if (result)
        {
           
            ClearProductCache();
        }

        return result;
    }

    public async Task<IEnumerable<ProductDto>> SearchProductsAsync(string query, int maxResults = 10)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Enumerable.Empty<ProductDto>();

        var cacheKey = $"search_{query}_{maxResults}";

       
        var cachedResult = _cacheService.Get<IEnumerable<ProductDto>>(cacheKey);
        if (cachedResult != null)
            return cachedResult;

        var allProducts = await _productRepository.GetAllAsync();
        var searchResults = _searchEngine.Search(allProducts, query, maxResults);

        var productDtos = new List<ProductDto>();
        foreach (var result in searchResults)
        {
            var category = await _categoryRepository.GetByIdAsync(result.Item.CategoryId);
            productDtos.Add(MapToDto(result.Item, category?.Name));
        }

     
        _cacheService.Set(cacheKey, productDtos, TimeSpan.FromMinutes(2));

        return productDtos;
    }

    public async Task<IEnumerable<ProductDto>> BulkCreateProductsAsync(IEnumerable<CreateProductDto> products)
    {
        _logger.LogDebug("Bulk creating {ProductCount} products", products.Count());

        if (products == null || !products.Any())
        {
            _logger.LogWarning("No products provided for bulk creation");
            throw new ArgumentException("No products provided", nameof(products));
        }

        try
        {
            var results = new List<ProductDto>();

            foreach (var productDto in products)
            {
                var product = await CreateProductAsync(productDto);
                results.Add(product);
            }

            _logger.LogInformation("Successfully bulk created {ProductCount} products", results.Count);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk product creation");
            throw;
        }
    }

    private void ClearProductCache()
    {
   
        _cacheService.Clear();
    }

    private static ProductDto MapToDto(Product product, string? categoryName = null)
    {
        return new ProductDto(
            Id: product.Id,
            Name: product.Name,
            Description: product.Description,
            SKU: product.SKU,
            Price: product.Price,
            Quantity: product.Quantity,
            CategoryId: product.CategoryId,
            CategoryName: categoryName,
            CreatedAt: product.CreatedAt,
            UpdatedAt: product.UpdatedAt
        );
    }
}
