package com.ppt.papertrade.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

/**
 * Trade execution payload for BUY or SELL orders.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecuteTradeRequest {

    private Long portfolioId;

    @NotBlank(message = "Stock symbol is required")
    private String symbol;

    private String name;

    @NotBlank(message = "Trade type (BUY/SELL) is required")
    private String type;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    private Integer qty;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than zero")
    private BigDecimal price;

    @Builder.Default
    private String orderType = "MARKET";

    private String sector;
}
