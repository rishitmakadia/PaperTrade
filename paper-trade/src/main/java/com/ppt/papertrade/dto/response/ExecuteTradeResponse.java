package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Result of trade execution containing the created Trade and the user's updated cash balance.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecuteTradeResponse {

    private TradeResponse trade;
    private BigDecimal balance;
}
