using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Transactions;

public class TransactionWithCategory
{
    public Transaction Transaction { get; init; } = null!;
    public Category Category { get; init; } = null!;
}