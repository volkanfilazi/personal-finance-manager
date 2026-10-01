using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceManager.Api.Features.Budgets;

public class UpdateBudgetDto
{
    [Range(
    typeof(decimal),
    "0.01",
    "79228162514264337593543950335",
    ParseLimitsInInvariantCulture = true)]
    public decimal Amount { get; set; }
}