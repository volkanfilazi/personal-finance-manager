namespace PersonalFinanceManager.Api.Infrastructure.Http;

public static class ApiErrorCodes
{
    public const string CategoryAlreadyExists = "CATEGORY_ALREADY_EXISTS";
    public const string CategoryNotFound = "CATEGORY_NOT_FOUND";
    public const string TransactionNotFound = "TRANSACTION_NOT_FOUND";
}

public static class ApiErrorMessages
{
    public const string CategoryAlreadyExists = "A category with this name already exists.";
    public const string CategoryNotFound = "Category not found.";
    public const string TransactionNotFound = "Transaction not found.";
}