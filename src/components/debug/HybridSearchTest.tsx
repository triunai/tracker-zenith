import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/supabase';

interface SearchResult {
  id: number;
  table_name: string;
  content: string;
  fts_rank: number;
  semantic_rank: number;
  rrf_rank: number;
  metadata: Record<string, unknown>;
}

export function HybridSearchTest() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Call the hybrid search RPC
      const { data, error: searchError } = await supabase.rpc('zenith_hybrid_search', {
        p_user_id: user.id,
        p_query_text: query,
        p_match_limit: 10
      });

      if (searchError) {
        throw searchError;
      }

      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseStructure = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test if the basic structure exists
      const { data, error } = await supabase
        .from('expense')
        .select('id, description, fts, embedding')
        .limit(1);

      if (error) {
        throw error;
      }

      console.log('✅ Database structure test passed:', data);
      setError(null);
      alert('✅ Database structure looks good! Check console for details.');
    } catch (err) {
      console.error('Database structure test failed:', err);
      setError(err instanceof Error ? err.message : 'Database test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Smart Search</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search your expenses using natural language - finds both exact matches and related concepts
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Structure Test */}
        <div className="border rounded p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">System Check</h3>
          <Button 
            onClick={testDatabaseStructure}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Checking...' : 'Verify Search System'}
          </Button>
        </div>

        {/* Search Test */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Search Your Expenses</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Try: 'coffee expenses', 'birthday gifts', 'rental payments', 'shopping last month'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && testSearch()}
            />
            <Button 
              onClick={testSearch}
              disabled={loading || !query.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mb-4">
              <p className="text-destructive text-sm">❌ Error: {error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Found {results.length} result{results.length !== 1 ? 's' : ''}:</h4>
              {results.map((result, index) => (
                <div key={index} className="border rounded p-4 bg-card">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        {(result.metadata as any).type || result.table_name}
                      </span>
                      <span className="font-medium">#{result.id}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Relevance: {(result.fts_rank * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm font-medium text-foreground mb-2">{result.content}</p>

                  {/* Rich Metadata Display */}
                  <div className="space-y-2 text-sm">
                    {/* Amount & Date */}
                    <div className="flex flex-wrap gap-4">
                      {(result.metadata as any).amount && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          RM {Number((result.metadata as any).amount).toFixed(2)}
                        </span>
                      )}
                      {(result.metadata as any).total_amount && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Total: RM {Number((result.metadata as any).total_amount).toFixed(2)}
                        </span>
                      )}
                      {((result.metadata as any).date || (result.metadata as any).expense_date) && (
                        <span className="text-muted-foreground">
                          {new Date((result.metadata as any).date || (result.metadata as any).expense_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Category & Payment Method */}
                    <div className="flex flex-wrap gap-2">
                      {result.metadata.category_name && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          {result.metadata.category_name}
                        </span>
                      )}
                      {result.metadata.payment_method_name && result.metadata.payment_method_name !== 'Unknown' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                          {result.metadata.payment_method_name}
                        </span>
                      )}
                      {result.metadata.transaction_type && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          result.metadata.transaction_type === 'income' 
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                            : 'bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}>
                          {result.metadata.transaction_type}
                        </span>
                      )}
                    </div>

                    {/* Categories Array for Expenses */}
                    {result.metadata.categories && result.metadata.categories.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.metadata.categories.map((cat: any, catIndex: number) => (
                            <span key={catIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400">
                              {cat.name} (RM {Number(cat.amount).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description for items */}
                    {result.metadata.expense_description && result.metadata.type === 'expense_item' && (
                      <p className="text-xs text-muted-foreground">
                        Expense: {result.metadata.expense_description}
                      </p>
                    )}
                  </div>

                  {/* Raw Metadata Toggle */}
                  <details className="mt-3 text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">Technical Details</summary>
                    <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(result.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && !error && query && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                🔍 No results found. Try different keywords or check your expense history.
              </p>
            </div>
          )}
        </div>

        {/* Search Tips */}
        <div className="border rounded p-4 bg-blue-500/10">
          <h3 className="font-semibold mb-2">💡 Search Tips:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Search finds both exact matches and related concepts</li>
            <li>• Try categories: "food", "transport", "entertainment", "utilities"</li>
            <li>• Search by merchant: "Starbucks", "Grab", "Shopee"</li>
            <li>• Use descriptive terms: "birthday gifts", "monthly subscriptions"</li>
            <li>• The system understands synonyms and context</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 