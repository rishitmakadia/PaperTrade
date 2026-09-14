package com.ppt.papertrade.dto.response;

import lombok.*;

/**
 * Authentication response returning the JWT token and user info.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private UserResponse user;
}
