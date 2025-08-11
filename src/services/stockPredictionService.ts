import { PredictionData } from "@/components/PredictionResult";
import { ChartDataPoint } from "@/components/StockChart";

// Real stock APIs for verification and data
const ALPHA_VANTAGE_API_KEY = "2KEQW81MMX74IY72"; // Real API key for production
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";
const FINANCIALMODELINGPREP_BASE = "https://financialmodelingprep.com/api/v3";

interface AlphaVantageResponse {
  "Global Quote": {
    "01. symbol": string;
    "05. price": string;
    "09. change": string;
    "10. change percent": string;
  };
}

interface AlphaVantageTimeSeriesResponse {
  "Meta Data": {
    "2. Symbol": string;
  };
  "Time Series (Daily)": {
    [date: string]: {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
      "5. volume": string;
    };
  };
}


// Fetch real stock data from Alpha Vantage API
async function fetchRealStockData(ticker: string): Promise<{
  currentPrice: number;
  change: number;
  changePercent: number;
  historicalPrices: ChartDataPoint[];
} | null> {
  try {
    // First get current quote
    const quoteUrl = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      throw new Error(`HTTP ${quoteResponse.status}`);
    }
    
    const quoteData: AlphaVantageResponse = await quoteResponse.json();
    
    if (!quoteData["Global Quote"] || !quoteData["Global Quote"]["05. price"]) {
      throw new Error('Invalid quote data');
    }
    
    const currentPrice = parseFloat(quoteData["Global Quote"]["05. price"]);
    const change = parseFloat(quoteData["Global Quote"]["09. change"]);
    const changePercent = parseFloat(quoteData["Global Quote"]["10. change percent"].replace('%', ''));
    
    // Get historical data (last 30 days)
    const timeSeriesUrl = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const timeSeriesResponse = await fetch(timeSeriesUrl);
    
    if (!timeSeriesResponse.ok) {
      throw new Error(`HTTP ${timeSeriesResponse.status}`);
    }
    
    const timeSeriesData: AlphaVantageTimeSeriesResponse = await timeSeriesResponse.json();
    
    if (!timeSeriesData["Time Series (Daily)"]) {
      throw new Error('No time series data');
    }
    
    const historicalPrices: ChartDataPoint[] = Object.entries(timeSeriesData["Time Series (Daily)"])
      .slice(0, 30) // Last 30 days
      .map(([date, data]) => ({
        date,
        price: parseFloat(data["4. close"])
      }))
      .reverse(); // Reverse to get chronological order
    
    return {
      currentPrice,
      change,
      changePercent,
      historicalPrices
    };
  } catch (error) {
    console.warn(`Failed to fetch real data for ${ticker}:`, error);
    return null;
  }
}

// Verify if stock ticker exists using Alpha Vantage
async function verifyStockExists(ticker: string): Promise<boolean> {
  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return false;
    
    const data: AlphaVantageResponse = await response.json();
    return !!data["Global Quote"] && !!data["Global Quote"]["05. price"];
  } catch (error) {
    console.warn(`Stock verification failed for ${ticker}:`, error);
    return false;
  }
}

