import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Search, Brain } from "lucide-react";

interface StockPredictionFormProps {
  onPredict: (ticker: string) => void;
  isLoading: boolean;
}

export const StockPredictionForm = ({ onPredict, isLoading }: StockPredictionFormProps) => {
  const [ticker, setTicker] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onPredict(ticker.trim().toUpperCase());
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
        <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
          <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Neural Stock Predictor
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm sm:text-base">
          Enter a stock ticker to get AI-powered trend predictions
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter ticker (e.g., AAPL, TSLA)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-lg font-medium bg-background/50 border-border/50 focus:bg-background focus:border-primary/50"
              disabled={isLoading}
            />
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </div>
          <Button
            type="submit"
            disabled={!ticker.trim() || isLoading}
            className="w-full py-2.5 sm:py-3 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                <span className="text-sm sm:text-base">Analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Predict Trend</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};