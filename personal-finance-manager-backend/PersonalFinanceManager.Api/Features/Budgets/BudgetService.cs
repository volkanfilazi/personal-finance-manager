using MongoDB.Driver;
using PersonalFinanceManager.Api.Features.Categories;
using PersonalFinanceManager.Api.Features.Transactions;

namespace PersonalFinanceManager.Api.Features.Budgets;

public class BudgetService
{
    private readonly IMongoCollection<Budget> _budgets;
    private readonly IMongoCollection<Category> _categories;
    private readonly IMongoCollection<Transaction> _transactions;

    public BudgetService(IMongoDatabase database)
    {
        _budgets = database.GetCollection<Budget>("budgets");
        _categories = database.GetCollection<Category>("categories");
        _transactions = database.GetCollection<Transaction>("transactions");
    }

    public async Task<CreateBudgetResult> CreateAsync(Budget budget)
    {
        var category = await _categories
            .Find(x => x.Id == budget.CategoryId)
            .FirstOrDefaultAsync();

        if (category is null)
        {
            return new CreateBudgetResult
            {
                Status = CreateBudgetStatus.CategoryNotFound
            };
        }

        if (category.IsDeleted || category.Type != CategoryType.Expense)
        {
            return new CreateBudgetResult
            {
                Status = CreateBudgetStatus.CategoryNotEligible
            };
        }

        var existingBudget = await _budgets
            .Find(x =>
            x.CategoryId == budget.CategoryId &&
            x.Year == budget.Year &&
            x.Month == budget.Month)
            .FirstOrDefaultAsync();

        if (existingBudget is not null)
        {
            return new CreateBudgetResult
            {
                Status = CreateBudgetStatus.BudgetAlreadyExists
            };
        }

        var spending = await GetSpendingAsync([category], budget.Year, budget.Month);

        await _budgets.InsertOneAsync(budget);

        return new CreateBudgetResult
        {
            Status = CreateBudgetStatus.Created,
            Budget = budget,
            Category = category,
            Spent = spending.GetValueOrDefault(category.Id)
        };
    }

    public async Task<GetBudgetResult> GetByIdAsync(string id)
    {
        var budget = await _budgets
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();

        if (budget is null)
        {
            return new GetBudgetResult
            {
                Status = GetBudgetStatus.BudgetNotFound
            };
        }

        var category = await _categories
            .Find(c => c.Id == budget.CategoryId)
            .FirstOrDefaultAsync();

        if (category is null)
        {
            return new GetBudgetResult
            {
                Status = GetBudgetStatus.CategoryNotFound,
                Budget = budget
            };
        }

        var spending = await GetSpendingAsync([category], budget.Year, budget.Month);

        return new GetBudgetResult
        {
            Status = GetBudgetStatus.Ok,
            Budget = budget,
            Category = category,
            Spent = spending.GetValueOrDefault(category.Id)
        };
    }

    public async Task<List<BudgetWithCategory>> GetAllAsync(int year, int month)
    {
        var budgets = await _budgets
            .Find(budget =>
                budget.Year == year &&
                budget.Month == month)
            .ToListAsync();

        if (budgets.Count == 0)
        {
            return [];
        }

        var categoryIds = budgets
            .Select(budget => budget.CategoryId)
            .Distinct()
            .ToList();

        var categoryFilter = Builders<Category>.Filter.In(
            category => category.Id,
            categoryIds);

        var categories = await _categories
            .Find(categoryFilter)
            .ToListAsync();

        var spending = await GetSpendingAsync(categories, year, month);

        return budgets
            .Select(budget =>
            {
                var category = categories
                    .First(category => category.Id == budget.CategoryId);

                return new BudgetWithCategory
                {
                    Budget = budget,
                    Category = category,
                    Spent = spending.GetValueOrDefault(category.Id)
                };
            })
            .ToList();
    }

    private async Task<Dictionary<string, decimal>> GetSpendingAsync(
        IEnumerable<Category> categories, int year, int month)
    {
        var categoryIds = categories
            .Where(category => category.Type == CategoryType.Expense)
            .Select(category => category.Id)
            .Distinct()
            .ToList();

        if (categoryIds.Count == 0)
        {
            return [];
        }

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var transactions = await _transactions
            .Find(transaction =>
                categoryIds.Contains(transaction.CategoryId) &&
                transaction.Date >= startDate &&
                transaction.Date < endDate)
            .ToListAsync();

        return transactions
            .GroupBy(transaction => transaction.CategoryId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(transaction =>
                    decimal.Round(transaction.Amount, 2, MidpointRounding.AwayFromZero)));
    }

    public async Task<bool> UpdateAsync(string id, decimal amount)
    {
        var update = Builders<Budget>.Update
            .Set(budget => budget.Amount, amount);

        var result = await _budgets.UpdateOneAsync(
            budget => budget.Id == id,
            update);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _budgets.DeleteOneAsync(x => x.Id == id);

        return result.DeletedCount > 0;
    }
}