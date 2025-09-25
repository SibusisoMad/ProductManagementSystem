namespace ProductManagementSystem.Api.Utils;

public class ProductSearchEngine<T> where T : class
{
    private readonly List<SearchField<T>> _searchFields;
    private readonly Dictionary<string, List<SearchResult<T>>> _searchCache;

    public ProductSearchEngine()
    {
        _searchFields = new List<SearchField<T>>();
        _searchCache = new Dictionary<string, List<SearchResult<T>>>();
    }

    public ProductSearchEngine<T> AddField(Func<T, string?> fieldExtractor, double weight = 1.0)
    {
        _searchFields.Add(new SearchField<T>(fieldExtractor, weight));
        return this;
    }

    public List<SearchResult<T>> Search(IEnumerable<T> items, string query, int maxResults = 10)
    {
        if (string.IsNullOrWhiteSpace(query) || !items.Any())
            return new List<SearchResult<T>>();

        var cacheKey = GenerateCacheKey(query, maxResults);

        
        if (_searchCache.TryGetValue(cacheKey, out var cachedResults))
            return cachedResults;

        var normalizedQuery = NormalizeString(query);
        var results = new List<SearchResult<T>>();

        foreach (var item in items)
        {
            var totalScore = 0.0;
            var matchedFields = 0;

            foreach (var field in _searchFields)
            {
                var fieldValue = field.FieldExtractor(item);
                if (string.IsNullOrWhiteSpace(fieldValue))
                    continue;

                var normalizedFieldValue = NormalizeString(fieldValue);
                var score = CalculateFieldScore(normalizedQuery, normalizedFieldValue);

                if (score > 0)
                {
                    totalScore += score * field.Weight;
                    matchedFields++;
                }
            }

            if (totalScore > 0)
            {
                results.Add(new SearchResult<T>(item, totalScore, matchedFields));
            }
        }

       
        var sortedResults = results
            .OrderByDescending(r => r.Score)
            .ThenByDescending(r => r.MatchedFields)
            .Take(maxResults)
            .ToList();

 
        _searchCache[cacheKey] = sortedResults;

        return sortedResults;
    }

    private double CalculateFieldScore(string query, string fieldValue)
    {
        if (string.IsNullOrWhiteSpace(query) || string.IsNullOrWhiteSpace(fieldValue))
            return 0.0;

        var queryWords = query.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var totalScore = 0.0;

        foreach (var word in queryWords)
        {
           
            if (fieldValue.Contains(word, StringComparison.OrdinalIgnoreCase))
            {
                totalScore += 10.0;
                continue;
            }

           
            var fuzzyScore = CalculateFuzzyScore(word, fieldValue);
            totalScore += fuzzyScore;
        }

      
        var lengthPenalty = Math.Max(0.1, 1.0 - (fieldValue.Length / 1000.0));
        return totalScore * lengthPenalty;
    }

    private double CalculateFuzzyScore(string query, string target)
    {
        
        var words = target.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var maxScore = 0.0;

        foreach (var word in words)
        {
            var score = CalculateWordSimilarity(query, word);
            maxScore = Math.Max(maxScore, score);
        }

        return maxScore;
    }

    private double CalculateWordSimilarity(string query, string word)
    {
        if (string.IsNullOrWhiteSpace(query) || string.IsNullOrWhiteSpace(word))
            return 0.0;

      
        if (string.Equals(query, word, StringComparison.OrdinalIgnoreCase))
            return 10.0;

       
        if (word.StartsWith(query, StringComparison.OrdinalIgnoreCase))
            return 8.0;

      
        if (word.Contains(query, StringComparison.OrdinalIgnoreCase))
            return 6.0;

  
        var distance = CalculateLevenshteinDistance(query.ToLowerInvariant(), word.ToLowerInvariant());
        var maxLength = Math.Max(query.Length, word.Length);

        if (maxLength == 0) return 0.0;

        var similarity = 1.0 - (double)distance / maxLength;

      
        if (similarity >= 0.6) 
        {
          
            if (similarity >= 0.8) return similarity * 6.0;
            if (similarity >= 0.7) return similarity * 5.0;
            return similarity * 4.0;
        }

      
        return CheckCommonTypos(query, word);
    }

    private int CalculateLevenshteinDistance(string source, string target)
    {
        if (string.IsNullOrEmpty(source))
            return target?.Length ?? 0;

        if (string.IsNullOrEmpty(target))
            return source.Length;

        var sourceLength = source.Length;
        var targetLength = target.Length;
        var matrix = new int[sourceLength + 1, targetLength + 1];

      
        for (var i = 0; i <= sourceLength; i++)
            matrix[i, 0] = i;

        for (var j = 0; j <= targetLength; j++)
            matrix[0, j] = j;

       
        for (var i = 1; i <= sourceLength; i++)
        {
            for (var j = 1; j <= targetLength; j++)
            {
                var cost = source[i - 1] == target[j - 1] ? 0 : 1;
                matrix[i, j] = Math.Min(
                    Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                    matrix[i - 1, j - 1] + cost);
            }
        }

        return matrix[sourceLength, targetLength];
    }

    private double CheckCommonTypos(string query, string word)
    {
        var queryLower = query.ToLowerInvariant();
        var wordLower = word.ToLowerInvariant();

       
        if (IsMissingCharacters(queryLower, wordLower))
            return 3.0;

       
        if (IsMissingCharacters(wordLower, queryLower))
            return 3.0;

        
        if (IsAdjacentSwap(queryLower, wordLower))
            return 3.5;

        return 0.0;
    }

    private bool IsMissingCharacters(string shorter, string longer)
    {
        if (Math.Abs(shorter.Length - longer.Length) > 2) return false;
        if (shorter.Length >= longer.Length) return false;

        int shorterIndex = 0;
        int longerIndex = 0;
        int missingCount = 0;

        while (shorterIndex < shorter.Length && longerIndex < longer.Length)
        {
            if (shorter[shorterIndex] == longer[longerIndex])
            {
                shorterIndex++;
                longerIndex++;
            }
            else
            {
                missingCount++;
                if (missingCount > 2) return false;
                longerIndex++;
            }
        }

        return shorterIndex == shorter.Length;
    }

    private bool IsAdjacentSwap(string query, string word)
    {
        if (query.Length != word.Length) return false;

        var differences = new List<int>();
        for (int i = 0; i < query.Length; i++)
        {
            if (query[i] != word[i])
                differences.Add(i);
        }

        
        if (differences.Count == 2 && Math.Abs(differences[0] - differences[1]) == 1)
        {
           
            int pos1 = differences[0];
            int pos2 = differences[1];
            return query[pos1] == word[pos2] && query[pos2] == word[pos1];
        }

        return false;
    }

    private string NormalizeString(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        return input.ToLowerInvariant().Trim();
    }

    private string GenerateCacheKey(string query, int maxResults)
    {
        return $"{query}_{maxResults}";
    }

    public void ClearCache()
    {
        _searchCache.Clear();
    }
}

public record SearchField<T>(Func<T, string?> FieldExtractor, double Weight);

public record SearchResult<T>(T Item, double Score, int MatchedFields);