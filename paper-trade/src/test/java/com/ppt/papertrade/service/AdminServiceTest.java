package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.UpdateUserStatusRequest;
import com.ppt.papertrade.dto.response.AdminStatsResponse;
import com.ppt.papertrade.dto.response.AdminTradeResponse;
import com.ppt.papertrade.dto.response.UserResponse;
import com.ppt.papertrade.entity.User;
import com.ppt.papertrade.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class AdminServiceTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should retrieve platform overview statistics")
    void testGetStats() {
        AdminStatsResponse stats = adminService.getPlatformStats();
        assertNotNull(stats);
        assertTrue(stats.getTotalUsers() >= 0);
        assertNotNull(stats.getTotalVolume());
    }

    @Test
    @DisplayName("Should list all users and toggle user status between active and inactive")
    void testUserStatusToggle() {
        List<UserResponse> users = adminService.getAllUsers();
        assertFalse(users.isEmpty());

        User user = userRepository.findByEmailIgnoreCase("krunal@example.com").orElseThrow();

        // Deactivate
        UserResponse updated = adminService.updateUserStatus(user.getId(), UpdateUserStatusRequest.builder().status("inactive").build());
        assertEquals("inactive", updated.getStatus());

        // Reactivate
        UserResponse reactivated = adminService.updateUserStatus(user.getId(), UpdateUserStatusRequest.builder().status("active").build());
        assertEquals("active", reactivated.getStatus());
    }

    @Test
    @DisplayName("Should list all trades with user information")
    void testGetAllTrades() {
        List<AdminTradeResponse> trades = adminService.getAllTrades();
        assertNotNull(trades);
    }
}
