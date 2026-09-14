package com.ppt.papertrade.scheduler;

import com.ppt.papertrade.dto.response.StockQuoteResponse;
import com.ppt.papertrade.entity.AlertCondition;
import com.ppt.papertrade.entity.PriceAlert;
import com.ppt.papertrade.marketdata.MarketDataService;
import com.ppt.papertrade.repository.PriceAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Background scheduler that periodically checks active price alerts against real-time market prices.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.alerts.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class PriceAlertScheduler {

    private final PriceAlertRepository priceAlertRepository;
    private final MarketDataService marketDataService;

    @Scheduled(fixedDelayString = "${app.alerts.scheduler.fixed-delay-ms:60000}")
    @Transactional
    public void checkActiveAlerts() {
        try {
            List<PriceAlert> activeAlerts = priceAlertRepository.findByActiveTrueAndTriggeredFalse();
            if (activeAlerts.isEmpty()) {
                return;
            }

            // Group by distinct stock symbols to minimize external market calls
            List<String> distinctSymbols = activeAlerts.stream()
                    .map(PriceAlert::getSymbol)
                    .distinct()
                    .toList();

            List<StockQuoteResponse> quotes = marketDataService.getAllQuotes(distinctSymbols);
            Map<String, BigDecimal> priceMap = quotes.stream()
                    .collect(Collectors.toMap(
                            q -> q.getSymbol().toUpperCase(),
                            StockQuoteResponse::getPrice,
                            (p1, p2) -> p1
                    ));

            Instant now = Instant.now();
            int triggeredCount = 0;

            for (PriceAlert alert : activeAlerts) {
                BigDecimal currentPrice = priceMap.get(alert.getSymbol().toUpperCase());
                if (currentPrice == null || currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                boolean triggered = false;
                if (alert.getCondition() == AlertCondition.ABOVE && currentPrice.compareTo(alert.getTargetPrice()) >= 0) {
                    triggered = true;
                } else if (alert.getCondition() == AlertCondition.BELOW && currentPrice.compareTo(alert.getTargetPrice()) <= 0) {
                    triggered = true;
                }

                if (triggered) {
                    alert.setTriggered(true);
                    alert.setTriggeredAt(now);
                    alert.setTriggeredPrice(currentPrice);
                    alert.setActive(false);
                    priceAlertRepository.save(alert);
                    triggeredCount++;

                    log.info("🔔 Scheduled price alert triggered: {} {} ₹{} (current: ₹{}) for Portfolio ID: {}",
                            alert.getSymbol(), alert.getCondition(), alert.getTargetPrice(), currentPrice,
                            alert.getPortfolio() != null ? alert.getPortfolio().getId() : "N/A");
                }
            }

            if (triggeredCount > 0) {
                log.info("Price alert check completed: {}/{} alerts triggered", triggeredCount, activeAlerts.size());
            }
        } catch (Exception e) {
            log.warn("Price alert scheduler execution encountered an issue (non-fatal): {}", e.getMessage());
        }
    }
}
