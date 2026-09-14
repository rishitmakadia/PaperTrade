package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.request.CreateAlertRequest;
import com.ppt.papertrade.dto.response.PriceAlertResponse;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.PriceAlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for creating, deleting, and resetting price alerts.
 */
@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final PriceAlertService priceAlertService;

    @GetMapping
    public ResponseEntity<List<PriceAlertResponse>> getAlerts(@AuthenticationPrincipal UserPrincipal principal) {
        List<PriceAlertResponse> alerts = priceAlertService.getUserAlerts(principal.getId());
        return ResponseEntity.ok(alerts);
    }

    @PostMapping
    public ResponseEntity<PriceAlertResponse> createAlert(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateAlertRequest request
    ) {
        PriceAlertResponse alert = priceAlertService.createAlert(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(alert);
    }

    @GetMapping("/portfolio/{portfolioId}")
    public ResponseEntity<List<PriceAlertResponse>> getPortfolioAlerts(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long portfolioId
    ) {
        List<PriceAlertResponse> alerts = priceAlertService.getPortfolioAlerts(principal.getId(), portfolioId);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/portfolio/{portfolioId}")
    public ResponseEntity<PriceAlertResponse> createPortfolioAlert(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long portfolioId,
            @Valid @RequestBody CreateAlertRequest request
    ) {
        PriceAlertResponse alert = priceAlertService.createPortfolioAlert(principal.getId(), portfolioId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(alert);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAlert(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        priceAlertService.deleteAlert(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PatchMapping("/{id}/reset")
    public ResponseEntity<PriceAlertResponse> resetAlert(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        PriceAlertResponse alert = priceAlertService.resetAlert(principal.getId(), id);
        return ResponseEntity.ok(alert);
    }
}
