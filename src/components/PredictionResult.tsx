import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PredictionData {
  ticker: string;
  prediction: "UP" | "DOWN";
  confidence: number;
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface PredictionResultProps {
  prediction: PredictionData;
}

export const PredictionResult = ({ prediction }: PredictionResultProps) => {
  const isUp = prediction.prediction === "UP";
  const isPositiveChange = prediction.change >= 0;

  return (
    <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
        <div className={cn(
          "mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center",
          isUp ? "bg-gradient-to-br from-bull to-bull-bright" : "bg-gradient-to-br from-bear to-bear-bright"
        )}>
          {isUp ? (
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          ) : (
            <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          )}
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">
          {prediction.ticker}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm sm:text-base">
          Neural Network Prediction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-center">
          <div className={cn(
            "text-3xl sm:text-4xl font-bold mb-2",
            isUp ? "text-bull-bright" : "text-bear-bright"
          )}>
            {isUp ? "📈" : "📉"} {prediction.prediction}
          </div>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs sm:text-sm font-medium px-2 sm:px-3 py-1",
              isUp 
                ? "bg-bull/20 text-bull-bright border-bull/30" 
                : "bg-bear/20 text-bear-bright border-bear/30"
            )}
          >
            {prediction.confidence}% Confidence
          </Badge>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center p-2.5 sm:p-3 bg-background/30 rounded-lg">
            <span className="text-muted-foreground text-sm sm:text-base">Current Price</span>
            <span className="font-bold text-foreground text-sm sm:text-base">${prediction.currentPrice.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center p-2.5 sm:p-3 bg-background/30 rounded-lg">
            <span className="text-muted-foreground text-sm sm:text-base">24h Change</span>
            <div className="text-right">
              <div className={cn(
                "font-bold text-sm sm:text-base",
                isPositiveChange ? "text-bull-bright" : "text-bear-bright"
              )}>
                {isPositiveChange ? "+" : ""}{prediction.change.toFixed(2)}
              </div>
              <div className={cn(
                "text-xs sm:text-sm",
                isPositiveChange ? "text-bull" : "text-bear"
              )}>
                ({isPositiveChange ? "+" : ""}{prediction.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-neutral/10 rounded-lg border border-neutral/20">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-neutral mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This prediction uses real market data with AI analysis. Not financial advice. Always do your own research before investing.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};