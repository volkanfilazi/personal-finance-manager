using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceManager.Api.Features.Categories;

public class UpdateCategoryDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
}

public enum UpdateCategoryStatus
{
    Updated,
    Duplicate,
    CategoryNotFound
}

public class UpdateCategoryResult
{
    public UpdateCategoryStatus Status { get; init; }
}