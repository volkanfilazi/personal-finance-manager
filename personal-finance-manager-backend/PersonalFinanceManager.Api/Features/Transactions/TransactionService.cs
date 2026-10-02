using MongoDB.Driver;
using PersonalFinanceManager.Api.Features.Categories;

namespace PersonalFinanceManager.Api.Features.Transactions;


public class TransactionService
{
    private readonly IMongoCollection<Transaction> _transactions;
    private readonly IMongoCollection<Category> _categories;

    public TransactionService(IMongoDatabase database)
    {
        _transactions = database.GetCollection<Transaction>("transactions");
        _categories = database.GetCollection<Category>("categories");
    }

    public async Task<CreateTransactionResult> CreateAsync(Transaction transaction)
    {
        var category = await _categories
            .Find(x => x.Id == transaction.CategoryId && !x.IsDeleted)
            .FirstOrDefaultAsync();

        if (category is null)
        {
            return new CreateTransactionResult
            {
                Status = CreateTransactionStatus.CategoryNotFound
            };
        }

        await _transactions.InsertOneAsync(transaction);

        return new CreateTransactionResult
        {
            Status = CreateTransactionStatus.Created,
            Transaction = transaction,
            Category = category
        };
    }

    public async Task<GetTransactionResult> GetByIdAsync(string id)
    {
        var transaction = await _transactions
            .Find(transaction => transaction.Id == id)
            .FirstOrDefaultAsync();

        if (transaction is null)
        {
            return new GetTransactionResult
            {
                Status = GetTransactionStatus.TransactionNotFound
            };
        }

        var category = await _categories
            .Find(x => x.Id == transaction.CategoryId)
            .FirstOrDefaultAsync();

        if (category is null)
        {
            return new GetTransactionResult
            {
                Status = GetTransactionStatus.CategoryNotFound
            };
        }

        return new GetTransactionResult
        {
            Status = GetTransactionStatus.Found,
            Transaction = transaction,
            Category = category
        };
    }

    public async Task<List<TransactionWithCategory>> GetAllAsync(int year, int month)
    {
        // if params 2026 and 9 ->  01.09.2026 00:00
        var startDate = new DateTime(year, month, 1);
        // + 1 -> 01.10.2026 00:00
        var endDate = startDate.AddMonths(1);

        var transactions = await _transactions
            .Find(transaction => transaction.Date >= startDate && transaction.Date < endDate)
            .ToListAsync();

        var categoryIds = transactions
            .Select(x => x.CategoryId)
            .Distinct()
            .ToList();

        var categoryFilter = Builders<Category>.Filter.In(
            category => category.Id,
            categoryIds);

        var categories = await _categories
            .Find(categoryFilter)
            .ToListAsync();

        return transactions
            .Select(transaction =>
            {
                var category = categories
                .FirstOrDefault(x => x.Id == transaction.CategoryId)
                ?? throw new InvalidOperationException(
                    $"Category not found for transaction {transaction.Id}.");
                
                return new TransactionWithCategory
                {
                    Category = category,
                    Transaction = transaction
                };
            })
            .ToList();
    }

    public async Task<UpdateTransactionResult> UpdateAsync(Transaction transaction)
    {
        var existingTransaction = await _transactions
            .Find(t => t.Id == transaction.Id)
            .FirstOrDefaultAsync();

        if (existingTransaction is null)
        {
            return new UpdateTransactionResult
            {
                Status = UpdateTransactionStatus.TransactionNotFound,
            };
        }

        if (existingTransaction.CategoryId != transaction.CategoryId)
        {
            var category = await _categories
            .Find(x => x.Id == transaction.CategoryId && !x.IsDeleted)
            .FirstOrDefaultAsync();

            if (category is null)
            {
                return new UpdateTransactionResult
                {
                    Status = UpdateTransactionStatus.CategoryNotFound,
                };
            }
        }

        await _transactions.ReplaceOneAsync(
            existingTransaction => existingTransaction.Id == transaction.Id,
            transaction);

        return new UpdateTransactionResult
        {
            Status = UpdateTransactionStatus.Updated,
        };
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _transactions.DeleteOneAsync(
            transaction => transaction.Id == id);

        return result.DeletedCount > 0;
    }
}