package com.ppt.papertrade.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioPerformanceResponse {

    private Long portfolioId;
    private String portfolioName;
    private BigDecimal initialCapital;
    private BigDecimal cashBalance;
    private BigDecimal totalPortfolioValue;
    private BigDecimal totalPnl;
    private BigDecimal returnPercentage;
    private Integer totalTrades;
    private Integer buyCount;
    private Integer sellCount;
    private Integer winningTrades;
    private Integer losingTrades;
    private BigDecimal winRate;
    private List<EquityPointResponse> equityCurve;
}
