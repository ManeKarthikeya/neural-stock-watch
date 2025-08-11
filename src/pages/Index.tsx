import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StockPredictionForm } from "@/components/StockPredictionForm";
import { PredictionResult, PredictionData } from "@/components/PredictionResult";
import { StockChart, ChartDataPoint } from "@/components/StockChart";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { StockSearch } from "@/components/StockSearch";
import { Navbar } from "@/components/Navbar";
import { predictStockTrend, getSupportedTickers, searchStocks } from "@/services/stockPredictionService";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Zap, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Check if user needs to complete profile
  useEffect(() => {
    if (user && !loading) {
      checkUserProfile();
    }
  }, [user, loading]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  const checkUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
        return;
      }

      // If user has no profile or incomplete profile, redirect to profile page
      if (!data || !data.name) {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const saveToHistory = async (predictionData: PredictionData, chartData: ChartDataPoint[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          ticker: predictionData.ticker,
          prediction: predictionData.prediction,
          confidence: predictionData.confidence,
          search_price: predictionData.currentPrice,
          search_profit_loss: predictionData.change,
          current_price: predictionData.currentPrice,
          current_profit_loss: predictionData.change
        });

      if (error) {
        console.error('Error saving to history:', error);
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handlePredict = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setChartData([]);

    try {
      const result = await predictStockTrend(ticker);
      setPrediction(result.prediction);
      setChartData(result.chartData);
      
      // Save to history if user is logged in
      if (user) {
        await saveToHistory(result.prediction, result.chartData);
      }
      
      toast({
        title: "Prediction Complete! 🎯",
        description: `${ticker} analysis finished with ${result.prediction.confidence}% confidence`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "⚠️ Unable to fetch prediction. Please try again later.";
      setError(errorMessage);
      
      toast({
        title: "Prediction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (prediction?.ticker) {
      handlePredict(prediction.ticker);
    }
  };

  const supportedTickers = getSupportedTickers();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-bull/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-bear/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-3 sm:mb-0 sm:mr-4 shadow-lg">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Neural Stock Watch
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground mt-1 sm:mt-2">AI-Powered Market Predictions</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Badge variant="secondary" className="px-2 py-1 text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Real-time </span>Analysis
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Neural Networks
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs sm:text-sm">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              95% Accuracy
            </Badge>
            <Badge variant="secondary" className="px-2 py-1 text-xs sm:text-sm">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Global Markets
            </Badge>
          </div>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Our advanced Artificial Neural Network analyzes 30 days of historical data to predict whether a stock will go 
            <span className="text-bull-bright font-semibold"> UP 📈</span> or 
            <span className="text-bear-bright font-semibold"> DOWN 📉</span> tomorrow.
          </p>
        </div>

        {/* Supported Tickers */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            🌍 <strong>All stocks supported!</strong> Try any ticker symbol (examples below):
          </p>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            {supportedTickers.map((ticker) => (
              <Badge 
                key={ticker} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10 transition-colors text-xs sm:text-sm px-2 py-1"
                onClick={() => !isLoading && handlePredict(ticker)}
              >
                {ticker}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Or enter any stock ticker like NFLX, BABA, V, JPM, etc.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Left Column - Form */}
            <div className="space-y-4 sm:space-y-6">
              <StockPredictionForm onPredict={handlePredict} isLoading={isLoading} />
              
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  💡 Or search for any stock:
                </p>
                <StockSearch onSelectStock={handlePredict} disabled={isLoading} />
              </div>
              
              {error && (
                <ErrorDisplay message={error} onRetry={handleRetry} />
              )}
              
              {prediction && (
                <PredictionResult prediction={prediction} />
              )}
            </div>

            {/* Right Column - Chart */}
            <div className="space-y-4 sm:space-y-6">
              {chartData.length > 0 && prediction && (
                <StockChart data={chartData} ticker={prediction.ticker} />
              )}
              
              {!chartData.length && !isLoading && !error && (
                <div className="h-48 sm:h-64 flex items-center justify-center bg-card/30 rounded-lg border border-dashed border-border">
                  <div className="text-center text-muted-foreground px-4">
                    <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Stock chart will appear here after prediction</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-16 text-xs sm:text-sm text-muted-foreground px-2">
          <p>⚠️ This uses real market data with AI predictions. Not financial advice.</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Index;
