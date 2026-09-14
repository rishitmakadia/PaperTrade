package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.response.EquityPointResponse;
import com.ppt.papertrade.dto.response.HoldingResponse;
import com.ppt.papertrade.dto.response.PortfolioStatsResponse;
import com.ppt.papertrade.entity.Portfolio;
import com.ppt.papertrade.entity.PortfolioStatus;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.repository.PortfolioRepository;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Backward-compatibility controller for legacy `/api/portfolio` endpoints,
 * automatically resolving the user's default active portfolio.
 */
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class LegacyPortfolioController {

    private final PortfolioService portfolioService;
    private final PortfolioRepository portfolioRepository;

    @GetMapping
    public ResponseEntity<List<HoldingResponse>> getPositions(@AuthenticationPrincipal UserPrincipal principal) {
        Long portId = getDefaultPortfolioId(principal.getId());
        return ResponseEntity.ok(portfolioService.getPortfolioPositions(principal.getId(), portId));
    }

    @GetMapping("/equity")
    public ResponseEntity<List<EquityPointResponse>> getEquityCurve(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "30") int days
    ) {
        Long portId = getDefaultPortfolioId(principal.getId());
        return ResponseEntity.ok(portfolioService.getPortfolioEquityCurve(principal.getId(), portId, days));
    }

    @GetMapping("/stats")
    public ResponseEntity<PortfolioStatsResponse> getPortfolioStats(@AuthenticationPrincipal UserPrincipal principal) {
        Long portId = getDefaultPortfolioId(principal.getId());
        return ResponseEntity.ok(portfolioService.getPortfolioStats(principal.getId(), portId));
    }

    private Long getDefaultPortfolioId(Long userId) {
        return portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(Portfolio::getId)
                .orElseGet(() -> {
                    List<Portfolio> list = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
                    if (list.isEmpty()) throw new BadRequestException("No active portfolio found");
                    return list.get(0).getId();
                });
    }
}
