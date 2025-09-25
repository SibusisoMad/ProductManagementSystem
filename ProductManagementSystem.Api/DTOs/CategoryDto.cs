namespace ProductManagementSystem.Api.DTOs;

public record CategoryDto(
    int Id,
    string Name,
    string? Description,
    int? ParentCategoryId,
    string? ParentCategoryName
);

public record CategoryTreeDto(
    int Id,
    string Name,
    string? Description,
    int? ParentCategoryId,
    List<CategoryTreeDto> SubCategories
);

public record CreateCategoryDto(
    string Name,
    string? Description,
    int? ParentCategoryId
);