package com.ppt.papertrade.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePortfolioRequest {

    @NotBlank(message = "Portfolio name is required")
    @Size(min = 1, max = 100, message = "Portfolio name must be between 1 and 100 characters")
    private String name;

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;

    @DecimalMin(value = "1000.00", message = "Initial capital must be at least ₹1,000")
    private BigDecimal initialCapital;
}
