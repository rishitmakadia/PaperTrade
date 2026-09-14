package com.ppt.papertrade.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Price alert response DTO with portfolio scope.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlertResponse {

    private Long id;

    @JsonProperty("_id")
    public String getUnderscoreId() {
        return id != null ? id.toString() : null;
    }

    private Long portfolioId;
    private String portfolioName;
    private String symbol;
    private String name;
    private BigDecimal targetPrice;
    private String condition;
    private Boolean active;
    private Boolean triggered;
    private Instant triggeredAt;
    private BigDecimal triggeredPrice;
    private Instant createdAt;
    private Instant updatedAt;
}
