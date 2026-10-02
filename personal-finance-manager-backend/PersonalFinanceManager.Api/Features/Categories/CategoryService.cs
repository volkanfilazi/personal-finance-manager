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
            .Find(x => x.Name == category.Name && !x.IsDeleted)
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
            .Find(category => !category.IsDeleted)
            .ToListAsync();
    }

    public async Task<UpdateCategoryResult> UpdateAsync(Category category)
    {
        var exist = await _categories
            .Find(x => x.Id != category.Id && x.Name == category.Name && !x.IsDeleted)
            .AnyAsync();

        if (exist)
        {
            return new UpdateCategoryResult
            {
                Status = UpdateCategoryStatus.Duplicate
            };
        }

        var result = await _categories.ReplaceOneAsync(
            existingCategory => existingCategory.Id == category.Id && !existingCategory.IsDeleted,
            category);

        if (result.MatchedCount <= 0)
        {
            return new UpdateCategoryResult
            {
                Status = UpdateCategoryStatus.CategoryNotFound
            };
        }

        return new UpdateCategoryResult
        {
            Status = UpdateCategoryStatus.Updated
        };
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var update = Builders<Category>.Update
            .Set(category => category.IsDeleted, true);

        var result = await _categories.UpdateOneAsync(
            category => category.Id == id && !category.IsDeleted,
            update);

        return result.MatchedCount > 0;
    }
}