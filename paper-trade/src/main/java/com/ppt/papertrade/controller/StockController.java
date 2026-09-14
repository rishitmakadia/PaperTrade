package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.response.CandleResponse;
import com.ppt.papertrade.dto.response.IndexQuoteResponse;
import com.ppt.papertrade.dto.response.NewsItemResponse;
import com.ppt.papertrade.dto.response.StockQuoteResponse;
import com.ppt.papertrade.entity.Stock;
import com.ppt.papertrade.marketdata.MarketDataService;
import com.ppt.papertrade.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST controller for live stock quotes, market indices, historical candles, and news.
 */
@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final MarketDataService marketDataService;
    private final StockRepository stockRepository;

    private static final List<String> TOP_INDIAN_SYMBOLS = List.of(
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
            "BHARTIARTL", "SBIN", "LT", "ITC", "HINDUNILVR",
            "BAJFINANCE", "MARUTI", "SUNPHARMA", "ASIANPAINT", "TATAMOTORS",
            "KOTAKBANK", "AXISBANK", "NESTLEIND", "TITAN", "WIPRO"
    );

    @GetMapping
    public ResponseEntity<List<StockQuoteResponse>> getAllStocks() {
        Set<String> symbolSet = new LinkedHashSet<>(TOP_INDIAN_SYMBOLS);
        stockRepository.findByActiveTrueOrderBySymbolAsc()
                .stream()
                .map(Stock::getSymbol)
                .filter(s -> !s.contains(".") && !s.equalsIgnoreCase("ADANI"))
                .forEach(symbolSet::add);

        List<StockQuoteResponse> quotes = marketDataService.getAllQuotes(new ArrayList<>(symbolSet));
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/indices")
    public ResponseEntity<List<IndexQuoteResponse>> getIndices() {
        List<IndexQuoteResponse> indices = marketDataService.getIndices();
        return ResponseEntity.ok(indices);
    }

    @GetMapping("/{symbol}")
    public ResponseEntity<StockQuoteResponse> getStockQuote(@PathVariable String symbol) {
        StockQuoteResponse quote = marketDataService.getQuote(symbol);
        return ResponseEntity.ok(quote);
    }

    @GetMapping("/{symbol}/history")
    public ResponseEntity<List<CandleResponse>> getStockHistory(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "3M") String period
    ) {
        List<CandleResponse> history = marketDataService.getHistoricalCandles(symbol, period);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/search")
    public ResponseEntity<List<StockQuoteResponse>> searchStocks(@RequestParam("q") String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        List<StockQuoteResponse> results = marketDataService.searchStocks(query.trim());

        // Automatically persist any newly discovered Indian stocks into StockRepository
        for (StockQuoteResponse quote : results) {
            String exch = quote.getExchange() != null ? quote.getExchange().toUpperCase() : "NSE";
            boolean isIndian = "INR".equalsIgnoreCase(quote.getCurrency()) ||
                    List.of("NSE", "NSI", "BSE", "BOM", "BSI").contains(exch);

            if (isIndian && quote.getSymbol() != null && !quote.getSymbol().contains(".") && !stockRepository.existsBySymbolIgnoreCase(quote.getSymbol())) {
                try {
                    stockRepository.save(Stock.builder()
                            .symbol(quote.getSymbol().toUpperCase())
                            .companyName(quote.getName() != null ? quote.getName() : quote.getSymbol())
                            .exchange("NSE")
                            .sector(quote.getSector() != null ? quote.getSector() : "Other")
                            .active(true)
                            .build());
                } catch (Exception ignored) {
                }
            }
        }

        return ResponseEntity.ok(results);
    }

    @GetMapping("/{symbol}/news")
    public ResponseEntity<List<NewsItemResponse>> getStockNews(@PathVariable String symbol) {
        List<NewsItemResponse> news = marketDataService.getNews(symbol);
        return ResponseEntity.ok(news);
    }
}
