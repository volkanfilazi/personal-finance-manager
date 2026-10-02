namespace PersonalFinanceManager.Api.Features.Categories;

public class CategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
    public bool IsDeleted { get; set; }
}