package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.CreateAlertRequest;
import com.ppt.papertrade.dto.request.ExecuteTradeRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.ExecuteTradeResponse;
import com.ppt.papertrade.dto.response.HoldingResponse;
import com.ppt.papertrade.dto.response.PortfolioResponse;
import com.ppt.papertrade.dto.response.PortfolioSummaryResponse;
import com.ppt.papertrade.dto.response.PriceAlertResponse;
import com.ppt.papertrade.dto.response.TradeResponse;
import com.ppt.papertrade.exception.InsufficientBalanceException;
import com.ppt.papertrade.exception.InsufficientHoldingsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
class TradeServiceTest {

    @Autowired
    private TradeService tradeService;

    @Autowired
    private AuthService authService;

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private PriceAlertService priceAlertService;

    private Long testUserId;
    private Long defaultPortfolioId;

    @BeforeEach
    void setUp() {
        SignupRequest signup = SignupRequest.builder()
                .name("Trader Bob")
                .email("trader.bob." + System.nanoTime() + "@example.com")
                .password("password123")
                .build();
        AuthResponse auth = authService.signup(signup);
        testUserId = auth.getUser().getId();
        
        List<PortfolioSummaryResponse> portfolios = portfolioService.getUserPortfolios(testUserId);
        assertFalse(portfolios.isEmpty());
        defaultPortfolioId = portfolios.get(0).getId();
    }

    @Test
    @DisplayName("Should execute BUY order, deduct balance, and create holding")
    void testBuyOrder() {
        ExecuteTradeRequest request = ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("RELIANCE")
                .name("Reliance Industries Ltd")
                .type("BUY")
                .qty(10)
                .price(new BigDecimal("2500.00"))
                .orderType("MARKET")
                .sector("Energy")
                .build();

        ExecuteTradeResponse response = tradeService.executeTrade(testUserId, request);

        assertNotNull(response);
        assertNotNull(response.getTrade());
        assertEquals("RELIANCE", response.getTrade().getSymbol());
        assertEquals("BUY", response.getTrade().getType());
        assertEquals(10, response.getTrade().getQty());
        assertEquals(new BigDecimal("25000.00"), response.getTrade().getTotal());

        // Balance was 1,000,000 - 25,000 = 975,000
        assertEquals(new BigDecimal("975000.00"), response.getBalance().setScale(2, RoundingMode.HALF_UP));

        List<HoldingResponse> positions = portfolioService.getPortfolioPositions(testUserId, defaultPortfolioId);
        assertEquals(1, positions.size());
        assertEquals("RELIANCE", positions.get(0).getSymbol());
        assertEquals(10, positions.get(0).getQty());
        assertEquals(new BigDecimal("2500.00"), positions.get(0).getAvgPrice());
    }

    @Test
    @DisplayName("Should calculate correct weighted average buy price across multiple BUY orders")
    void testWeightedAverageBuyPrice() {
        // First BUY: 10 shares @ ₹1000 = ₹10,000
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("TCS").name("TCS Ltd").type("BUY").qty(10).price(new BigDecimal("1000.00")).build());

