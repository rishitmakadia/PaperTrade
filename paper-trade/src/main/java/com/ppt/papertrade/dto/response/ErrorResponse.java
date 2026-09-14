package com.ppt.papertrade.dto.response;

import lombok.*;
import java.time.Instant;
import java.util.Map;

/**
 * Standard error response structure for client and validation errors.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    private int status;
    private String message;
    private Instant timestamp;
    private Map<String, String> errors;
}
