package com.ppt.papertrade.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Safe user response DTO excluding password hash.
 * Provides both `id` and `_id` for backwards-compatibility with the React frontend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    @JsonProperty("_id")
    public String getUnderscoreId() {
        return id != null ? id.toString() : null;
    }

    private String name;
    private String email;
    private String role;
    private BigDecimal balance;
    private String status;
    private Integer trades;
    private BigDecimal pnl;
    private Integer portfoliosCount;
    private List<String> watchlist;
    private String avatarColor;
    private Instant createdAt;
    private Instant updatedAt;
}
