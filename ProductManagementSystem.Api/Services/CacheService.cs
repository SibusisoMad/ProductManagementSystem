using ProductManagementSystem.Api.Services.Interfaces;

namespace ProductManagementSystem.Api.Services
{
    public class CacheService : ICacheService
    {
        private readonly Dictionary<string, CacheItem> _cache = new();
        private readonly ReaderWriterLockSlim _lock = new();

        public T? Get<T>(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                return default;

            _lock.EnterReadLock();
            try
            {
                if (_cache.TryGetValue(key, out var item))
                {
                    if (item.ExpiresAt == null || item.ExpiresAt > DateTime.UtcNow)
                    {
                        return item.Value is T value ? value : default;
                    }

                    
                    _lock.ExitReadLock();
                    _lock.EnterWriteLock();
                    try
                    {
                        _cache.Remove(key);
                        return default;
                    }
                    finally
                    {
                        _lock.ExitWriteLock();
                        _lock.EnterReadLock();
                    }
                }

                return default;
            }
            finally
            {
                _lock.ExitReadLock();
            }
        }

        public void Set<T>(string key, T value, TimeSpan? expiry = null)
        {
            if (string.IsNullOrWhiteSpace(key) || value == null)
                return;

            var expiresAt = expiry.HasValue ? DateTime.UtcNow.Add(expiry.Value) : (DateTime?)null;
            var cacheItem = new CacheItem(value, expiresAt);

            _lock.EnterWriteLock();
            try
            {
                _cache[key] = cacheItem;
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }

        public void Remove(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                return;

            _lock.EnterWriteLock();
            try
            {
                _cache.Remove(key);
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }

        public void Clear()
        {
            _lock.EnterWriteLock();
            try
            {
                _cache.Clear();
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }

        public void Dispose()
        {
            _lock?.Dispose();
        }

        private record CacheItem(object Value, DateTime? ExpiresAt);
    }
}