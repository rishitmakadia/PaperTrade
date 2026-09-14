package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.request.UpdateUserStatusRequest;
import com.ppt.papertrade.dto.response.AdminStatsResponse;
import com.ppt.papertrade.dto.response.AdminTradeResponse;
import com.ppt.papertrade.dto.response.UserResponse;
import com.ppt.papertrade.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for administrator operations (stats, user management, trade supervision).
 * All endpoints require ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        AdminStatsResponse stats = adminService.getPlatformStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        List<UserResponse> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        UserResponse user = adminService.updateUserStatus(id, request);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/trades")
    public ResponseEntity<List<AdminTradeResponse>> getTrades() {
        List<AdminTradeResponse> trades = adminService.getAllTrades();
        return ResponseEntity.ok(trades);
    }
}