        // Second BUY: 10 shares @ ₹2000 = ₹20,000
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("TCS").name("TCS Ltd").type("BUY").qty(10).price(new BigDecimal("2000.00")).build());

        List<HoldingResponse> positions = portfolioService.getPortfolioPositions(testUserId, defaultPortfolioId);
        assertEquals(1, positions.size());
        assertEquals(20, positions.get(0).getQty());
        // Weighted Average = (10,000 + 20,000) / 20 = ₹1500.00
        assertEquals(new BigDecimal("1500.00"), positions.get(0).getAvgPrice().setScale(2, RoundingMode.HALF_UP));
    }

    @Test
    @DisplayName("Should reject BUY order when funds are insufficient")
    void testInsufficientFunds() {
        ExecuteTradeRequest request = ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("MARUTI")
                .type("BUY")
                .qty(1000)
                .price(new BigDecimal("15000.00")) // ₹15,000,000 (exceeds ₹1,000,000 balance)
                .build();

        assertThrows(InsufficientBalanceException.class, () -> tradeService.executeTrade(testUserId, request));
    }

    @Test
    @DisplayName("Should execute partial SELL order, credit cash balance, and calculate realized P&L")
    void testSellOrderPartial() {
        // Buy 20 shares @ ₹1000
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("INFY").name("Infosys Ltd").type("BUY").qty(20).price(new BigDecimal("1000.00")).build());

        // Sell 10 shares @ ₹1500 -> Proceeds = ₹15,000, Realized P&L = (1500 - 1000) * 10 = +₹5000
        ExecuteTradeResponse sellResponse = tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("INFY").name("Infosys Ltd").type("SELL").qty(10).price(new BigDecimal("1500.00")).build());

        assertNotNull(sellResponse.getTrade());
        assertEquals(new BigDecimal("5000.00"), sellResponse.getTrade().getRealizedPnl().setScale(2, RoundingMode.HALF_UP));

        List<HoldingResponse> positions = portfolioService.getPortfolioPositions(testUserId, defaultPortfolioId);
        assertEquals(1, positions.size());
        assertEquals(10, positions.get(0).getQty());
        assertEquals(new BigDecimal("1000.00"), positions.get(0).getAvgPrice().setScale(2, RoundingMode.HALF_UP));
    }

    @Test
    @DisplayName("Should execute full SELL order and completely remove holding")
    void testSellOrderFull() {
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("WIPRO").name("Wipro Ltd").type("BUY").qty(50).price(new BigDecimal("400.00")).build());

        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("WIPRO").name("Wipro Ltd").type("SELL").qty(50).price(new BigDecimal("450.00")).build());

        List<HoldingResponse> positions = portfolioService.getPortfolioPositions(testUserId, defaultPortfolioId);
        assertTrue(positions.isEmpty());
    }

    @Test
    @DisplayName("Should reject SELL order if holdings are insufficient or zero")
    void testInsufficientHoldings() {
        ExecuteTradeRequest request = ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("SBIN")
                .type("SELL")
                .qty(5)
                .price(new BigDecimal("700.00"))
                .build();

        assertThrows(InsufficientHoldingsException.class, () -> tradeService.executeTrade(testUserId, request));
    }

    @Test
    @DisplayName("Should trigger active price alerts upon trade execution when price threshold is met")
    void testTradeTriggersAlert() {
        // Create an ABOVE alert for RELIANCE at ₹2400
        priceAlertService.createAlert(testUserId, CreateAlertRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("RELIANCE")
                .name("Reliance Industries Ltd")
                .targetPrice(new BigDecimal("2400.00"))
                .condition("above")
                .build());

        // Execute BUY order at ₹2500 (hits >= 2400)
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("RELIANCE")
                .type("BUY")
                .qty(1)
                .price(new BigDecimal("2500.00"))
                .build());

        List<PriceAlertResponse> alerts = priceAlertService.getUserAlerts(testUserId);
        assertEquals(1, alerts.size());
        assertTrue(alerts.get(0).getTriggered());
        assertFalse(alerts.get(0).getActive());
        assertEquals(new BigDecimal("2500.00"), alerts.get(0).getTriggeredPrice().setScale(2, RoundingMode.HALF_UP));
    }

    @Test
    @DisplayName("Should generate valid CSV trade history export")
    void testExportCsv() {
        tradeService.executeTrade(testUserId, ExecuteTradeRequest.builder()
                .portfolioId(defaultPortfolioId)
                .symbol("TCS").name("TCS Ltd").type("BUY").qty(5).price(new BigDecimal("3000.00")).build());

        String csv = tradeService.exportTradesCsv(testUserId);
        assertNotNull(csv);
        assertTrue(csv.contains("Order ID,Portfolio,Symbol,Type,Qty,Price,Total,Realized P&L,Status,Date"));
        assertTrue(csv.contains("TCS,BUY,5,3000.00,15000.00,0.00,EXECUTED"));
    }
}