// Advanced prediction algorithm based on technical analysis
function advancedPredictionAlgorithm(historicalPrices: ChartDataPoint[]): { prediction: "UP" | "DOWN", confidence: number } {
  if (historicalPrices.length < 20) {
    // Not enough data for reliable analysis
    return {
      prediction: Math.random() > 0.5 ? "UP" : "DOWN",
      confidence: 55
    };
  }

  const prices = historicalPrices.map(p => p.price);
  const currentPrice = prices[prices.length - 1];
  
  // Calculate multiple moving averages
  const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 : sma20;
  
  // EMA calculation (more responsive than SMA)
  const calculateEMA = (data: number[], period: number) => {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  };
  
  const ema12 = calculateEMA(prices.slice(-20), 12);
  const ema26 = calculateEMA(prices.slice(-30), 26);
  const macd = ema12 - ema26;
  
  // RSI calculation (14-period)
  const priceChanges = prices.slice(-15).map((price, i, arr) => 
    i === 0 ? 0 : price - arr[i - 1]
  ).slice(1);
  
  const gains = priceChanges.filter(change => change > 0);
  const losses = priceChanges.filter(change => change < 0).map(loss => Math.abs(loss));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
  
  const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
  
  // Bollinger Bands
  const sma20_bb = sma20;
  const variance = prices.slice(-20).reduce((sum, price) => sum + Math.pow(price - sma20_bb, 2), 0) / 20;
  const stdDev = Math.sqrt(variance);
  const upperBand = sma20_bb + (2 * stdDev);
  const lowerBand = sma20_bb - (2 * stdDev);
  
  // Price momentum
  const momentum = currentPrice - prices[prices.length - 5]; // 5-day momentum
  const weeklyMomentum = currentPrice - prices[prices.length - 7]; // 7-day momentum
  
  // Volume analysis (if available)
  const recentVolatility = Math.abs(prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2];
  
  // Trend analysis
  const shortTrend = currentPrice > sma5 ? 1 : -1;
  const mediumTrend = sma10 > sma20 ? 1 : -1;
  const longTrend = sma20 > sma50 ? 1 : -1;
  
  // Golden Cross / Death Cross
  const goldenCross = sma5 > sma20 && sma10 > sma20 ? 1 : 0;
  const deathCross = sma5 < sma20 && sma10 < sma20 ? -1 : 0;
  
  // Scoring system with weighted factors
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalWeight = 0;
  
  // Moving average signals (weight: 3)
  if (shortTrend === 1) bullishSignals += 3;
  else bearishSignals += 3;
  totalWeight += 3;
  
  if (mediumTrend === 1) bullishSignals += 2;
  else bearishSignals += 2;
  totalWeight += 2;
  
  if (longTrend === 1) bullishSignals += 1;
  else bearishSignals += 1;
  totalWeight += 1;
  
  // RSI signals (weight: 2)
  if (rsi < 30) bullishSignals += 2; // Oversold
  else if (rsi > 70) bearishSignals += 2; // Overbought
  else if (rsi > 50) bullishSignals += 1; // Bullish momentum
  else bearishSignals += 1; // Bearish momentum
  totalWeight += 2;
  
  // MACD signals (weight: 2)
  if (macd > 0) bullishSignals += 2;
  else bearishSignals += 2;
  totalWeight += 2;
  
  // Bollinger Bands (weight: 2)
  if (currentPrice > upperBand) bearishSignals += 2; // Overbought
  else if (currentPrice < lowerBand) bullishSignals += 2; // Oversold
  else if (currentPrice > sma20_bb) bullishSignals += 1;
  else bearishSignals += 1;
  totalWeight += 2;
  
  // Momentum signals (weight: 2)
  if (momentum > 0 && weeklyMomentum > 0) bullishSignals += 2;
  else if (momentum < 0 && weeklyMomentum < 0) bearishSignals += 2;
  else if (momentum > 0) bullishSignals += 1;
  else bearishSignals += 1;
  totalWeight += 2;
  
  // Golden/Death Cross (weight: 3)
  if (goldenCross) bullishSignals += 3;
  if (deathCross) bearishSignals += 3;
  totalWeight += 3;
  
  // Calculate final prediction
  const bullishScore = bullishSignals / totalWeight;
  const bearishScore = bearishSignals / totalWeight;
  
  const prediction = bullishScore > bearishScore ? "UP" : "DOWN";
  
  // Calculate confidence based on signal strength
  const signalStrength = Math.abs(bullishScore - bearishScore);
  let confidence = 50 + (signalStrength * 50);
  
  // Adjust confidence based on volatility
  if (recentVolatility > 0.05) confidence *= 0.85; // Reduce confidence in high volatility
  if (recentVolatility > 0.10) confidence *= 0.75; // Further reduce for extreme volatility
  
  // Ensure confidence is within reasonable bounds
  confidence = Math.min(Math.max(confidence, 55), 88);
  
  return {
    prediction,
    confidence: Math.round(confidence)
  };
}

