package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.CreateAlertRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.PriceAlertResponse;
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
class PriceAlertServiceTest {

    @Autowired
    private PriceAlertService priceAlertService;

    @Autowired
    private AuthService authService;

    private Long testUserId;

    @BeforeEach
    void setUp() {
        SignupRequest signup = SignupRequest.builder()
                .name("Alert Tester")
                .email("alert.tester." + System.nanoTime() + "@example.com")
                .password("password123")
                .build();
        AuthResponse auth = authService.signup(signup);
        testUserId = auth.getUser().getId();
    }

    @Test
    @DisplayName("Should create, list, and reset price alerts")
    void testAlertLifecycle() {
        CreateAlertRequest request = CreateAlertRequest.builder()
                .symbol("RELIANCE")
                .name("Reliance Industries Ltd")
                .targetPrice(new BigDecimal("3000.00"))
                .condition("above")
                .build();

        PriceAlertResponse created = priceAlertService.createAlert(testUserId, request);
        assertNotNull(created);
        assertEquals("RELIANCE", created.getSymbol());
        assertTrue(created.getActive());
        assertFalse(created.getTriggered());

        List<PriceAlertResponse> list = priceAlertService.getUserAlerts(testUserId);
        assertEquals(1, list.size());

        // Reset
        PriceAlertResponse reset = priceAlertService.resetAlert(testUserId, created.getId());
        assertTrue(reset.getActive());
        assertFalse(reset.getTriggered());
        assertNull(reset.getTriggeredAt());

        // Delete
        priceAlertService.deleteAlert(testUserId, created.getId());
        List<PriceAlertResponse> afterDelete = priceAlertService.getUserAlerts(testUserId);
        assertTrue(afterDelete.isEmpty());
    }
}
