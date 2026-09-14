package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.request.LoginRequest;
import com.ppt.papertrade.dto.request.ResetPortfolioRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.request.UpdateProfileRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.UserResponse;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for authentication and user profile endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, UserResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserResponse user = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(Map.of("user", user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<Map<String, UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileRequest request
    ) {
        UserResponse user = authService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(Map.of("user", user));
    }

    @PostMapping("/reset-portfolio")
    public ResponseEntity<Map<String, Object>> resetPortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) ResetPortfolioRequest request
    ) {
        Map<String, Object> response = authService.resetPortfolio(principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}
