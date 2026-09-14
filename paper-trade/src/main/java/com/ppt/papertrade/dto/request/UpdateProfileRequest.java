package com.ppt.papertrade.dto.request;

import jakarta.validation.constraints.Email;
import lombok.*;
import java.math.BigDecimal;

/**
 * Profile update request payload.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    private String name;

    @Email(message = "Please provide a valid email address")
    private String email;

    private String currentPassword;

    private String newPassword;

    private BigDecimal balance;

    private String avatarColor;
}
