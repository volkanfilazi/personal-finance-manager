using Microsoft.AspNetCore.Mvc;
using PersonalFinanceManager.Api.Infrastructure.Http;
using PersonalFinanceManager.Api.Features.Categories;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;

namespace PersonalFinanceManager.Api.Features.Budgets;

[ApiController]
[Route("api/budgets")]
public class BudgetsController : ControllerBase
{
    private readonly BudgetService _budgetService;

    public BudgetsController(BudgetService budgetService)
    {
        _budgetService = budgetService;
    }

    [HttpPost]
    public async Task<ActionResult<BudgetDto>> Create(CreateBudgetDto dto)
    {
        if (!ObjectId.TryParse(dto.CategoryId, out _))
        {
            return BadRequest(new ApiError(
                ApiErrorCodes.InvalidId,
                ApiErrorMessages.InvalidId
            ));
        }

        var budget = new Budget
        {
            CategoryId = dto.CategoryId,
            Amount = dto.Amount,
            Year = dto.Year,
            Month = dto.Month
        };

        var result = await _budgetService.CreateAsync(budget);

        if (result.Status == CreateBudgetStatus.CategoryNotFound)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.CategoryNotFound,
                ApiErrorMessages.CategoryNotFound
                ));
        }

        if (result.Status == CreateBudgetStatus.CategoryNotEligible)
        {
            return BadRequest(new ApiError(
                ApiErrorCodes.CategoryNotEligible,
                ApiErrorMessages.CategoryNotEligible
                ));
        }

        if (result.Status == CreateBudgetStatus.BudgetAlreadyExists)
        {
            return Conflict(new ApiError(
                ApiErrorCodes.BudgetAlreadyExists,
                ApiErrorMessages.BudgetAlreadyExists
                ));
        }

        var createdBudget = result.Budget!;
        var category = result.Category!;

        var response = new BudgetDto
        {
            Id = createdBudget.Id,
            Amount = decimal.Round(createdBudget.Amount, 2, MidpointRounding.AwayFromZero),
            Year = createdBudget.Year,
            Month = createdBudget.Month,
            Category = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Type = category.Type,
                IsDeleted = category.IsDeleted
            },
            Spent = 0
        };

        return CreatedAtAction(
        nameof(GetById),
        new { id = budget.Id },
        response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BudgetDto>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest(new ApiError(
                ApiErrorCodes.InvalidId,
                ApiErrorMessages.InvalidId
            ));
        }

        var result = await _budgetService.GetByIdAsync(id);

        if (result.Status == GetBudgetStatus.BudgetNotFound || result.Budget is null)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.BudgetNotFound,
                ApiErrorMessages.BudgetNotFound
                ));
        }

        if (result.Status == GetBudgetStatus.CategoryNotFound || result.Category is null)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.CategoryNotFound,
                ApiErrorMessages.CategoryNotFound
                ));
        }

        var budget = result.Budget;
        var category = result.Category;

        var budgetDto = new BudgetDto
        {
            Id = budget.Id,
            Amount = decimal.Round(budget.Amount, 2, MidpointRounding.AwayFromZero),
            Year = budget.Year,
            Month = budget.Month,
            Category = new CategoryDto
            {
               Id = category.Id,
               Name = category.Name,
               Type = category.Type,
               IsDeleted = category.IsDeleted
            },
            Spent = 0
        };

        return Ok(budgetDto);
    }

    [HttpGet]
    public async Task<ActionResult<List<BudgetDto>>> GetAll(
    [FromQuery, Range(2000, 2100)] int year,
    [FromQuery, Range(1, 12)] int month)
    {
        var results = await _budgetService.GetAllAsync(year, month);

        var response = results
            .Select(result => new BudgetDto
            {
                Id = result.Budget.Id,
                Amount = decimal.Round(result.Budget.Amount, 2, MidpointRounding.AwayFromZero),
                Year = result.Budget.Year,
                Month = result.Budget.Month,
                Category = new CategoryDto
                {
                    Id = result.Category.Id,
                    Name = result.Category.Name,
                    Type = result.Category.Type,
                    IsDeleted = result.Category.IsDeleted
                },
                Spent = result.Spent
            })
            .ToList();

        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
    string id,
    UpdateBudgetDto dto)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest(new ApiError(
                ApiErrorCodes.InvalidId,
                ApiErrorMessages.InvalidId
            ));
        }

        var updated = await _budgetService.UpdateAsync(
            id,
            dto.Amount);

        if (!updated)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.BudgetNotFound,
                ApiErrorMessages.BudgetNotFound
            ));
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest(new ApiError(
                ApiErrorCodes.InvalidId,
                ApiErrorMessages.InvalidId
            ));
        }

        var result = await _budgetService.DeleteAsync(id);

        if (!result)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.BudgetNotFound,
                ApiErrorMessages.BudgetNotFound
            ));
        }

        return NoContent();
    }
}