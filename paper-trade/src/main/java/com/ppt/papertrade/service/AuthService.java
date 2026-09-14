package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.LoginRequest;
import com.ppt.papertrade.dto.request.ResetPortfolioRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.request.UpdateProfileRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.UserResponse;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Service interface for authentication and user profile management.
 */
public interface AuthService {

    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(Long userId);

    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    Map<String, Object> resetPortfolio(Long userId, ResetPortfolioRequest request);
}
