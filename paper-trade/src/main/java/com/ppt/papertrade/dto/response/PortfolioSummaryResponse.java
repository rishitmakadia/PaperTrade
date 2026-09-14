package com.ppt.papertrade.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioSummaryResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal initialCapital;
    private BigDecimal cashBalance;
    private BigDecimal currentPortfolioValue;
    private BigDecimal totalPnl;
    private BigDecimal returnPercentage;
    private Integer holdingsCount;
    private Integer tradeCount;
    private Boolean isDefault;
    private String status;
}
