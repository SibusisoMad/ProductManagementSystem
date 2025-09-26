using System.Globalization;
using ProductManagementSystem.Api.Services.Interfaces;

namespace ProductManagementSystem.Api.Services;

public class CurrencyFormattingService : ICurrencyFormattingService
{
    private readonly CultureInfo _southAfricanCulture;

    public CurrencyFormattingService()
    {
        // South African culture for currency formatting
        _southAfricanCulture = new CultureInfo("en-ZA");
    }

    public string FormatAsSouthAfricanRand(decimal amount)
    {
        // Format using South African locale
        var formatted = amount.ToString("C", _southAfricanCulture);
        
        // Replace currency symbol with 'R' and ensure proper spacing
        return formatted.Replace("R ", "R ").Replace("R\u00A0", "R ");
    }

    public string FormatAsSouthAfricanRandSimple(decimal amount)
    {
        // Simple format: R 123.45
        return $"R {amount:F2}";
    }

    public string FormatWithThousandsSeparator(decimal amount)
    {
        // Format with space as thousands separator: R 1 234.56
        var numberFormat = (NumberFormatInfo)_southAfricanCulture.NumberFormat.Clone();
        numberFormat.CurrencyGroupSeparator = " ";
        numberFormat.CurrencySymbol = "R";
        
        return amount.ToString("C", numberFormat);
    }
}