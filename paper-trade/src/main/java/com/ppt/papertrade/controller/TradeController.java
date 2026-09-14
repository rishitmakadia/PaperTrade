package com.ppt.papertrade.controller;

import com.ppt.papertrade.dto.request.ExecuteTradeRequest;
import com.ppt.papertrade.dto.response.ExecuteTradeResponse;
import com.ppt.papertrade.dto.response.TradeResponse;
import com.ppt.papertrade.security.UserPrincipal;
import com.ppt.papertrade.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for executing trades, viewing trade history, and exporting trades CSV.
 */
@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    @GetMapping
    public ResponseEntity<List<TradeResponse>> getUserTrades(@AuthenticationPrincipal UserPrincipal principal) {
        List<TradeResponse> trades = tradeService.getUserTrades(principal.getId());
        return ResponseEntity.ok(trades);
    }

    @PostMapping
    public ResponseEntity<ExecuteTradeResponse> executeTrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ExecuteTradeRequest request
    ) {
        ExecuteTradeResponse response = tradeService.executeTrade(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportTradesCsv(@AuthenticationPrincipal UserPrincipal principal) {
        String csvContent = tradeService.exportTradesCsv(principal.getId());
        byte[] csvBytes = csvContent.getBytes();

        String filename = "trades_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
