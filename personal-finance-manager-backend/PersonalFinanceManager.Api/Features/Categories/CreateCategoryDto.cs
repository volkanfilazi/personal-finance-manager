using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceManager.Api.Features.Categories;

public class CreateCategoryDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
}