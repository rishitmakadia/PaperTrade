package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Admin platform statistics overview DTO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {

    private Long totalUsers;
    private Long activeUsers;
    private Long totalPortfolios;
    private Long totalTrades;
    private BigDecimal totalVolume;
    private BigDecimal totalPlatformCapital;
    private Long newUsersThisMonth;
}
