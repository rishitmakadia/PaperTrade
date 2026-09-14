package com.ppt.papertrade.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Admin view of trade record with nested user and portfolio summary.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTradeResponse {

    private Long id;

    @JsonProperty("_id")
    public String getUnderscoreId() {
        return id != null ? id.toString() : null;
    }

    private UserSummary userId;
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
    private Instant createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;

        @JsonProperty("_id")
        public String getUnderscoreId() {
            return id != null ? id.toString() : null;
        }

        private String name;
        private String email;
    }
}
