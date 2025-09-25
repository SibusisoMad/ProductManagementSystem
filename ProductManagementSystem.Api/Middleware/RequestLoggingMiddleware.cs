namespace ProductManagementSystem.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTime.UtcNow;
        var requestId = Guid.NewGuid().ToString("N")[..8];

   
        context.Response.Headers["X-Request-Id"] = requestId;

    
        _logger.LogInformation(
            "[{RequestId}] {Method} {Path} started at {StartTime}",
            requestId,
            context.Request.Method,
            context.Request.Path,
            startTime
        );

        try
        {

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[{RequestId}] Unhandled exception occurred",
                requestId);

            
            throw;
        }
        finally
        {
            var endTime = DateTime.UtcNow;
            var duration = endTime - startTime;

            
            _logger.LogInformation(
                "[{RequestId}] {Method} {Path} completed with {StatusCode} in {Duration}ms",
                requestId,
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                duration.TotalMilliseconds
            );
        }
    }
}
