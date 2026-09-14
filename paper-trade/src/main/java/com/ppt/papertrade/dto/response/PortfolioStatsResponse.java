package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Portfolio summary stats: day P&L, buy/sell trade counts, balance, and total realized P&L.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioStatsResponse {

    private BigDecimal dayPnl;
    private Integer buyCount;
    private Integer sellCount;
    private Long totalTrades;
    private BigDecimal balance;
    private BigDecimal pnl;
}
