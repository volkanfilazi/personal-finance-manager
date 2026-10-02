using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Budgets;

public class BudgetDto
{
    public string Id { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public CategoryDto Category { get; set; } = null!;
    public decimal Spent { get; set; }
}

public enum GetBudgetStatus
{
    Ok,
    BudgetNotFound,
    CategoryNotFound
}

public class GetBudgetResult
{
    public GetBudgetStatus Status { get; init; }
    public Budget? Budget { get; init; }
    public Category? Category { get; init; }
    public decimal Spent { get; init; }
}