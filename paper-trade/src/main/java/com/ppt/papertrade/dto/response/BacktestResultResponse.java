package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * Strategy backtesting simulation results including Sharpe ratio, Win Rate, and Drawdown.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BacktestResultResponse {

    private String symbol;
    private String strategy;
    private String period;
    private Integer candles;
    private Integer signals;
    private BigDecimal capital;
    private BigDecimal totalReturn;
    private BigDecimal winRate;
    private BigDecimal maxDrawdown;
    private BigDecimal sharpeRatio;
    private BigDecimal finalCapital;
    private List<BacktestTradeResponse> trades;
}
