package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Detailed real-time quote for a single stock.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockQuoteResponse {

    private String symbol;
    private String name;
    private BigDecimal price;
    private BigDecimal change;
    private BigDecimal changePercent;
    private String volume;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal open;
    private BigDecimal prevClose;
    private BigDecimal week52High;
    private BigDecimal week52Low;
    private BigDecimal pe;
    private BigDecimal eps;
    private String sector;
    private String marketCap;
    private String avgVolume;
    private String currency;
    private String exchange;
}
