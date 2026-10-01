using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Budgets;

public class BudgetWithCategory
{
    public Budget Budget { get; init; } = null!;
    public Category Category { get; init; } = null!;
    public decimal Spent { get; init; }
}