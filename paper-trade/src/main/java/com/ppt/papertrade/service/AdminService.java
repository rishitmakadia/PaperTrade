package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.UpdateUserStatusRequest;
import com.ppt.papertrade.dto.response.AdminStatsResponse;
import com.ppt.papertrade.dto.response.AdminTradeResponse;
import com.ppt.papertrade.dto.response.UserResponse;

import java.util.List;

/**
 * Service interface for platform administration and analytics.
 */
public interface AdminService {

    AdminStatsResponse getPlatformStats();

    List<UserResponse> getAllUsers();

    UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request);

    List<AdminTradeResponse> getAllTrades();
}
