package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.request.BacktestRequest;
import com.ppt.papertrade.dto.response.BacktestResultResponse;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.BacktestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for simulating trading strategies on historical market candles.
 */
@RestController
@RequestMapping("/api/backtest")
@RequiredArgsConstructor
public class BacktestController {

    private final BacktestService backtestService;

    @PostMapping
    public ResponseEntity<BacktestResultResponse> runBacktest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BacktestRequest request
    ) {
        Long userId = principal != null ? principal.getId() : null;
        BacktestResultResponse result = backtestService.runBacktest(userId, request);
        return ResponseEntity.ok(result);
    }
}
