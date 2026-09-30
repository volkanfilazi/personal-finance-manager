using MongoDB.Driver;

namespace PersonalFinanceManager.Api.Features.Categories;

public class CategoryService
{
    private readonly IMongoCollection<Category> _categories;

    public CategoryService(IMongoDatabase database)
    {
        _categories = database.GetCollection<Category>("categories");
    }

    public async Task<CreateCategoryResult> CreateAsync(Category category)
    {
        var exist = await _categories
            .Find(x => x.Name == category.Name)
            .AnyAsync();

        if (exist)
        {
            return new CreateCategoryResult
            {
                Status = CreateCategoryStatus.Duplicate
            };
        }

        await _categories.InsertOneAsync(category);

        return new CreateCategoryResult
        {
            Status = CreateCategoryStatus.Created,
            Category = category
        };
    }

    public async Task<Category?> GetByIdAsync(string id)
    {
        return await _categories
            .Find(category => category.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await _categories
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<bool> UpdateAsync(Category category)
    {
        var result = await _categories.ReplaceOneAsync(
            existingCategory => existingCategory.Id == category.Id,
            category);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _categories.DeleteOneAsync(
            category => category.Id == id);

        return result.DeletedCount > 0;
    }
}