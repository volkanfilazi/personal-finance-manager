namespace PersonalFinanceManager.Api.Infrastructure.Http;

public static class ApiErrorCodes
{
    public const string CategoryAlreadyExists = "CATEGORY_ALREADY_EXISTS";
    public const string CategoryNotFound = "CATEGORY_NOT_FOUND";
    public const string TransactionNotFound = "TRANSACTION_NOT_FOUND";
    public const string CategoryNotEligible = "CATEGORY_NOT_ELIGIBLE";
    public const string BudgetAlreadyExists = "BUDGET_ALREADY_EXIST";
    public const string BudgetNotFound = "BUDGET_NOT_FOUND";
}

public static class ApiErrorMessages
{
    public const string CategoryAlreadyExists = "A category with this name already exists.";
    public const string CategoryNotFound = "Category not found.";
    public const string TransactionNotFound = "Transaction not found.";
    public const string CategoryNotEligible = "Category not eligible.";
    public const string BudgetAlreadyExists = "Budget already exist.";
    public const string BudgetNotFound = "Budget not found.";
}