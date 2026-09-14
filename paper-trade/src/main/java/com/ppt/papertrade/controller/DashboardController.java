package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.response.DashboardResponse;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for overall aggregated multi-portfolio dashboard data.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getOverallDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getOverallDashboard(principal.getId()));
    }
}
