package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.CreatePortfolioRequest;
import com.ppt.papertrade.dto.request.ExecuteTradeRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.DashboardResponse;
import com.ppt.papertrade.dto.response.EquityPointResponse;
import com.ppt.papertrade.dto.response.HoldingResponse;
import com.ppt.papertrade.dto.response.PortfolioResponse;
import com.ppt.papertrade.dto.response.PortfolioStatsResponse;
import com.ppt.papertrade.dto.response.PortfolioSummaryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class PortfolioServiceTest {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private TradeService tradeService;

    @Autowired
    private AuthService authService;

    private Long testUserId;
    private Long defaultPortfolioId;

    @BeforeEach
    void setUp() {
        SignupRequest signup = SignupRequest.builder()
                .name("Portfolio User")
                .email("portfolio.test." + System.nanoTime() + "@example.com")
                .password("password123")
                .build();
        AuthResponse auth = authService.signup(signup);
        testUserId = auth.getUser().getId();
        
        List<PortfolioSummaryResponse> portfolios = portfolioService.getUserPortfolios(testUserId);
        assertFalse(portfolios.isEmpty());
        defaultPortfolioId = portfolios.get(0).getId();
    }

    @Test
    @DisplayName("Should return open positions for a specific portfolio")
    void testGetPositions() {
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("RELIANCE").name("Reliance Industries Ltd").type("BUY").qty(10).price(new BigDecimal("2900.00")).sector("Energy").build());

        List<HoldingResponse> positions = portfolioService.getPortfolioPositions(testUserId, defaultPortfolioId);
        assertEquals(1, positions.size());
        assertEquals("RELIANCE", positions.get(0).getSymbol());
        assertEquals(10, positions.get(0).getQty());
    }

    @Test
    @DisplayName("Should generate 30-day equity curve for a portfolio")
    void testGetEquityCurve() {
        List<EquityPointResponse> curve = portfolioService.getPortfolioEquityCurve(testUserId, defaultPortfolioId, 30);
        assertNotNull(curve);
        assertEquals(31, curve.size()); // 30 days + today
        assertTrue(curve.get(0).getValue().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Should compute portfolio stats with today's trade count and day P&L")
    void testGetPortfolioStats() {
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("TCS").name("TCS Ltd").type("BUY").qty(5).price(new BigDecimal("3500.00")).build());

        PortfolioStatsResponse stats = portfolioService.getPortfolioStats(testUserId, defaultPortfolioId);
        assertNotNull(stats);
        assertEquals(1, stats.getBuyCount());
        assertEquals(0, stats.getSellCount());
        assertEquals(1L, stats.getTotalTrades());
    }

    @Test
    @DisplayName("Should create multiple portfolios and isolate holdings, trades, and balances")
    void testMultiPortfolioIsolation() {
        // Create second portfolio
        PortfolioResponse port2 = portfolioService.createPortfolio(testUserId, CreatePortfolioRequest.builder()
                .name("Growth Strategy")
                .description("Long term tech bets")
                .initialCapital(new BigDecimal("500000.00"))
                .build());

        assertNotNull(port2);
        assertNotNull(port2.getId());

        // Trade in default portfolio: 10 RELIANCE @ 2000
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("RELIANCE")
                .name("Reliance Industries Ltd")
                .type("BUY")
                .qty(10)
                .price(new BigDecimal("2000.00"))
                .build());

        // Trade in portfolio 2: 5 RELIANCE @ 2500
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(port2.getId())
                .symbol("RELIANCE")
                .name("Reliance Industries Ltd")
                .type("BUY")
                .qty(5)
                .price(new BigDecimal("2500.00"))
                .build());

        // Check isolation
        List<HoldingResponse> port1Holdings = portfolioService.getPortfolioPositions(testUserId, defaultPortfolioId);
        List<HoldingResponse> port2Holdings = portfolioService.getPortfolioPositions(testUserId, port2.getId());

        assertEquals(1, port1Holdings.size());
        assertEquals(10, port1Holdings.get(0).getQty());
        assertEquals(new BigDecimal("2000.00"), port1Holdings.get(0).getAvgPrice());

        assertEquals(1, port2Holdings.size());
        assertEquals(5, port2Holdings.get(0).getQty());
        assertEquals(new BigDecimal("2500.00"), port2Holdings.get(0).getAvgPrice());

        // Check Dashboard aggregated view
        DashboardResponse dashboard = dashboardService.getOverallDashboard(testUserId);
        assertEquals(2, dashboard.getPortfolioSummaries().size());
        assertEquals(new BigDecimal("1500000.00"), dashboard.getOverallCapital());
    }
}
