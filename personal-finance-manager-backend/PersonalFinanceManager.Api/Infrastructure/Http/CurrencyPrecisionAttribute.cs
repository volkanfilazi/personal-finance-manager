using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceManager.Api.Infrastructure.Http;

public sealed class CurrencyPrecisionAttribute : ValidationAttribute
{
    public CurrencyPrecisionAttribute() : base("Use at most two decimal places.") { }

    public override bool IsValid(object? value)
    {
        return value is decimal amount && amount == decimal.Round(amount, 2);
    }
}
