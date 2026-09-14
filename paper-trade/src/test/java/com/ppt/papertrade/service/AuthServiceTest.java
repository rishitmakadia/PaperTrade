package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.LoginRequest;
import com.ppt.papertrade.dto.request.ResetPortfolioRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.request.UpdateProfileRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.UserResponse;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.UnauthorizedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Should successfully signup a new user and return token with initial balance")
    void testSignupSuccess() {
        SignupRequest request = SignupRequest.builder()
                .name("Rishit Makadia")
                .email("rishit.test@example.com")
                .password("securePassword123")
                .build();

        AuthResponse response = authService.signup(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertNotNull(response.getUser());
        assertEquals("Rishit Makadia", response.getUser().getName());
        assertEquals("rishit.test@example.com", response.getUser().getEmail());
        assertEquals("user", response.getUser().getRole());
        assertEquals(new BigDecimal("1000000.0000"), response.getUser().getBalance());
        assertEquals("active", response.getUser().getStatus());
    }

    @Test
    @DisplayName("Should reject signup with duplicate email")
    void testSignupDuplicateEmail() {
        SignupRequest request1 = SignupRequest.builder()
                .name("User One")
                .email("duplicate@example.com")
                .password("pass1234")
                .build();
        authService.signup(request1);

        SignupRequest request2 = SignupRequest.builder()
                .name("User Two")
                .email("duplicate@example.com")
                .password("pass5678")
                .build();

        assertThrows(BadRequestException.class, () -> authService.signup(request2));
    }

    @Test
    @DisplayName("Should authenticate seeded demo user with valid password")
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("krunal@example.com")
                .password("password123")
                .build();

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("krunal@example.com", response.getUser().getEmail());
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void testLoginInvalidPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("krunal@example.com")
                .password("wrongpassword")
                .build();

        assertThrows(Exception.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should reject login for deactivated user")
    void testLoginInactiveUser() {
        LoginRequest request = LoginRequest.builder()
                .email("Mayur@example.com")
                .password("password123")
                .build();

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should update user profile and balance correctly")
    void testUpdateProfile() {
        SignupRequest signup = SignupRequest.builder()
                .name("Original Name")
                .email("update.test@example.com")
                .password("oldPassword123")
                .build();
        AuthResponse registered = authService.signup(signup);
        Long userId = registered.getUser().getId();

        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .name("Updated Name")
                .currentPassword("oldPassword123")
                .newPassword("newPassword123")
                .balance(new BigDecimal("1500000.00"))
                .avatarColor("#00ff88")
                .build();

        UserResponse updated = authService.updateProfile(userId, updateRequest);

        assertEquals("Updated Name", updated.getName());
        assertEquals(new BigDecimal("1500000.00"), updated.getBalance());
        assertEquals("#00ff88", updated.getAvatarColor());
    }

    @Test
    @DisplayName("Should reset user portfolio to specified balance and wipe state")
    void testResetPortfolio() {
        SignupRequest signup = SignupRequest.builder()
                .name("Reset Target")
                .email("reset.target@example.com")
                .password("pass123")
                .build();
        AuthResponse registered = authService.signup(signup);
        Long userId = registered.getUser().getId();

        ResetPortfolioRequest resetReq = ResetPortfolioRequest.builder()
                .balance(new BigDecimal("2000000.0000"))
                .build();

        Map<String, Object> res = authService.resetPortfolio(userId, resetReq);

        assertEquals("Default portfolio reset successfully", res.get("message"));
        assertEquals(new BigDecimal("2000000.0000"), res.get("balance"));

        UserResponse freshUser = authService.getCurrentUser(userId);
        assertEquals(new BigDecimal("2000000.0000"), freshUser.getBalance());
        assertEquals(0, freshUser.getTrades());
        assertEquals(BigDecimal.ZERO, freshUser.getPnl());
    }
}
