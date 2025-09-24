namespace ProductManagementSystem.Api.DTOs;

public record ProductDto(
    int Id,
    string Name,
    string? Description,
    string SKU,
    decimal Price,
    int Quantity,
    int CategoryId,
    string? CategoryName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateProductDto(
    string Name,
    string? Description,
    string SKU,
    decimal Price,
    int Quantity,
    int CategoryId
);

public record UpdateProductDto(
    string? Name,
    string? Description,
    string? SKU,
    decimal? Price,
    int? Quantity,
    int? CategoryId
);

public record ProductSearchDto(
    string? Name,
    int? CategoryId,
    int Page = 1,
    int PageSize = 10
);

public record PagedResultDto<T>(
    List<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages
);

