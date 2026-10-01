using PersonalFinanceManager.Api.Infrastructure.Http;
using System.ComponentModel.DataAnnotations;
using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Transactions;

public class CreateTransactionDto
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

public enum CreateTransactionStatus
{
    Created,
    CategoryNotFound
}

public class CreateTransactionResult
{
    public CreateTransactionStatus Status { get; init; }
    public Transaction? Transaction { get; init; }
    public Category? Category { get; init; }
}