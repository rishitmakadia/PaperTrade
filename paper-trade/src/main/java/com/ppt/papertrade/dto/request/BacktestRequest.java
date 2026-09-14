package com.ppt.papertrade.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.math.BigDecimal;

/**
 * Strategy backtesting payload.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BacktestRequest {

    @NotBlank(message = "Stock symbol is required")
    private String symbol;

    @NotBlank(message = "Strategy is required (SMA, EMA, RSI, MACD, Bollinger, S&R)")
    private String strategy;

    private String startDate;

    private String endDate;

    @Builder.Default
    private BigDecimal capital = new BigDecimal("100000.0000");
}
