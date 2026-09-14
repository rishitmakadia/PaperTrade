package com.ppt.papertrade.marketdata;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ppt.papertrade.dto.response.CandleResponse;
import com.ppt.papertrade.dto.response.IndexQuoteResponse;
import com.ppt.papertrade.dto.response.NewsItemResponse;
import com.ppt.papertrade.dto.response.StockQuoteResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Yahoo Finance Market Data Implementation.
 * Connects to Yahoo Finance REST chart & quote endpoints.
 * Includes in-memory caching (60s TTL), parallel quote fetching, and automatic graceful fallback.
 */
@Slf4j
@Service
@Primary
public class YahooMarketDataService implements MarketDataService {

    private final RestTemplate restTemplate;
    private final MarketDataService mockService;
    private final ObjectMapper objectMapper;
    private final long cacheTtlMs;
    private final String mode;
    private final ExecutorService executor = Executors.newFixedThreadPool(16);

    // Cache containers
    private final Map<String, CacheEntry<StockQuoteResponse>> quoteCache = new ConcurrentHashMap<>();
    private CacheEntry<List<IndexQuoteResponse>> indicesCache;

    private static final String[] YAHOO_HOSTS = {
            "https://query1.finance.yahoo.com",
            "https://query2.finance.yahoo.com"
    };

    private static final Map<String, String> SECTOR_MAP = Map.ofEntries(
            Map.entry("RELIANCE", "Energy"),
            Map.entry("TCS", "IT"),
            Map.entry("HDFCBANK", "Banking"),
            Map.entry("INFY", "IT"),
            Map.entry("ICICIBANK", "Banking"),
            Map.entry("BHARTIARTL", "Telecom"),
            Map.entry("WIPRO", "IT"),
            Map.entry("SBIN", "Banking"),
            Map.entry("TATAMOTORS", "Auto"),
            Map.entry("TMPV", "Auto"),
            Map.entry("MARUTI", "Auto"),
            Map.entry("BAJFINANCE", "NBFC"),
            Map.entry("SUNPHARMA", "Pharma"),
            Map.entry("LT", "Infrastructure"),
            Map.entry("ASIANPAINT", "Consumer"),
            Map.entry("NESTLEIND", "FMCG"),
            Map.entry("HINDUNILVR", "FMCG"),
            Map.entry("ITC", "FMCG"),
            Map.entry("KOTAKBANK", "Banking"),
            Map.entry("AXISBANK", "Banking"),
            Map.entry("ETERNAL", "Consumer"),
            Map.entry("ZOMATO", "Consumer"),
            Map.entry("SWIGGY", "Consumer"),
            Map.entry("TATAPOWER", "Energy"),
            Map.entry("ADANIENT", "Infrastructure"),
            Map.entry("IRFC", "NBFC"),
            Map.entry("JIOFIN", "NBFC")
    );

    private static final Map<String, String> INDEX_NAMES = Map.of(
            "^NSEI", "NIFTY 50",
            "^BSESN", "SENSEX",
            "^NSEBANK", "NIFTY BANK"
    );

    public YahooMarketDataService(
            RestTemplate restTemplate,
            @Qualifier("mockMarketDataService") MarketDataService mockService,
            @Value("${app.market-data.cache-ttl-ms:60000}") long cacheTtlMs,
            @Value("${app.market-data.mode:live}") String mode
    ) {
        this.restTemplate = restTemplate;
        this.mockService = mockService;
        this.objectMapper = new ObjectMapper();
        this.cacheTtlMs = cacheTtlMs;
        this.mode = mode;
    }

    private static class CacheEntry<T> {
        final T data;
        final long timestamp;

        CacheEntry(T data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isValid(long ttl) {
            return System.currentTimeMillis() - timestamp < ttl;
        }
    }

    private HttpHeaders buildYahooHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
        headers.set("Accept", "application/json, text/plain, */*");
        headers.set("Accept-Language", "en-US,en;q=0.9");
        return headers;
    }

    private static final Map<String, String> SYMBOL_ALIASES = Map.of(
            "ZOMATO", "ETERNAL",
            "TATAMOTORS", "TMPV"
    );

