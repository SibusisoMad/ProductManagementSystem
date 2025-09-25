using System.ComponentModel.DataAnnotations;

namespace ProductManagementSystem.Api.Models
{
    public class Product : IComparable<Product>
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        public int CategoryId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Category? Category { get; set; }

   
        public int CompareTo(Product? other)
        {
            if (other is null) return 1;

          
            var nameComparison = string.Compare(Name, other.Name, StringComparison.OrdinalIgnoreCase);
            return nameComparison != 0 ? nameComparison : Price.CompareTo(other.Price);
        }
    }
}