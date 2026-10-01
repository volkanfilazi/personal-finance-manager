using PersonalFinanceManager.Api.Infrastructure.Http;
using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceManager.Api.Features.Transactions;

public class UpdateTransactionDto
{
    [Required]
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [Range(
    typeof(decimal),
    "0.01",
    "79228162514264337593543950335",
    ParseLimitsInInvariantCulture = true)]
    [CurrencyPrecision]
    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    [Required]
    public string CategoryId { get; set; } = string.Empty;
}

public enum UpdateTransactionStatus
{
    Updated,
    TransactionNotFound,
    CategoryNotFound
}

public class UpdateTransactionResult
{
    public UpdateTransactionStatus Status { get; init; }
}