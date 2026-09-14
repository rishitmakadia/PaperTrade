package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.request.CreatePortfolioRequest;
import com.ppt.papertrade.dto.request.ExecuteTradeRequest;
import com.ppt.papertrade.dto.request.UpdatePortfolioRequest;
import com.ppt.papertrade.dto.response.*;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.PortfolioService;
import com.ppt.papertrade.service.TradeService;
import com.ppt.papertrade.service.WatchlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST controller for multi-portfolio management, scoped trades, holdings, and equity curves.
 */
@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final TradeService tradeService;
    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<List<PortfolioSummaryResponse>> getPortfolios(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(portfolioService.getUserPortfolios(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<PortfolioResponse> createPortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePortfolioRequest request
    ) {
        return ResponseEntity.ok(portfolioService.createPortfolio(principal.getId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PortfolioResponse> getPortfolioDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(portfolioService.getPortfolioDetail(principal.getId(), id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PortfolioResponse> updatePortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePortfolioRequest request
    ) {
        return ResponseEntity.ok(portfolioService.updatePortfolio(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deletePortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        portfolioService.deletePortfolio(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Portfolio archived successfully"));
    }

    @GetMapping("/{id}/holdings")
    public ResponseEntity<List<HoldingResponse>> getHoldings(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(portfolioService.getPortfolioPositions(principal.getId(), id));
    }

    @GetMapping("/{id}/trades")
    public ResponseEntity<List<TradeResponse>> getTrades(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String symbol
    ) {
        if (symbol != null && !symbol.isBlank()) {
            return ResponseEntity.ok(tradeService.getPortfolioStockTrades(principal.getId(), id, symbol.trim()));
        }
        return ResponseEntity.ok(tradeService.getPortfolioTrades(principal.getId(), id));
    }

    @GetMapping("/{id}/stocks/{symbol}/trades")
    public ResponseEntity<List<TradeResponse>> getStockTrades(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable String symbol
    ) {
        return ResponseEntity.ok(tradeService.getPortfolioStockTrades(principal.getId(), id, symbol.trim()));
    }

    @PostMapping("/{id}/trades")
    public ResponseEntity<ExecuteTradeResponse> executeTrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ExecuteTradeRequest request
    ) {
        return ResponseEntity.ok(tradeService.executePortfolioTrade(principal.getId(), id, request));
    }

    @GetMapping("/{id}/equity")
    public ResponseEntity<List<EquityPointResponse>> getEquityCurve(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(portfolioService.getPortfolioEquityCurve(principal.getId(), id, days));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<PortfolioStatsResponse> getStats(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(portfolioService.getPortfolioStats(principal.getId(), id));
    }

    @GetMapping("/{id}/performance")
    public ResponseEntity<PortfolioPerformanceResponse> getPerformance(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(portfolioService.getPortfolioPerformance(principal.getId(), id, days));
    }

    @PostMapping("/{id}/reset")
    public ResponseEntity<Map<String, Object>> resetPortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        BigDecimal customBalance = null;
        if (payload != null && payload.containsKey("balance") && payload.get("balance") != null) {
            customBalance = new BigDecimal(payload.get("balance").toString());
        }
        return ResponseEntity.ok(portfolioService.resetPortfolio(principal.getId(), id, customBalance));
    }

    @GetMapping("/{id}/trades/export")
    public ResponseEntity<byte[]> exportTradesCsv(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        String csv = tradeService.exportPortfolioTradesCsv(principal.getId(), id);
        byte[] bytes = csv.getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"trades_portfolio_" + id + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
