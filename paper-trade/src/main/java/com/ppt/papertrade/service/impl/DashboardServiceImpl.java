package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.response.*;
import com.ppt.papertrade.entity.*;
import com.ppt.papertrade.marketdata.MarketDataService;
import com.ppt.papertrade.repository.*;
import com.ppt.papertrade.service.DashboardService;
import com.ppt.papertrade.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PortfolioRepository portfolioRepository;
    private final AccountRepository accountRepository;
    private final HoldingRepository holdingRepository;
    private final TradeRepository tradeRepository;
    private final PortfolioService portfolioService;
    private final MarketDataService marketDataService;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getOverallDashboard(Long userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
        if (portfolios.isEmpty()) {
            return DashboardResponse.builder()
                    .overallCapital(BigDecimal.ZERO)
                    .overallCash(BigDecimal.ZERO)
                    .overallInvestedValue(BigDecimal.ZERO)
                    .overallHoldingsValue(BigDecimal.ZERO)
                    .overallPortfolioValue(BigDecimal.ZERO)
                    .overallRealizedPnl(BigDecimal.ZERO)
                    .overallUnrealizedPnl(BigDecimal.ZERO)
                    .overallTotalPnl(BigDecimal.ZERO)
                    .overallReturnPercentage(BigDecimal.ZERO)
                    .totalPortfoliosCount(0)
                    .totalHoldingsCount(0)
                    .totalTradesCount(0)
                    .portfolioSummaries(Collections.emptyList())
                    .aggregatedEquityCurve(Collections.emptyList())
                    .recentTrades(Collections.emptyList())
                    .build();
        }

        List<PortfolioSummaryResponse> summaries = portfolioService.getUserPortfolios(userId);

        BigDecimal overallCapital = BigDecimal.ZERO;
        BigDecimal overallCash = BigDecimal.ZERO;
        BigDecimal overallHoldingsValue = BigDecimal.ZERO;
        BigDecimal overallInvestedValue = BigDecimal.ZERO;
        BigDecimal overallRealizedPnl = BigDecimal.ZERO;
        int totalHoldingsCount = 0;
        int totalTradesCount = 0;

        List<Holding> allHoldings = holdingRepository.findByPortfolioUserId(userId);
        List<String> distinctSymbols = allHoldings.stream().map(Holding::getSymbol).distinct().toList();
        Map<String, BigDecimal> priceMap = getLivePriceMap(distinctSymbols);

        for (Holding h : allHoldings) {
            BigDecimal livePrice = priceMap.getOrDefault(h.getSymbol().toUpperCase(), h.getAverageBuyPrice());
            BigDecimal hVal = livePrice.multiply(BigDecimal.valueOf(h.getQuantity()));
            BigDecimal hCost = h.getAverageBuyPrice().multiply(BigDecimal.valueOf(h.getQuantity()));
            overallHoldingsValue = overallHoldingsValue.add(hVal);
            overallInvestedValue = overallInvestedValue.add(hCost);
            totalHoldingsCount++;
        }

        for (Portfolio p : portfolios) {
            overallCapital = overallCapital.add(p.getInitialCapital());
            Account acc = p.getAccount() != null ? p.getAccount() : accountRepository.findByPortfolioId(p.getId()).orElse(null);
            if (acc != null) {
                overallCash = overallCash.add(acc.getCashBalance());
                overallRealizedPnl = overallRealizedPnl.add(acc.getTotalPnl());
                totalTradesCount += acc.getTradeCount();
            } else {
                overallCash = overallCash.add(p.getInitialCapital());
            }
        }

        BigDecimal overallPortfolioValue = overallCash.add(overallHoldingsValue);
        BigDecimal overallUnrealizedPnl = overallHoldingsValue.subtract(overallInvestedValue);
        BigDecimal overallTotalPnl = overallRealizedPnl.add(overallUnrealizedPnl);

        BigDecimal overallReturnPercentage = overallCapital.compareTo(BigDecimal.ZERO) > 0
                ? overallTotalPnl.multiply(BigDecimal.valueOf(100)).divide(overallCapital, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        PortfolioSummaryResponse best = summaries.stream()
                .max(Comparator.comparing(PortfolioSummaryResponse::getTotalPnl))
                .orElse(null);

        PortfolioSummaryResponse worst = summaries.stream()
                .min(Comparator.comparing(PortfolioSummaryResponse::getTotalPnl))
                .orElse(null);

        List<Trade> recentTradesList = tradeRepository.findByPortfolioUserIdOrderByCreatedAtDesc(userId)
                .stream().limit(10).toList();
        List<TradeResponse> recentTrades = recentTradesList.stream().map(this::mapToTradeResponse).toList();

        List<EquityPointResponse> aggregatedEquityCurve = buildAggregatedEquityCurve(userId, portfolios, 30);

        return DashboardResponse.builder()
                .overallCapital(overallCapital.setScale(2, RoundingMode.HALF_UP))
                .overallCash(overallCash.setScale(2, RoundingMode.HALF_UP))
                .overallInvestedValue(overallInvestedValue.setScale(2, RoundingMode.HALF_UP))
                .overallHoldingsValue(overallHoldingsValue.setScale(2, RoundingMode.HALF_UP))
                .overallPortfolioValue(overallPortfolioValue.setScale(2, RoundingMode.HALF_UP))
                .overallRealizedPnl(overallRealizedPnl.setScale(2, RoundingMode.HALF_UP))
                .overallUnrealizedPnl(overallUnrealizedPnl.setScale(2, RoundingMode.HALF_UP))
                .overallTotalPnl(overallTotalPnl.setScale(2, RoundingMode.HALF_UP))
                .overallReturnPercentage(overallReturnPercentage)
                .totalPortfoliosCount(portfolios.size())
                .totalHoldingsCount(totalHoldingsCount)
                .totalTradesCount(totalTradesCount)
                .portfolioSummaries(summaries)
                .aggregatedEquityCurve(aggregatedEquityCurve)
                .recentTrades(recentTrades)
                .bestPerformingPortfolio(best)
                .worstPerformingPortfolio(worst)
                .build();
    }

    private List<EquityPointResponse> buildAggregatedEquityCurve(Long userId, List<Portfolio> portfolios, int days) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE;

        Map<String, BigDecimal> dailyTotals = new LinkedHashMap<>();
        for (int i = days; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            dailyTotals.put(d.format(dtf), BigDecimal.ZERO);
        }

        for (Portfolio p : portfolios) {
            List<EquityPointResponse> pCurve = portfolioService.getPortfolioEquityCurve(userId, p.getId(), days);
            for (EquityPointResponse pt : pCurve) {
                if (dailyTotals.containsKey(pt.getDate())) {
                    dailyTotals.put(pt.getDate(), dailyTotals.get(pt.getDate()).add(pt.getValue()));
                }
            }
        }

        return dailyTotals.entrySet().stream().map(e -> EquityPointResponse.builder()
                .date(e.getKey())
                .value(e.getValue().setScale(2, RoundingMode.HALF_UP))
                .build()).toList();
    }

    private TradeResponse mapToTradeResponse(Trade t) {
        return TradeResponse.builder()
                .id(t.getId())
                .userId(t.getPortfolio().getUser().getId())
                .portfolioId(t.getPortfolio().getId())
                .portfolioName(t.getPortfolio().getName())
                .symbol(t.getSymbol())
                .name(t.getCompanyName())
                .type(t.getTradeType().name())
                .qty(t.getQuantity())
                .price(t.getExecutionPrice())
                .total(t.getTotalValue())
                .realizedPnl(t.getRealizedPnl())
                .status(t.getStatus().name())
                .orderType(t.getOrderType().name())
                .executedAt(t.getExecutedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private Map<String, BigDecimal> getLivePriceMap(List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) return Collections.emptyMap();
        try {
            List<StockQuoteResponse> quotes = marketDataService.getAllQuotes(symbols);
            return quotes.stream().collect(Collectors.toMap(
                    q -> q.getSymbol().toUpperCase(),
                    StockQuoteResponse::getPrice,
                    (p1, p2) -> p1
            ));
        } catch (Exception e) {
            log.warn("Failed to fetch live quotes for dashboard price map: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
