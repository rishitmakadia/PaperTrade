package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.response.DashboardResponse;

/**
 * Service for aggregating user-level multi-portfolio metrics and overall statistics.
 */
public interface DashboardService {

    DashboardResponse getOverallDashboard(Long userId);
}
