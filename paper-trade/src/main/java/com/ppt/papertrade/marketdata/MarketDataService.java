package com.ppt.papertrade.marketdata;

import com.ppt.papertrade.dto.response.CandleResponse;
import com.ppt.papertrade.dto.response.IndexQuoteResponse;
import com.ppt.papertrade.dto.response.NewsItemResponse;
import com.ppt.papertrade.dto.response.StockQuoteResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Object-Oriented Live Market Data Interface.
 * Defines contracts for fetching stock quotes, indices, candles, and news.
 * Can be implemented by YahooMarketDataService, Bloomberg, AlphaVantage, or Mock/Simulation providers.
 */
public interface MarketDataService {

    /**
     * Retrieve quotes for a list of symbols.
     */
    List<StockQuoteResponse> getAllQuotes(List<String> symbols);

    /**
     * Retrieve detailed quote for a single symbol.
     */
    StockQuoteResponse getQuote(String symbol);

    /**
     * Retrieve major market indices (e.g. NIFTY 50, SENSEX, BANK NIFTY).
     */
    List<IndexQuoteResponse> getIndices();

    /**
     * Retrieve historical candles for a symbol over a standard period (1W, 1M, 3M, 1Y).
     */
    List<CandleResponse> getHistoricalCandles(String symbol, String period);

    /**
     * Retrieve historical candles between two specific dates (for backtesting).
     */
    List<CandleResponse> getHistoricalCandlesBetween(String symbol, LocalDate startDate, LocalDate endDate);

    /**
     * Retrieve latest news headlines for a symbol.
     */
    List<NewsItemResponse> getNews(String symbol);

    /**
     * Dynamically search stocks by ticker, company name, or keyword across Yahoo Finance / mock universe.
     */
    List<StockQuoteResponse> searchStocks(String query);
}
