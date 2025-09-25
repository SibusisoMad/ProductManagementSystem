using ProductManagementSystem.Api.Repositories.Interfaces;
using System.Linq.Expressions;
using System.Reflection;

namespace ProductManagementSystem.Api.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly List<T> _entities;
    private readonly PropertyInfo _idProperty;
    private int _nextId;

    protected Repository()
    {
        _entities = new List<T>();
        _idProperty = typeof(T).GetProperty("Id")
            ?? throw new InvalidOperationException($"Entity {typeof(T).Name} must have an Id property");
        _nextId = 1;
    }

    public virtual Task<T?> GetByIdAsync(int id)
    {
        var entity = _entities.FirstOrDefault(e => GetEntityId(e) == id);
        return Task.FromResult(entity);
    }

    public virtual Task<IEnumerable<T>> GetAllAsync()
    {
        return Task.FromResult(_entities.AsEnumerable());
    }

    public virtual Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        var compiledPredicate = predicate.Compile();
        var results = _entities.Where(compiledPredicate);
        return Task.FromResult(results);
    }

    public virtual Task<T> AddAsync(T entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        SetEntityId(entity, _nextId++);
        SetTimestamps(entity, isUpdate: false);
        _entities.Add(entity);

        return Task.FromResult(entity);
    }

    public virtual Task<T> UpdateAsync(T entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        var id = GetEntityId(entity);
        var existingEntity = _entities.FirstOrDefault(e => GetEntityId(e) == id);

        if (existingEntity == null)
            throw new InvalidOperationException($"Entity with id {id} not found");

        SetTimestamps(entity, isUpdate: true);
        var index = _entities.IndexOf(existingEntity);
        _entities[index] = entity;

        return Task.FromResult(entity);
    }

    public virtual Task<bool> DeleteAsync(int id)
    {
        var entity = _entities.FirstOrDefault(e => GetEntityId(e) == id);
        if (entity == null) return Task.FromResult(false);

        _entities.Remove(entity);
        return Task.FromResult(true);
    }

    public virtual Task<bool> ExistsAsync(int id)
    {
        var exists = _entities.Any(e => GetEntityId(e) == id);
        return Task.FromResult(exists);
    }

    public virtual Task<int> CountAsync()
    {
        return Task.FromResult(_entities.Count);
    }

    public virtual Task<int> CountAsync(Expression<Func<T, bool>> predicate)
    {
        var compiledPredicate = predicate.Compile();
        var count = _entities.Count(compiledPredicate);
        return Task.FromResult(count);
    }

    private int GetEntityId(T entity)
    {
        return (int)(_idProperty.GetValue(entity) ?? 0);
    }

    private void SetEntityId(T entity, int id)
    {
        _idProperty.SetValue(entity, id);
    }

    private void SetTimestamps(T entity, bool isUpdate)
    {
        var createdAtProperty = typeof(T).GetProperty("CreatedAt");
        var updatedAtProperty = typeof(T).GetProperty("UpdatedAt");

        if (!isUpdate && createdAtProperty != null)
        {
            createdAtProperty.SetValue(entity, DateTime.UtcNow);
        }

        if (updatedAtProperty != null)
        {
            updatedAtProperty.SetValue(entity, DateTime.UtcNow);
        }
    }
}