package com.ppt.papertrade.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Admin request to update user active/inactive status.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserStatusRequest {

    @NotBlank(message = "Status (active/inactive) is required")
    private String status;
}
