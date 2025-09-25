using ProductManagementSystem.Api.Models;

namespace ProductManagementSystem.Api.Extensions;

public static class ProductEnumerableExtensions
{
    public static IEnumerable<Product> FilterByCategory(this IEnumerable<Product> products, int? categoryId)
{
    if (!categoryId.HasValue)
        return products;

    return products.Where(p => p.CategoryId == categoryId.Value);
}

public static IEnumerable<Product> FilterByPriceRange(this IEnumerable<Product> products, decimal? minPrice, decimal? maxPrice)
{
    if (minPrice.HasValue)
        products = products.Where(p => p.Price >= minPrice.Value);

    if (maxPrice.HasValue)
        products = products.Where(p => p.Price <= maxPrice.Value);

    return products;
}

public static IEnumerable<Product> FilterByAvailability(this IEnumerable<Product> products, bool? inStock = null)
{
    if (!inStock.HasValue)
        return products;

    return inStock.Value
        ? products.Where(p => p.Quantity > 0)
        : products.Where(p => p.Quantity == 0);
}

public static IEnumerable<Product> SearchByName(this IEnumerable<Product> products, string? searchTerm)
{
    if (string.IsNullOrWhiteSpace(searchTerm))
        return products;

    var lowerSearchTerm = searchTerm.ToLowerInvariant();
    return products.Where(p =>
        p.Name.ToLowerInvariant().Contains(lowerSearchTerm) ||
        (p.Description != null && p.Description.ToLowerInvariant().Contains(lowerSearchTerm)));
}

public static IEnumerable<Product> SortProducts(this IEnumerable<Product> products, string? sortBy = null, bool descending = false)
{
    var sortedProducts = sortBy?.ToLowerInvariant() switch
    {
        "name" => products.OrderBy(p => p.Name),
        "price" => products.OrderBy(p => p.Price),
        "created" => products.OrderBy(p => p.CreatedAt),
        "updated" => products.OrderBy(p => p.UpdatedAt),
        "quantity" => products.OrderBy(p => p.Quantity),
        _ => products.OrderBy(p => p.Name)
    };

    return descending ? sortedProducts.Reverse() : sortedProducts;
}

public static IEnumerable<Product> Paginate(this IEnumerable<Product> products, int page, int pageSize)
{
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;

    return products.Skip((page - 1) * pageSize).Take(pageSize);
}
}