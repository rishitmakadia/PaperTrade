package com.ppt.papertrade.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    private BigDecimal overallCapital;
    private BigDecimal overallCash;
    private BigDecimal overallInvestedValue;
    private BigDecimal overallHoldingsValue;
    private BigDecimal overallPortfolioValue;
    private BigDecimal overallRealizedPnl;
    private BigDecimal overallUnrealizedPnl;
    private BigDecimal overallTotalPnl;
    private BigDecimal overallReturnPercentage;
    private Integer totalPortfoliosCount;
    private Integer totalHoldingsCount;
    private Integer totalTradesCount;
    private List<PortfolioSummaryResponse> portfolioSummaries;
    private List<EquityPointResponse> aggregatedEquityCurve;
    private List<TradeResponse> recentTrades;
    private PortfolioSummaryResponse bestPerformingPortfolio;
    private PortfolioSummaryResponse worstPerformingPortfolio;
}
