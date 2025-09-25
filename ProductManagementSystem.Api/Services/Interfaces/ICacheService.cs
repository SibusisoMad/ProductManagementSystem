namespace ProductManagementSystem.Api.Services.Interfaces;

public interface ICacheService
{
    T? Get<T>(string key);
    void Set<T>(string key, T value, TimeSpan? expiry = null);
    void Remove(string key);
    void Clear();
}

