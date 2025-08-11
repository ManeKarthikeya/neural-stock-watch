import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Clock, RefreshCw, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentPrice } from '@/services/stockPredictionService';
import { useToast } from '@/hooks/use-toast';

interface SearchHistory {
  id: string;
  ticker: string;
  prediction: 'UP' | 'DOWN';
  confidence: number;
  search_price: number;
  search_profit_loss: number;
  current_price: number | null;
  current_profit_loss: number | null;
  searched_at: string;
  updated_at?: string;
}

export default function History() {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-update prices every 30 seconds for real-time tracking
  useEffect(() => {
    if (history.length > 0) {
      // Initial update when history loads
      updateCurrentPrices();
      
      const interval = setInterval(() => {
        updateCurrentPrices();
      }, 30 * 1000); // 30 seconds for more frequent updates

      return () => clearInterval(interval);
    }
  }, [history.length]);

  useEffect(() => {
    if (user) {
      fetchHistory().then(() => {
        // Update prices immediately after fetching history
        setTimeout(() => updateCurrentPrices(), 1000);
      });
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('searched_at', { ascending: false });

      if (error) throw error;
      setHistory((data as SearchHistory[]) || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentPrices = async () => {
    if (!user || history.length === 0) return;
    
    setUpdating(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Process updates in smaller batches to avoid API rate limits
      const batchSize = 2;
      const updatedHistory = [...history];
      
      for (let i = 0; i < history.length; i += batchSize) {
        const batch = history.slice(i, i + batchSize);
        
        const batchUpdates = await Promise.all(
          batch.map(async (item, batchIndex) => {
            const actualIndex = i + batchIndex;
            try {
              console.log(`Fetching current price for ${item.ticker}...`);
              const currentData = await getCurrentPrice(item.ticker);
              
              if (currentData && currentData.currentPrice > 0) {
                const currentProfitLoss = ((currentData.currentPrice - item.search_price) / item.search_price) * 100;
                
                console.log(`${item.ticker}: Search Price: $${item.search_price}, Current Price: $${currentData.currentPrice}, P&L: ${currentProfitLoss.toFixed(2)}%`);
                
                // Update in database with retry logic
                const { error } = await supabase
                  .from('search_history')
                  .update({
                    current_price: currentData.currentPrice,
                    current_profit_loss: currentProfitLoss,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', item.id);

                if (error) {
                  console.error(`Failed to update ${item.ticker} in database:`, error);
                  errorCount++;
                  return { index: actualIndex, item }; // Return original item if update fails
                }

                successCount++;
                return {
                  index: actualIndex,
                  item: {
                    ...item,
                    current_price: currentData.currentPrice,
                    current_profit_loss: currentProfitLoss,
                    updated_at: new Date().toISOString()
                  }
                };
              } else {
                console.warn(`No valid price data for ${item.ticker}`);
                errorCount++;
                return { index: actualIndex, item };
              }
            } catch (error) {
              console.error(`Error fetching price for ${item.ticker}:`, error);
              errorCount++;
              return { index: actualIndex, item };
            }
          })
        );

        // Apply batch updates to history
        batchUpdates.forEach(({ index, item }) => {
          updatedHistory[index] = item;
        });

        // Update state with current batch results for real-time feedback
        setHistory([...updatedHistory]);
        
        // Longer delay between batches to respect API rate limits
        if (i + batchSize < history.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setLastUpdated(new Date());
      
      if (successCount > 0) {
        toast({
          title: "Live Market Data Updated",
          description: `Successfully updated ${successCount} stocks with real-time prices${errorCount > 0 ? `. ${errorCount} stocks failed to update` : ''}`,
        });
      } else if (errorCount > 0) {
        toast({
          title: "Update Failed",
          description: "Failed to fetch current market data. Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating current prices:', error);
      toast({
        title: "Update Error",
        description: "Failed to fetch real-time market data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent.toFixed(2)}%`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your search history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Search History</h1>
          </div>
          {history.length > 0 && (
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  <span>Last updated: {format(lastUpdated, 'HH:mm:ss')}</span>
                </div>
              )}
              <Button
                onClick={updateCurrentPrices}
                disabled={updating}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                <span>{updating ? 'Updating...' : 'Update Prices'}</span>
              </Button>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Search History</h3>
              <p className="text-muted-foreground mb-4">
                Start making predictions to see your search history here.
              </p>
              <Button onClick={() => navigate('/')}>
                Make Your First Prediction
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.prediction === 'UP' ? 'bg-bull/20' : 'bg-bear/20'
                      }`}>
                        {item.prediction === 'UP' ? (
                          <TrendingUp className="w-5 h-5 text-bull-bright" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-bear-bright" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.ticker}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(item.searched_at), 'PPp')}</span>
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={item.prediction === 'UP' ? 'default' : 'destructive'}
                      className={item.prediction === 'UP' ? 'bg-bull text-white' : 'bg-bear text-white'}
                    >
                      {item.prediction} {item.confidence}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Search Price</span>
                      <div className="font-semibold">{formatPrice(item.search_price)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Search P&L</span>
                      <div className={`font-semibold ${
                        item.search_profit_loss >= 0 ? 'text-bull-bright' : 'text-bear-bright'
                      }`}>
                        {item.search_profit_loss >= 0 ? '+' : ''}{formatPercent(item.search_profit_loss)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Price</span>
                      <div className="font-semibold">
                        {item.current_price ? formatPrice(item.current_price) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current P&L</span>
                      <div className={`font-semibold ${
                        item.current_profit_loss 
                          ? item.current_profit_loss >= 0 ? 'text-bull-bright' : 'text-bear-bright'
                          : ''
                      }`}>
                        {item.current_profit_loss 
                          ? `${item.current_profit_loss >= 0 ? '+' : ''}${formatPercent(item.current_profit_loss)}`
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}