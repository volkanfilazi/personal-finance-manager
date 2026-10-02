using Microsoft.AspNetCore.Mvc;
using PersonalFinanceManager.Api.Infrastructure.Http;
using PersonalFinanceManager.Api.Features.Categories;
using System.ComponentModel.DataAnnotations;

namespace PersonalFinanceManager.Api.Features.Transactions;

[ApiController]
[Route("api/transactions")]
public class TransactionsController : ControllerBase
{
    private readonly TransactionService _transactionService;

    public TransactionsController(TransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create(CreateTransactionDto dto)
    {
        var transaction = new Transaction
        {
            Description = dto.Description,
            Amount = dto.Amount,
            Date = dto.Date,
            CategoryId = dto.CategoryId
        };

        var result = await _transactionService.CreateAsync(transaction);

        if (result.Status == CreateTransactionStatus.CategoryNotFound)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.CategoryNotFound,
                ApiErrorMessages.CategoryNotFound
                ));
        }

        var createdTransaction = result.Transaction!;
        var category = result.Category!;

        var response = new TransactionDto
        {
            Id = createdTransaction.Id,
            Description = createdTransaction.Description,
            Amount = decimal.Round(createdTransaction.Amount, 2, MidpointRounding.AwayFromZero),
            Date = createdTransaction.Date,
            Category = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Type = category.Type,
                IsDeleted = category.IsDeleted
            }
        };

        return CreatedAtAction(
            nameof(GetById),
            new { id = transaction.Id },
            response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TransactionDto>> GetById(string id)
    {
        var result = await _transactionService.GetByIdAsync(id);

        if (result.Status == GetTransactionStatus.TransactionNotFound)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.TransactionNotFound,
                ApiErrorMessages.TransactionNotFound
                ));
        }

        if (result.Status == GetTransactionStatus.CategoryNotFound)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.CategoryNotFound,
                ApiErrorMessages.CategoryNotFound
                ));
        }

        var foundTransaction = result.Transaction!;
        var foundCategory = result.Category!;

        var response = new TransactionDto
        {
            Id = foundTransaction.Id,
            Description = foundTransaction.Description,
            Amount = decimal.Round(foundTransaction.Amount, 2, MidpointRounding.AwayFromZero),
            Date = foundTransaction.Date,
            Category = new CategoryDto
            {
                Id = foundCategory.Id,
                Name = foundCategory.Name,
                Type = foundCategory.Type,
                IsDeleted = foundCategory.IsDeleted
            }
        };

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetAll(
    [FromQuery, Range(2000, 2100)] int year,
    [FromQuery, Range(1, 12)] int month)
    {
        var results = await _transactionService.GetAllAsync(year, month);

        var response = results
            .Select(result => new TransactionDto
            {
                Id = result.Transaction.Id,
                Description = result.Transaction.Description,
                Amount = decimal.Round(result.Transaction.Amount, 2, MidpointRounding.AwayFromZero),
                Date = result.Transaction.Date,
                Category = new CategoryDto
                {
                    Id = result.Category.Id,
                    Name = result.Category.Name,
                    Type = result.Category.Type,
                    IsDeleted = result.Category.IsDeleted
                }
            })
            .ToList();

        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, UpdateTransactionDto dto)
    {
        var transaction = new Transaction
        {
            Id = id,
            Description = dto.Description,
            Amount = dto.Amount,
            Date = dto.Date,
            CategoryId = dto.CategoryId
        };

        var result = await _transactionService.UpdateAsync(transaction);

        if (result.Status == UpdateTransactionStatus.TransactionNotFound)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.TransactionNotFound,
                ApiErrorMessages.TransactionNotFound
                ));
        }

        if (result.Status == UpdateTransactionStatus.CategoryNotFound)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.CategoryNotFound,
                ApiErrorMessages.CategoryNotFound
                ));
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _transactionService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new ApiError(
                ApiErrorCodes.TransactionNotFound,
                ApiErrorMessages.TransactionNotFound
                ));
        }

        return NoContent();
    }
}