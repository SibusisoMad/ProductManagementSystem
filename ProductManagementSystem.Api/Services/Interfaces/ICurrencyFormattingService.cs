namespace ProductManagementSystem.Api.Services.Interfaces;

public interface ICurrencyFormattingService
{
    /// <summary>
    /// Formats a decimal amount as South African Rand using proper locale formatting
    /// </summary>
    /// <param name="amount">The amount to format</param>
    /// <returns>Formatted currency string (e.g., "R 1 234.56")</returns>
    string FormatAsSouthAfricanRand(decimal amount);

    /// <summary>
    /// Formats a decimal amount as South African Rand with simple formatting
    /// </summary>
    /// <param name="amount">The amount to format</param>
    /// <returns>Simple formatted currency string (e.g., "R 123.45")</returns>
    string FormatAsSouthAfricanRandSimple(decimal amount);

    /// <summary>
    /// Formats a decimal amount with thousands separator
    /// </summary>
    /// <param name="amount">The amount to format</param>
    /// <returns>Formatted currency with thousands separator (e.g., "R 1 234.56")</returns>
    string FormatWithThousandsSeparator(decimal amount);
}