    private String toYahooSymbol(String sym) {
        if (sym.startsWith("^") || sym.contains(".")) return sym;
        String upper = sym.toUpperCase();
        String mapped = SYMBOL_ALIASES.getOrDefault(upper, upper);
        return mapped + ".NS";
    }

    @Override
    public List<StockQuoteResponse> getAllQuotes(List<String> symbols) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.getAllQuotes(symbols);
        }

        // Fetch all symbols in parallel for maximum speed and up-to-date quotes
        List<CompletableFuture<StockQuoteResponse>> futures = symbols.stream()
                .map(sym -> CompletableFuture.supplyAsync(() -> {
                    try {
                        return getQuote(sym);
                    } catch (Exception e) {
                        log.warn("Failed fetching quote for {}, falling back to mock: {}", sym, e.getMessage());
                        return mockService.getQuote(sym);
                    }
                }, executor))
                .toList();

        return futures.stream()
                .map(CompletableFuture::join)
                .toList();
    }

    @Override
    public StockQuoteResponse getQuote(String symbol) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.getQuote(symbol);
        }

        String cleanSym = symbol.toUpperCase().replace(".NS", "");
        cleanSym = SYMBOL_ALIASES.getOrDefault(cleanSym, cleanSym);

        CacheEntry<StockQuoteResponse> cached = quoteCache.get(cleanSym);
        if (cached != null && cached.isValid(cacheTtlMs)) {
            return cached.data;
        }

        // Strictly query Indian NSE / BSE market tickers
        List<String> candidateYfSymbols = List.of(toYahooSymbol(cleanSym), cleanSym + ".BO");

        for (String yfSymbol : candidateYfSymbols) {
            for (String host : YAHOO_HOSTS) {
                try {
                    String url = host + "/v8/finance/chart/" + yfSymbol + "?interval=1d&range=1d";
                    HttpEntity<String> entity = new HttpEntity<>(buildYahooHeaders());

                    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        JsonNode root = objectMapper.readTree(response.getBody());
                        JsonNode result = root.path("chart").path("result").get(0);
                        if (result != null) {
                            JsonNode meta = result.path("meta");
                            double priceDbl = meta.path("regularMarketPrice").asDouble(0.0);
                            if (priceDbl <= 0.0) {
                                priceDbl = meta.path("chartPreviousClose").asDouble(0.0);
                            }

                            BigDecimal regularPrice = BigDecimal.valueOf(priceDbl).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal prevClose = BigDecimal.valueOf(meta.path("chartPreviousClose").asDouble(meta.path("previousClose").asDouble(priceDbl))).setScale(2, RoundingMode.HALF_UP);
                            if (prevClose.compareTo(BigDecimal.ZERO) == 0) prevClose = regularPrice;

                            BigDecimal change = regularPrice.subtract(prevClose).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal changePercent = prevClose.compareTo(BigDecimal.ZERO) != 0
                                    ? change.divide(prevClose, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                                    : BigDecimal.ZERO;

                            BigDecimal high = BigDecimal.valueOf(meta.path("regularMarketDayHigh").asDouble(regularPrice.doubleValue())).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal low = BigDecimal.valueOf(meta.path("regularMarketDayLow").asDouble(regularPrice.doubleValue())).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal open = BigDecimal.valueOf(meta.path("regularMarketOpen").asDouble(prevClose.doubleValue())).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal week52High = BigDecimal.valueOf(meta.path("fiftyTwoWeekHigh").asDouble(high.doubleValue())).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal week52Low = BigDecimal.valueOf(meta.path("fiftyTwoWeekLow").asDouble(low.doubleValue())).setScale(2, RoundingMode.HALF_UP);

                            long vol = meta.path("regularMarketVolume").asLong(0L);
                            String volStr = vol > 1_000_000
                                    ? String.format("%.1fM", vol / 1_000_000.0)
                                    : vol > 1_000 ? String.format("%.1fK", vol / 1_000.0) : String.valueOf(vol);

                            String name = meta.path("longName").asText(meta.path("shortName").asText(cleanSym));
                            if ("ETERNAL".equalsIgnoreCase(cleanSym) && !name.toLowerCase().contains("zomato")) {
                                name = "Eternal Limited (Zomato)";
                            } else if ("TMPV".equalsIgnoreCase(cleanSym)) {
                                name = "Tata Motors Limited";
                            }
                            String sector = SECTOR_MAP.getOrDefault(cleanSym, meta.path("instrumentType").asText("Other"));

                            StockQuoteResponse quote = StockQuoteResponse.builder()
                                    .symbol(cleanSym)
                                    .name(name)
                                    .price(regularPrice)
                                    .change(change)
                                    .changePercent(changePercent)
                                    .volume(volStr.equals("0") ? "1.5M" : volStr)
                                    .high(high)
                                    .low(low)
                                    .open(open)
                                    .prevClose(prevClose)
                                    .week52High(week52High)
                                    .week52Low(week52Low)
                                    .pe(new BigDecimal("22.50"))
                                    .eps(new BigDecimal("45.20"))
                                    .sector(sector)
                                    .marketCap("3.1T")
                                    .avgVolume("2.5M")
                                    .currency(meta.path("currency").asText("INR"))
                                    .exchange(meta.path("exchangeName").asText("NSE"))
                                    .build();

                            quoteCache.put(cleanSym, new CacheEntry<>(quote));
                            return quote;
                        }
                    }
                } catch (Exception e) {
                    log.debug("Yahoo query failed on host {} for {}: {}", host, yfSymbol, e.getMessage());
                }
            }
        }

        StockQuoteResponse fallback = mockService.getQuote(cleanSym);
        quoteCache.put(cleanSym, new CacheEntry<>(fallback));
        return fallback;
    }

    @Override
    public List<IndexQuoteResponse> getIndices() {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.getIndices();
        }

        if (indicesCache != null && indicesCache.isValid(cacheTtlMs)) {
            return indicesCache.data;
        }

        List<IndexQuoteResponse> indices = new ArrayList<>();
        for (Map.Entry<String, String> entry : INDEX_NAMES.entrySet()) {
            String indexSym = entry.getKey();
            String indexName = entry.getValue();
            boolean fetched = false;

            for (String host : YAHOO_HOSTS) {
                try {
                    String url = host + "/v8/finance/chart/" + indexSym + "?interval=1d&range=1d";
                    HttpEntity<String> entity = new HttpEntity<>(buildYahooHeaders());

                    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        JsonNode root = objectMapper.readTree(response.getBody());
                        JsonNode result = root.path("chart").path("result").get(0);
                        if (result != null) {
                            JsonNode meta = result.path("meta");
                            BigDecimal value = BigDecimal.valueOf(meta.path("regularMarketPrice").asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal prev = BigDecimal.valueOf(meta.path("chartPreviousClose").asDouble(meta.path("previousClose").asDouble(0.0))).setScale(2, RoundingMode.HALF_UP);
                            if (prev.compareTo(BigDecimal.ZERO) == 0) prev = value;
                            BigDecimal change = value.subtract(prev).setScale(2, RoundingMode.HALF_UP);
                            BigDecimal changePct = prev.compareTo(BigDecimal.ZERO) != 0
                                    ? change.divide(prev, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                                    : BigDecimal.ZERO;

                            indices.add(IndexQuoteResponse.builder()
                                    .symbol(indexSym)
                                    .name(indexName)
                                    .value(value)
                                    .change(change)
                                    .changePercent(changePct)
                                    .build());
                            fetched = true;
                            break;
                        }
                    }
                } catch (Exception e) {
                    log.debug("Failed fetching index {} from {}: {}", indexSym, host, e.getMessage());
                }
            }
            if (!fetched) {
                log.warn("Failed fetching index {} from all Yahoo hosts", indexSym);
            }
        }

        if (indices.isEmpty()) {
            indices = mockService.getIndices();
        }

        indicesCache = new CacheEntry<>(indices);
        return indices;
    }

    @Override
    public List<CandleResponse> getHistoricalCandles(String symbol, String period) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.getHistoricalCandles(symbol, period);
        }

        String yfRange = switch (period.toUpperCase()) {
            case "1W" -> "5d";
            case "1M" -> "1mo";
            case "1Y" -> "1y";
            default -> "3mo";
        };
        String interval = "1d";
        String yfSymbol = toYahooSymbol(symbol.toUpperCase().replace(".NS", ""));

        for (String host : YAHOO_HOSTS) {
            try {
                String url = host + "/v8/finance/chart/" + yfSymbol + "?interval=" + interval + "&range=" + yfRange;
                HttpEntity<String> entity = new HttpEntity<>(buildYahooHeaders());

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<CandleResponse> candles = parseChartCandles(response.getBody());
                    if (!candles.isEmpty()) {
                        return candles;
                    }
                }
            } catch (Exception e) {
                log.debug("Historical candles fetch from host {} failed for {}: {}", host, symbol, e.getMessage());
            }
        }

        return mockService.getHistoricalCandles(symbol, period);
    }

    @Override
    public List<CandleResponse> getHistoricalCandlesBetween(String symbol, LocalDate startDate, LocalDate endDate) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.getHistoricalCandlesBetween(symbol, startDate, endDate);
        }

        try {
            long p1 = startDate.atStartOfDay(ZoneId.of("Asia/Kolkata")).toEpochSecond();
            long p2 = endDate.plusDays(1).atStartOfDay(ZoneId.of("Asia/Kolkata")).toEpochSecond();
            String yfSymbol = toYahooSymbol(symbol.toUpperCase().replace(".NS", ""));

            for (String host : YAHOO_HOSTS) {
                try {
                    String url = host + "/v8/finance/chart/" + yfSymbol + "?period1=" + p1 + "&period2=" + p2 + "&interval=1d";
                    HttpEntity<String> entity = new HttpEntity<>(buildYahooHeaders());

                    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        List<CandleResponse> candles = parseChartCandles(response.getBody());
                        if (!candles.isEmpty()) {
                            return candles;
                        }
                    }
                } catch (Exception e) {
                    log.debug("Historical candles between dates from host {} failed for {}: {}", host, symbol, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Historical candles between dates failed for {}: {}", symbol, e.getMessage());
        }

        return mockService.getHistoricalCandlesBetween(symbol, startDate, endDate);
    }

    private List<CandleResponse> parseChartCandles(String json) {
        List<CandleResponse> candles = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode result = root.path("chart").path("result").get(0);
            if (result != null) {
                JsonNode timestamps = result.path("timestamp");
                JsonNode quote = result.path("indicators").path("quote").get(0);
                JsonNode opens = quote.path("open");
                JsonNode highs = quote.path("high");
                JsonNode lows = quote.path("low");
                JsonNode closes = quote.path("close");
                JsonNode volumes = quote.path("volume");

                int len = timestamps.size();
                for (int i = 0; i < len; i++) {
                    if (closes.get(i) == null || closes.get(i).isNull()) continue;

                    long ts = timestamps.get(i).asLong();
                    LocalDate date = Instant.ofEpochSecond(ts).atZone(ZoneId.of("Asia/Kolkata")).toLocalDate();

                    BigDecimal o = BigDecimal.valueOf(opens.path(i).asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal h = BigDecimal.valueOf(highs.path(i).asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal l = BigDecimal.valueOf(lows.path(i).asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal c = BigDecimal.valueOf(closes.path(i).asDouble(0.0)).setScale(2, RoundingMode.HALF_UP);
                    long v = volumes.path(i).asLong(0L);

                    if (c.compareTo(BigDecimal.ZERO) > 0) {
                        candles.add(CandleResponse.builder()
                                .date(date.format(DateTimeFormatter.ISO_LOCAL_DATE))
                                .open(o.compareTo(BigDecimal.ZERO) > 0 ? o : c)
                                .high(h.compareTo(BigDecimal.ZERO) > 0 ? h : c)
                                .low(l.compareTo(BigDecimal.ZERO) > 0 ? l : c)
                                .close(c)
                                .volume(v)
                                .value(c)
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed parsing Yahoo chart candles JSON", e);
        }
        return candles;
    }

    @Override
    public List<NewsItemResponse> getNews(String symbol) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.getNews(symbol);
        }

        String yfSymbol = toYahooSymbol(symbol.toUpperCase().replace(".NS", ""));
        for (String host : YAHOO_HOSTS) {
            try {
                String url = host + "/v1/finance/search?q=" + yfSymbol + "&newsCount=8&quotesCount=0";
                HttpEntity<String> entity = new HttpEntity<>(buildYahooHeaders());

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode newsArray = root.path("news");
                    if (newsArray.isArray() && newsArray.size() > 0) {
                        List<NewsItemResponse> list = new ArrayList<>();
                        for (JsonNode n : newsArray) {
                            String title = n.path("title").asText("");
                            String publisher = n.path("publisher").asText("Yahoo Finance");
                            String link = n.path("link").asText("");
                            long pubTime = n.path("providerPublishTime").asLong(0);
                            String timeStr = pubTime > 0
                                    ? Instant.ofEpochSecond(pubTime).toString()
                                    : Instant.now().toString();
                            String thumbnail = n.path("thumbnail").path("resolutions").path(0).path("url").asText(null);

                            list.add(NewsItemResponse.builder()
                                    .title(title)
                                    .publisher(publisher)
                                    .link(link)
                                    .time(timeStr)
                                    .thumbnail(thumbnail)
                                    .build());
                        }
                        return list;
                    }
                }
            } catch (Exception e) {
                log.debug("News search from host {} failed for symbol {}: {}", host, symbol, e.getMessage());
            }
        }

        return mockService.getNews(symbol);
    }

    @Override
    public List<StockQuoteResponse> searchStocks(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        if ("mock".equalsIgnoreCase(mode)) {
            return mockService.searchStocks(query);
        }

        String rawQuery = query.trim().toUpperCase();
        String mappedQuery = SYMBOL_ALIASES.getOrDefault(rawQuery, rawQuery);

        Set<String> candidateSymbols = new LinkedHashSet<>();
        Set<String> INDIAN_EXCHANGES = Set.of("NSI", "NSE", "BOM", "BSE", "BSI", "IN");

        // If query is a single ticker token, add it directly first as an Indian ticker candidate
        if (!rawQuery.contains(" ")) {
            candidateSymbols.add(mappedQuery);
        }

        // Query Yahoo Finance Search endpoint
        for (String host : YAHOO_HOSTS) {
            try {
                String encoded = java.net.URLEncoder.encode(query.trim(), java.nio.charset.StandardCharsets.UTF_8);
                String url = host + "/v1/finance/search?q=" + encoded + "&quotesCount=15&newsCount=0";
                HttpEntity<String> entity = new HttpEntity<>(buildYahooHeaders());

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode quotesArray = root.path("quotes");
                    if (quotesArray.isArray()) {
                        for (JsonNode q : quotesArray) {
                            String s = q.path("symbol").asText("");
                            String exch = q.path("exchange").asText(q.path("exchDisp").asText("")).toUpperCase();
                            String quoteType = q.path("quoteType").asText("");

                            // Strictly filter to Indian equities & ETFs on NSE or BSE
                            boolean isIndianExchange = INDIAN_EXCHANGES.contains(exch) || s.endsWith(".NS") || s.endsWith(".BO");
                            if (isIndianExchange && !s.isBlank() && (quoteType.isBlank() || "EQUITY".equalsIgnoreCase(quoteType) || "ETF".equalsIgnoreCase(quoteType))) {
                                String clean = s.toUpperCase().replace(".NS", "").replace(".BO", "");
                                candidateSymbols.add(clean);
                            }
                        }
                        if (!candidateSymbols.isEmpty()) break;
                    }
                }
            } catch (Exception e) {
                log.debug("Yahoo search endpoint error from host {}: {}", host, e.getMessage());
            }
        }

        if (candidateSymbols.isEmpty()) {
            return mockService.searchStocks(query);
        }

        // Fetch quotes in parallel for candidate symbols (limit to 10)
        List<String> limitedSymbols = candidateSymbols.stream().limit(10).toList();
        List<CompletableFuture<StockQuoteResponse>> futures = limitedSymbols.stream()
                .map(sym -> CompletableFuture.supplyAsync(() -> {
                    try {
                        return getQuote(sym);
                    } catch (Exception e) {
                        log.debug("Failed fetching quote for candidate {}: {}", sym, e.getMessage());
                        return null;
                    }
                }, executor))
                .toList();

        List<StockQuoteResponse> results = futures.stream()
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .filter(q -> q.getPrice() != null && q.getPrice().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        return results.isEmpty() ? mockService.searchStocks(query) : results;
    }
}
