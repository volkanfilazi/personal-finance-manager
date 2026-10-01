using Microsoft.AspNetCore.Mvc;
using PersonalFinanceManager.Api.Infrastructure.Http;

namespace PersonalFinanceManager.Api.Features.Categories;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly CategoryService _categoryService;

    public CategoriesController(CategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name.Trim(),
            Type = dto.Type
        };

        var result = await _categoryService.CreateAsync(category);

        if (result.Status == CreateCategoryStatus.Duplicate)
        {
            return Conflict(new ApiError(
                ApiErrorCodes.CategoryAlreadyExists,
                ApiErrorMessages.CategoryAlreadyExists
                ));
        }

        var response = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Type = category.Type
        };

        return CreatedAtAction(
        nameof(GetById),
        new { id = category.Id },
        response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(string id)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category is null)
        {
            return NotFound();
        }

        var response = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Type = category.Type
        };

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();

        var response = categories
            .Select(category => new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Type = category.Type
            }).ToList();

        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, UpdateCategoryDto dto)
    {
        var category = new Category
        {
            Id = id,
            Name = dto.Name.Trim(),
            Type = dto.Type
        };

        var updated = await _categoryService.UpdateAsync(category);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var deleted = await _categoryService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.CategoryNotFound,
                ApiErrorMessages.CategoryNotFound
            ));
        }

        return NoContent();
    }
}
