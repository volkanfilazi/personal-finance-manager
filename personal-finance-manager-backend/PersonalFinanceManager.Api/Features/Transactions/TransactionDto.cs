using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Transactions;

public class TransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public CategoryDto? Category { get; set; } = null;
}