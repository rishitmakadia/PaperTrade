package com.ppt.papertrade.dto.response;

import lombok.*;

/**
 * Generic API response wrapper for simple messages or payloads.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse {

    private String message;
    private Boolean success;

    public static ApiResponse of(String message) {
        return ApiResponse.builder().message(message).success(true).build();
    }

    public static ApiResponse ok(String message) {
        return ApiResponse.builder().message(message).success(true).build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder().message(message).success(false).build();
    }
}
