package com.ppt.papertrade.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Trade record response DTO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeResponse {

    private Long id;

    @JsonProperty("_id")
    public String getUnderscoreId() {
        return id != null ? id.toString() : null;
    }

    private Long userId;
    private Long portfolioId;
    private String portfolioName;
    private String symbol;
    private String name;
    private String type;
    private Integer qty;
    private BigDecimal price;
    private BigDecimal total;
    private BigDecimal realizedPnl;
    private String status;
    private String orderType;
    private Instant executedAt;
    private Instant createdAt;
}
