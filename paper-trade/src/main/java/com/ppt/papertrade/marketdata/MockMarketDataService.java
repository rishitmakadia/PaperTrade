package com.ppt.papertrade.marketdata;

import com.ppt.papertrade.dto.response.CandleResponse;
import com.ppt.papertrade.dto.response.IndexQuoteResponse;
import com.ppt.papertrade.dto.response.NewsItemResponse;
import com.ppt.papertrade.dto.response.StockQuoteResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Mock & Simulation Market Data implementation.
 * Generates realistic price movements for testing outside NSE market hours and offline environments.
 */
@Service("mockMarketDataService")
public class MockMarketDataService implements MarketDataService {

    private static final Map<String, StockBase> STOCK_DEFAULTS = new LinkedHashMap<>();

    static {
        STOCK_DEFAULTS.put("RELIANCE", new StockBase("Reliance Industries Ltd", new BigDecimal("1274.00"), "Energy"));
        STOCK_DEFAULTS.put("TCS", new StockBase("Tata Consultancy Services Ltd", new BigDecimal("2204.10"), "IT"));
        STOCK_DEFAULTS.put("HDFCBANK", new StockBase("HDFC Bank Ltd", new BigDecimal("693.80"), "Banking"));
        STOCK_DEFAULTS.put("INFY", new StockBase("Infosys Ltd", new BigDecimal("1036.50"), "IT"));
        STOCK_DEFAULTS.put("ICICIBANK", new StockBase("ICICI Bank Ltd", new BigDecimal("1384.50"), "Banking"));
        STOCK_DEFAULTS.put("BHARTIARTL", new StockBase("Bharti Airtel Ltd", new BigDecimal("1839.00"), "Telecom"));
        STOCK_DEFAULTS.put("WIPRO", new StockBase("Wipro Ltd", new BigDecimal("166.30"), "IT"));
        STOCK_DEFAULTS.put("SBIN", new StockBase("State Bank of India", new BigDecimal("1009.70"), "Banking"));
        STOCK_DEFAULTS.put("TATAMOTORS", new StockBase("Tata Motors Ltd", new BigDecimal("300.50"), "Auto"));
        STOCK_DEFAULTS.put("TMPV", new StockBase("Tata Motors Pass Veh Ltd", new BigDecimal("300.50"), "Auto"));
        STOCK_DEFAULTS.put("MARUTI", new StockBase("Maruti Suzuki India Ltd", new BigDecimal("12590.00"), "Auto"));
        STOCK_DEFAULTS.put("BAJFINANCE", new StockBase("Bajaj Finance Ltd", new BigDecimal("1043.50"), "NBFC"));
        STOCK_DEFAULTS.put("SUNPHARMA", new StockBase("Sun Pharmaceutical Industries Ltd", new BigDecimal("1861.00"), "Pharma"));
        STOCK_DEFAULTS.put("LT", new StockBase("Larsen & Toubro Ltd", new BigDecimal("3955.00"), "Infrastructure"));
        STOCK_DEFAULTS.put("ASIANPAINT", new StockBase("Asian Paints Ltd", new BigDecimal("2498.10"), "Consumer"));
        STOCK_DEFAULTS.put("NESTLEIND", new StockBase("Nestle India Ltd", new BigDecimal("1386.20"), "FMCG"));
        STOCK_DEFAULTS.put("HINDUNILVR", new StockBase("Hindustan Unilever Ltd", new BigDecimal("1942.30"), "FMCG"));
        STOCK_DEFAULTS.put("ITC", new StockBase("ITC Ltd", new BigDecimal("259.30"), "FMCG"));
        STOCK_DEFAULTS.put("KOTAKBANK", new StockBase("Kotak Mahindra Bank Ltd", new BigDecimal("416.55"), "Banking"));
        STOCK_DEFAULTS.put("AXISBANK", new StockBase("Axis Bank Ltd", new BigDecimal("1246.00"), "Banking"));
    }

    private static record StockBase(String name, BigDecimal basePrice, String sector) {}

    @Override
    public List<StockQuoteResponse> getAllQuotes(List<String> symbols) {
        List<StockQuoteResponse> quotes = new ArrayList<>();
        for (String sym : symbols) {
            quotes.add(getQuote(sym));
        }
        return quotes;
    }

