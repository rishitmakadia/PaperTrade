package com.ppt.papertrade.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

/**
 * Price Alert creation payload with portfolio scope.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAlertRequest {

    private Long portfolioId;

    @NotBlank(message = "Stock symbol is required")
    private String symbol;

    private String name;

    @NotNull(message = "Target price is required")
    @Positive(message = "Target price must be positive")
    private BigDecimal targetPrice;

    @NotBlank(message = "Condition (above/below) is required")
    private String condition;
}
