import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp } from "lucide-react";
import { searchStocksSync } from "@/services/stockPredictionService";
import { Badge } from "@/components/ui/badge";

interface StockSearchProps {
  onSelectStock: (ticker: string) => void;
  disabled?: boolean;
}

export const StockSearch = ({ onSelectStock, disabled }: StockSearchProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.length > 0) {
      const results = searchStocksSync(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSelectStock = (ticker: string) => {
    setQuery("");
    setShowSuggestions(false);
    onSelectStock(ticker);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search stocks (e.g., AAPL, Tesla)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-2.5 sm:py-3 text-base sm:text-lg font-medium bg-background/50 border-border/50 focus:bg-background focus:border-primary/50"
          disabled={disabled}
          onFocus={() => query && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((ticker) => (
                <div
                  key={ticker}
                  onClick={() => handleSelectStock(ticker)}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm sm:text-base">{ticker}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Stock
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};