    @Override
    public StockQuoteResponse getQuote(String symbol) {
        String sym = symbol.toUpperCase().replace(".NS", "");
        StockBase base = STOCK_DEFAULTS.getOrDefault(sym, new StockBase(sym, new BigDecimal("1000.00"), "Other"));

        // Micro fluctuation based on symbol hash and current minute
        long minute = System.currentTimeMillis() / 60000;
        int hash = Math.abs((sym + minute).hashCode());
        double changePctDouble = ((hash % 400) - 200) / 100.0; // -2.00% to +2.00%
        BigDecimal changePercent = BigDecimal.valueOf(changePctDouble).setScale(2, RoundingMode.HALF_UP);

        BigDecimal price = base.basePrice.multiply(BigDecimal.ONE.add(changePercent.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal change = price.subtract(base.basePrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal open = base.basePrice.multiply(new BigDecimal("0.995")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal high = price.max(open).multiply(new BigDecimal("1.015")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal low = price.min(open).multiply(new BigDecimal("0.985")).setScale(2, RoundingMode.HALF_UP);

        return StockQuoteResponse.builder()
                .symbol(sym)
                .name(base.name)
                .price(price)
                .change(change)
                .changePercent(changePercent)
                .volume("1.8M")
                .high(high)
                .low(low)
                .open(open)
                .prevClose(base.basePrice)
                .week52High(base.basePrice.multiply(new BigDecimal("1.25")).setScale(2, RoundingMode.HALF_UP))
                .week52Low(base.basePrice.multiply(new BigDecimal("0.80")).setScale(2, RoundingMode.HALF_UP))
                .pe(new BigDecimal("24.50"))
                .eps(new BigDecimal("56.80"))
                .sector(base.sector)
                .marketCap("3.2T")
                .avgVolume("2.1M")
                .currency("INR")
                .exchange("NSE")
                .build();
    }

    @Override
    public List<IndexQuoteResponse> getIndices() {
        return List.of(
                IndexQuoteResponse.builder().symbol("^NSEI").name("NIFTY 50").value(new BigDecimal("23477.80")).change(new BigDecimal("120.45")).changePercent(new BigDecimal("0.51")).build(),
                IndexQuoteResponse.builder().symbol("^BSESN").name("SENSEX").value(new BigDecimal("74902.59")).change(new BigDecimal("350.80")).changePercent(new BigDecimal("0.47")).build(),
                IndexQuoteResponse.builder().symbol("^NSEBANK").name("NIFTY BANK").value(new BigDecimal("56471.95")).change(new BigDecimal("-85.20")).changePercent(new BigDecimal("-0.15")).build()
        );
    }

    @Override
    public List<CandleResponse> getHistoricalCandles(String symbol, String period) {
        int days = switch (period.toUpperCase()) {
            case "1W" -> 7;
            case "1M" -> 30;
            case "1Y" -> 250;
            default -> 90; // "3M"
        };
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        return getHistoricalCandlesBetween(symbol, start, end);
    }

    @Override
    public List<CandleResponse> getHistoricalCandlesBetween(String symbol, LocalDate startDate, LocalDate endDate) {
        String sym = symbol.toUpperCase().replace(".NS", "");
        StockBase base = STOCK_DEFAULTS.getOrDefault(sym, new StockBase(sym, new BigDecimal("1000.00"), "Other"));

        List<CandleResponse> candles = new ArrayList<>();
        LocalDate current = startDate;
        BigDecimal runningClose = base.basePrice.multiply(new BigDecimal("0.85")).setScale(2, RoundingMode.HALF_UP);
        Random random = new Random((sym + startDate.toString()).hashCode());

        while (!current.isAfter(endDate)) {
            // Skip weekends
            if (current.getDayOfWeek().getValue() <= 5) {
                double pct = (random.nextDouble() * 4.0 - 1.95) / 100.0;
                BigDecimal change = runningClose.multiply(BigDecimal.valueOf(pct)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal close = runningClose.add(change).max(new BigDecimal("10.00"));
                BigDecimal open = runningClose;
                BigDecimal high = open.max(close).add(BigDecimal.valueOf(random.nextDouble() * 10)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal low = open.min(close).subtract(BigDecimal.valueOf(random.nextDouble() * 10)).max(new BigDecimal("5.00")).setScale(2, RoundingMode.HALF_UP);
                long volume = 500000 + (long) (random.nextDouble() * 2000000);

                candles.add(CandleResponse.builder()
                        .date(current.format(DateTimeFormatter.ISO_LOCAL_DATE))
                        .open(open)
                        .high(high)
                        .low(low)
                        .close(close)
                        .volume(volume)
                        .value(close)
                        .build());

                runningClose = close;
            }
            current = current.plusDays(1);
        }

        return candles;
    }

    @Override
    public List<NewsItemResponse> getNews(String symbol) {
        String sym = symbol.toUpperCase().replace(".NS", "");
        return List.of(
                NewsItemResponse.builder()
                        .title(sym + " reports robust quarterly revenue growth and steady margins")
                        .publisher("Market Insights")
                        .link("https://finance.yahoo.com/quote/" + sym + ".NS")
                        .time(LocalDate.now().toString())
                        .thumbnail(null)
                        .build(),
                NewsItemResponse.builder()
                        .title("Sector outlook remains bullish as institutional inflows increase in " + sym)
                        .publisher("Economic Times")
                        .link("https://finance.yahoo.com/quote/" + sym + ".NS")
                        .time(LocalDate.now().minusDays(1).toString())
                        .thumbnail(null)
                        .build()
        );
    }

    @Override
    public List<StockQuoteResponse> searchStocks(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String q = query.trim().toUpperCase();
        List<StockQuoteResponse> results = new ArrayList<>();

        for (Map.Entry<String, StockBase> entry : STOCK_DEFAULTS.entrySet()) {
            String sym = entry.getKey();
            StockBase base = entry.getValue();
            if (sym.contains(q) || base.name.toUpperCase().contains(q) || base.sector.toUpperCase().contains(q)) {
                results.add(getQuote(sym));
            }
        }

        if (results.isEmpty()) {
            // Generate a realistic quote for unknown custom ticker
            results.add(getQuote(q));
        }

        return results;
    }
}
