package com.ppt.papertrade.dto.request;

import lombok.*;
import java.math.BigDecimal;

/**
 * Portfolio reset request payload.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPortfolioRequest {

    @Builder.Default
    private BigDecimal balance = new BigDecimal("1000000.0000");
}
