package com.ppt.papertrade.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioResponse {

    private Long id;
    private Long userId;
    private String name;
    private String description;
    private BigDecimal initialCapital;
    private BigDecimal cashBalance;
    private BigDecimal investedValue;
    private BigDecimal currentHoldingsValue;
    private BigDecimal totalPortfolioValue;
    private BigDecimal realizedPnl;
    private BigDecimal unrealizedPnl;
    private BigDecimal totalPnl;
    private BigDecimal returnPercentage;
    private Integer tradeCount;
    private Integer holdingsCount;
    private String status;
    private Boolean isDefault;
    private Instant createdAt;
    private Instant updatedAt;
}
