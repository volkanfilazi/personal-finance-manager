using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Transactions;

public class Transaction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; } = 0;
    public DateTime Date { get; set; }
    public string CategoryId { get; set; } = string.Empty;
}

public enum GetTransactionStatus
{
    Found,
    TransactionNotFound,
    CategoryNotFound
}

public class GetTransactionResult
{
    public GetTransactionStatus Status { get; init; }
    public Transaction? Transaction { get; init; }
    public Category? Category { get; init; }
}