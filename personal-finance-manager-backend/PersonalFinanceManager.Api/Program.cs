using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PersonalFinanceManager.Api.Infrastructure.MongoDb;
using PersonalFinanceManager.Api.Features.Categories;
using PersonalFinanceManager.Api.Features.Transactions;
using PersonalFinanceManager.Api.Features.Budgets;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDb"));

builder.Services.AddSingleton<IMongoClient>(serviceProvider =>
{
    var settings = serviceProvider
    .GetRequiredService<IOptions<MongoDbSettings>>()
    .Value;

    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddSingleton<IMongoDatabase>(serviceProvider =>
{
    var settings = serviceProvider
        .GetRequiredService<IOptions<MongoDbSettings>>()
        .Value;

    var client = serviceProvider
        .GetRequiredService<IMongoClient>();

    return client.GetDatabase(settings.DatabaseName);
});

builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<BudgetService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "Personal Finance Manager API");
    });
}

if (!app.Environment.IsDevelopment())
{
    // HTTPS redirection is disabled for local HTTP development -> it will fix warning problem
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.MapControllers();

app.Run();
