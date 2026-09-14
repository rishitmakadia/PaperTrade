package com.ppt.papertrade.controller;

import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for user and portfolio-scoped watchlist actions.
 */
@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<List<String>> getWatchlist(@AuthenticationPrincipal UserPrincipal principal) {
        List<String> watchlist = watchlistService.getWatchlist(principal.getId());
        return ResponseEntity.ok(watchlist);
    }

    @PostMapping("/{symbol}")
    public ResponseEntity<Map<String, List<String>>> addToWatchlist(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String symbol
    ) {
        List<String> watchlist = watchlistService.addToWatchlist(principal.getId(), symbol);
        return ResponseEntity.ok(Map.of("watchlist", watchlist));
    }

    @DeleteMapping("/{symbol}")
    public ResponseEntity<Map<String, List<String>>> removeFromWatchlist(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String symbol
    ) {
        List<String> watchlist = watchlistService.removeFromWatchlist(principal.getId(), symbol);
        return ResponseEntity.ok(Map.of("watchlist", watchlist));
    }

    @GetMapping("/portfolio/{portfolioId}")
    public ResponseEntity<List<String>> getPortfolioWatchlist(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long portfolioId
    ) {
        List<String> watchlist = watchlistService.getPortfolioWatchlist(principal.getId(), portfolioId);
        return ResponseEntity.ok(watchlist);
    }

    @PostMapping("/portfolio/{portfolioId}/{symbol}")
    public ResponseEntity<Map<String, List<String>>> addToPortfolioWatchlist(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long portfolioId,
            @PathVariable String symbol
    ) {
        List<String> watchlist = watchlistService.addToPortfolioWatchlist(principal.getId(), portfolioId, symbol);
        return ResponseEntity.ok(Map.of("watchlist", watchlist));
    }

    @DeleteMapping("/portfolio/{portfolioId}/{symbol}")
    public ResponseEntity<Map<String, List<String>>> removeFromPortfolioWatchlist(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long portfolioId,
            @PathVariable String symbol
    ) {
        List<String> watchlist = watchlistService.removeFromPortfolioWatchlist(principal.getId(), portfolioId, symbol);
        return ResponseEntity.ok(Map.of("watchlist", watchlist));
    }
}
