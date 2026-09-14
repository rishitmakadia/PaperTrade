package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.BacktestRequest;
import com.ppt.papertrade.dto.response.BacktestResultResponse;
import com.ppt.papertrade.exception.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class BacktestServiceTest {

    @Autowired
    private BacktestService backtestService;

    @Test
    @DisplayName("Should run SMA crossover backtest and return valid metrics")
    void testSmaBacktest() {
        BacktestRequest request = BacktestRequest.builder()
                .symbol("RELIANCE")
                .strategy("SMA")
                .startDate("2023-01-01")
                .endDate("2023-12-31")
                .capital(new BigDecimal("100000.00"))
                .build();

        BacktestResultResponse result = backtestService.runBacktest(null, request);

        assertNotNull(result);
        assertEquals("RELIANCE", result.getSymbol());
        assertEquals("SMA", result.getStrategy());
        assertTrue(result.getCandles() > 0);
        assertNotNull(result.getTotalReturn());
        assertNotNull(result.getWinRate());
        assertNotNull(result.getMaxDrawdown());
        assertNotNull(result.getSharpeRatio());
        assertNotNull(result.getFinalCapital());
    }

    @Test
    @DisplayName("Should run RSI mean-reversion backtest")
    void testRsiBacktest() {
        BacktestRequest request = BacktestRequest.builder()
                .symbol("TCS")
                .strategy("RSI")
                .startDate("2023-01-01")
                .endDate("2023-12-31")
                .capital(new BigDecimal("200000.00"))
                .build();

        BacktestResultResponse result = backtestService.runBacktest(null, request);

        assertNotNull(result);
        assertEquals("TCS", result.getSymbol());
        assertEquals("RSI", result.getStrategy());
    }

    @Test
    @DisplayName("Should run MACD, Bollinger, and EMA strategies without errors")
    void testOtherStrategies() {
        for (String strat : new String[]{"EMA", "MACD", "BOLLINGER", "S&R"}) {
            BacktestRequest request = BacktestRequest.builder()
                    .symbol("INFY")
                    .strategy(strat)
                    .startDate("2023-01-01")
                    .endDate("2023-12-31")
                    .capital(new BigDecimal("100000.00"))
                    .build();

            BacktestResultResponse result = backtestService.runBacktest(null, request);
            assertNotNull(result);
            assertEquals(strat, result.getStrategy());
        }
    }

    @Test
    @DisplayName("Should reject backtest with invalid strategy name")
    void testInvalidStrategy() {
        BacktestRequest request = BacktestRequest.builder()
                .symbol("INFY")
                .strategy("UNKNOWN_STRATEGY")
                .build();

        assertThrows(BadRequestException.class, () -> backtestService.runBacktest(null, request));
    }
}
