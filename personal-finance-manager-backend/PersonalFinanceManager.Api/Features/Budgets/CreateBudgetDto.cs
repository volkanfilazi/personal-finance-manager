using System.ComponentModel.DataAnnotations;
using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Budgets;

public class CreateBudgetDto
{
    [Required]
    public string CategoryId { get; set; } = string.Empty;

    [Range(
    typeof(decimal),
    "0.01",
    "79228162514264337593543950335",
    ParseLimitsInInvariantCulture = true)]
    public decimal Amount { get; set; }

    [Range(2000, 2100)]
    public int Year { get; set; }

    [Range(1, 12)]
    public int Month { get; set; }
}

public enum CreateBudgetStatus
{
    Created,
    CategoryNotFound,
    CategoryNotEligible,
    BudgetAlreadyExists
}

public class CreateBudgetResult
{
    public CreateBudgetStatus Status { get; init; }
    public Budget? Budget { get; init; }
    public Category? Category { get; init; }
}