export async function predictStockTrend(ticker: string): Promise<{
  prediction: PredictionData;
  chartData: ChartDataPoint[];
}> {
  // Simulate realistic API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
  
  const upperTicker = ticker.toUpperCase();
  
  // Fetch real stock data only - no fallbacks
  const stockData = await fetchRealStockData(upperTicker);
  
  if (!stockData) {
    throw new Error(`Stock ticker "${upperTicker}" not found or data unavailable. Please verify the symbol and try again.`);
  }
  
  // Use advanced prediction algorithm
  const prediction_result = advancedPredictionAlgorithm(stockData.historicalPrices);
  
  const prediction: PredictionData = {
    ticker: upperTicker,
    prediction: prediction_result.prediction,
    confidence: prediction_result.confidence,
    currentPrice: stockData.currentPrice,
    change: stockData.change,
    changePercent: stockData.changePercent
  };
  
  return {
    prediction,
    chartData: stockData.historicalPrices
  };
}

// Utility function to validate stock ticker format
export function isValidTicker(ticker: string): boolean {
  const cleanTicker = ticker.trim().toUpperCase();
  return /^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(cleanTicker) && cleanTicker.length >= 1;
}

// Get list of popular tickers for demo (now supports all stocks)
export function getSupportedTickers(): string[] {
  return ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "NVDA", "META"];
}

// Universal stock search - supports ANY valid stock symbol
export async function searchStocks(query: string): Promise<string[]> {
  if (!query.trim()) {
    // Return popular stocks when no query
    return [
      "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", 
      "JPM", "V", "UNH", "HD", "PG", "MA", "DIS", "BAC"
    ];
  }
  
  const upperQuery = query.toUpperCase();
  
  // Always include the searched ticker if it's in valid format
  const results: string[] = [];
  
  if (isValidTicker(upperQuery)) {
    results.push(upperQuery);
  }
  
  // Add popular stocks that match the query
  const popularStocks = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "BABA", "V",
    "JPM", "JNJ", "WMT", "PG", "UNH", "MA", "DIS", "HD", "PYPL", "BAC",
    "INTC", "CMCSA", "VZ", "ADBE", "CRM", "NKE", "PFE", "TMO", "ABBV", "COST",
    "ORCL", "AVGO", "XOM", "KO", "PEP", "CVX", "LLY", "ACN", "DHR", "QCOM",
    "SPY", "QQQ", "IWM", "VTI", "ARKK", "GLD", "SLV", "TLT", "IBM", "CSCO"
  ];
  
  const matchingStocks = popularStocks.filter(stock => 
    stock.includes(upperQuery) && stock !== upperQuery
  );
  
  results.push(...matchingStocks);
  
  return results.slice(0, 15);
}

// Get current price for a specific ticker (for history updates)
export async function getCurrentPrice(ticker: string): Promise<{
  currentPrice: number;
  change: number;
  changePercent: number;
} | null> {
  try {
    const quoteUrl = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(quoteUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: AlphaVantageResponse = await response.json();
    
    if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
      throw new Error('Invalid quote data');
    }
    
    return {
      currentPrice: parseFloat(data["Global Quote"]["05. price"]),
      change: parseFloat(data["Global Quote"]["09. change"]),
      changePercent: parseFloat(data["Global Quote"]["10. change percent"].replace('%', ''))
    };
  } catch (error) {
    console.warn(`Failed to fetch current price for ${ticker}:`, error);
    return null;
  }
}

// Synchronous version for backward compatibility
export function searchStocksSync(query: string): string[] {
  if (!query.trim()) {
    return [
      "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", 
      "JPM", "V", "UNH", "HD", "PG", "MA", "DIS", "BAC"
    ];
  }
  
  const upperQuery = query.toUpperCase();
  const results: string[] = [];
  
  // Always include the searched ticker if it's in valid format
  if (isValidTicker(upperQuery)) {
    results.push(upperQuery);
  }
  
  // Add popular stocks that match
  const popularStocks = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "BABA", "V",
    "JPM", "JNJ", "WMT", "PG", "UNH", "MA", "DIS", "HD", "PYPL", "BAC",
    "INTC", "CMCSA", "VZ", "ADBE", "CRM", "NKE", "PFE", "TMO", "ABBV", "COST"
  ];
  
  const matchingStocks = popularStocks.filter(stock => 
    stock.includes(upperQuery) && stock !== upperQuery
  );
  
  results.push(...matchingStocks);
  
  return results.slice(0, 12);
}