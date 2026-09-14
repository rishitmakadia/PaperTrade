package com.ppt.papertrade.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Holding (open position) response DTO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldingResponse {

    private Long id;

    @JsonProperty("_id")
    public String getUnderscoreId() {
        return id != null ? id.toString() : null;
    }

    private Long portfolioId;
    private String symbol;
    private String name;
    private Integer qty;
    private BigDecimal avgPrice;
    private String sector;
    private Instant updatedAt;
    private Instant createdAt;
}
