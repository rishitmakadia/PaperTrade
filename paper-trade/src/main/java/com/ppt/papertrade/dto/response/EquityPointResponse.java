package com.ppt.papertrade.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Data point in the equity curve.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquityPointResponse {

    private String date;
    private BigDecimal value;
}
