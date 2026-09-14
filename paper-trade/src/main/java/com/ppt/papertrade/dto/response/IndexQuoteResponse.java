package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Market index quote (e.g. NIFTY 50, SENSEX, BANK NIFTY).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndexQuoteResponse {

    private String symbol;
    private String name;
    private BigDecimal value;
    private BigDecimal change;
    private BigDecimal changePercent;
}
