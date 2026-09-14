package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Individual trade simulated during a backtest.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BacktestTradeResponse {

    private BigDecimal entryPrice;
    private Integer entryIndex;
    private BigDecimal exitPrice;
    private Integer exitIndex;
    private Integer quantity;
    private BigDecimal pnl;
    private BigDecimal pnlPercent;
}
