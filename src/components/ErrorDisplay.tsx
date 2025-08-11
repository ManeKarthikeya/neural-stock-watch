import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => {
  return (
    <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-bear/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-bear/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-bear-bright" />
        </div>
        <CardTitle className="text-xl text-bear-bright">Prediction Failed</CardTitle>
        <CardDescription className="text-muted-foreground">
          Unable to process your request
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-foreground">{message}</p>
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-bear/30 text-bear-bright hover:bg-bear/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};