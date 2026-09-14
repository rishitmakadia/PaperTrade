package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.request.ExecuteTradeRequest;
import com.ppt.papertrade.dto.response.ExecuteTradeResponse;
import com.ppt.papertrade.dto.response.TradeResponse;
import com.ppt.papertrade.entity.*;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.InsufficientBalanceException;
import com.ppt.papertrade.exception.InsufficientHoldingsException;
import com.ppt.papertrade.exception.ResourceNotFoundException;
import com.ppt.papertrade.exception.UnauthorizedException;
import com.ppt.papertrade.repository.*;
import com.ppt.papertrade.service.TradeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Transactional trade execution service scoped strictly to Portfolio.
 * Handles BUY, SELL, weighted average price recalculation, and realized P&L bookkeeping with BigDecimal precision.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TradeServiceImpl implements TradeService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final AccountRepository accountRepository;
    private final HoldingRepository holdingRepository;
    private final TradeRepository tradeRepository;
    private final PriceAlertRepository priceAlertRepository;

    @Override
    @Transactional
    public ExecuteTradeResponse executeTrade(Long userId, ExecuteTradeRequest request) {
        Long portfolioId = request.getPortfolioId();
        if (portfolioId == null) {
            Portfolio defaultPort = portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                    .orElseGet(() -> {
                        List<Portfolio> list = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
                        if (list.isEmpty()) throw new BadRequestException("No active portfolio found. Please create a portfolio first.");
                        return list.get(0);
                    });
            portfolioId = defaultPort.getId();
        }
        return executePortfolioTrade(userId, portfolioId, request);
    }

    @Override
    @Transactional
    public ExecuteTradeResponse executePortfolioTrade(Long userId, Long portfolioId, ExecuteTradeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("User account is inactive. Trading is suspended.");
        }

        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own portfolio " + portfolioId);
        }

        if (portfolio.getStatus() != PortfolioStatus.ACTIVE) {
            throw new BadRequestException("Cannot execute trades in an archived portfolio.");
        }

        Account account = accountRepository.findByPortfolioId(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found for portfolio: " + portfolioId));

        String symbol = request.getSymbol().trim().toUpperCase();
        TradeType tradeType = TradeType.fromString(request.getType());
        int qty = request.getQty();
        BigDecimal price = request.getPrice().setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = price.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal realizedPnl = BigDecimal.ZERO;

        if (tradeType == TradeType.BUY) {
            // Validate cash sufficiency for this portfolio
            if (account.getCashBalance().compareTo(total) < 0) {
                throw new InsufficientBalanceException("Insufficient portfolio cash. Required: ₹" + total + ", Available: ₹" + account.getCashBalance());
            }

            // Deduct cash from portfolio account
            account.setCashBalance(account.getCashBalance().subtract(total).setScale(2, RoundingMode.HALF_UP));

            // Update or create holding in this portfolio
            Optional<Holding> existingHoldingOpt = holdingRepository.findByPortfolioIdAndSymbolIgnoreCase(portfolioId, symbol);
            if (existingHoldingOpt.isPresent()) {
                Holding holding = existingHoldingOpt.get();
                BigDecimal currentTotalCost = holding.getAverageBuyPrice().multiply(BigDecimal.valueOf(holding.getQuantity()));
                int newQty = holding.getQuantity() + qty;
                BigDecimal newAvgPrice = currentTotalCost.add(total)
                        .divide(BigDecimal.valueOf(newQty), 4, RoundingMode.HALF_UP);

                holding.setQuantity(newQty);
                holding.setAverageBuyPrice(newAvgPrice);
                if (request.getSector() != null && !request.getSector().isBlank()) {
                    holding.setSector(request.getSector());
                }
                holdingRepository.save(holding);
            } else {
                Holding newHolding = Holding.builder()
                        .portfolio(portfolio)
                        .symbol(symbol)
                        .companyName(request.getName() != null ? request.getName() : symbol)
                        .quantity(qty)
                        .averageBuyPrice(price)
                        .sector(request.getSector() != null ? request.getSector() : "")
                        .build();
                holdingRepository.save(newHolding);
            }
        } else if (tradeType == TradeType.SELL) {
            Holding holding = holdingRepository.findByPortfolioIdAndSymbolIgnoreCase(portfolioId, symbol)
                    .orElseThrow(() -> new InsufficientHoldingsException("Portfolio '" + portfolio.getName() + "' does not hold any shares of " + symbol));

            if (holding.getQuantity() < qty) {
                throw new InsufficientHoldingsException("Not enough shares — portfolio holds " + holding.getQuantity() + " shares of " + symbol);
            }

            // Credit proceeds to portfolio cash balance
            account.setCashBalance(account.getCashBalance().add(total).setScale(2, RoundingMode.HALF_UP));

            // Calculate realized P&L: (salePrice - avgBuyPrice) * qty
            realizedPnl = price.subtract(holding.getAverageBuyPrice())
                    .multiply(BigDecimal.valueOf(qty))
                    .setScale(2, RoundingMode.HALF_UP);

            account.setTotalPnl(account.getTotalPnl().add(realizedPnl).setScale(2, RoundingMode.HALF_UP));

            // Update or remove holding from this portfolio
            if (holding.getQuantity() == qty) {
                holdingRepository.delete(holding);
            } else {
                holding.setQuantity(holding.getQuantity() - qty);
                holdingRepository.save(holding);
            }
        }

        // Increment trade count & save account
        account.setTradeCount(account.getTradeCount() + 1);
        accountRepository.save(account);

        // Record immutable trade log scoped to portfolio
        Trade trade = Trade.builder()
                .portfolio(portfolio)
                .symbol(symbol)
                .companyName(request.getName() != null ? request.getName() : symbol)
                .tradeType(tradeType)
                .quantity(qty)
                .executionPrice(price)
                .totalValue(total)
                .realizedPnl(realizedPnl)
                .status(OrderStatus.EXECUTED)
                .orderType(OrderType.fromString(request.getOrderType()))
                .executedAt(Instant.now())
                .build();

        trade = tradeRepository.save(trade);

        // Check and trigger any matching active price alerts for this portfolio
        triggerAlertsForTradePrice(portfolioId, symbol, price);

        log.info("Executed {} {} × {} @ ₹{} in Portfolio '{}' (ID: {})",
                tradeType, qty, symbol, price, portfolio.getName(), portfolioId);

        return ExecuteTradeResponse.builder()
                .trade(mapToTradeResponse(trade))
                .balance(account.getCashBalance())
                .build();
    }

    private void triggerAlertsForTradePrice(Long portfolioId, String symbol, BigDecimal price) {
        List<PriceAlert> activeAlerts = priceAlertRepository
                .findByPortfolioIdAndSymbolIgnoreCaseAndActiveTrueAndTriggeredFalse(portfolioId, symbol);

        Instant now = Instant.now();
        for (PriceAlert alert : activeAlerts) {
            boolean hit = (alert.getCondition() == AlertCondition.ABOVE && price.compareTo(alert.getTargetPrice()) >= 0)
                    || (alert.getCondition() == AlertCondition.BELOW && price.compareTo(alert.getTargetPrice()) <= 0);

            if (hit) {
                alert.setTriggered(true);
                alert.setTriggeredAt(now);
                alert.setTriggeredPrice(price);
                alert.setActive(false);
                priceAlertRepository.save(alert);
                log.info("🔔 Price alert triggered on trade: {} {} ₹{} (current: ₹{}) in Portfolio ID: {}",
                        alert.getSymbol(), alert.getCondition(), alert.getTargetPrice(), price, portfolioId);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TradeResponse> getPortfolioTrades(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied to portfolio " + portfolioId);
        }
        return tradeRepository.findByPortfolioIdOrderByCreatedAtDesc(portfolioId)
                .stream().map(this::mapToTradeResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TradeResponse> getPortfolioStockTrades(Long userId, Long portfolioId, String symbol) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied to portfolio " + portfolioId);
        }
        return tradeRepository.findByPortfolioIdAndSymbolIgnoreCaseOrderByCreatedAtDesc(portfolioId, symbol.trim())
                .stream().map(this::mapToTradeResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TradeResponse> getUserTrades(Long userId) {
        return tradeRepository.findByPortfolioUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToTradeResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public String exportPortfolioTradesCsv(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied to portfolio " + portfolioId);
        }
        List<Trade> trades = tradeRepository.findByPortfolioIdOrderByCreatedAtDesc(portfolioId);
        return buildCsv(trades);
    }

    @Override
    @Transactional(readOnly = true)
    public String exportTradesCsv(Long userId) {
        List<Trade> trades = tradeRepository.findByPortfolioUserIdOrderByCreatedAtDesc(userId);
        return buildCsv(trades);
    }

    private String buildCsv(List<Trade> trades) {
        StringBuilder sb = new StringBuilder();
        sb.append("Order ID,Portfolio,Symbol,Type,Qty,Price,Total,Realized P&L,Status,Date\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Asia/Kolkata"));

        for (Trade t : trades) {
            String shortId = t.getId() != null ? String.format("%08X", t.getId()) : "N/A";
            String dateStr = dtf.format(t.getCreatedAt());
            String portName = t.getPortfolio() != null ? t.getPortfolio().getName() : "Main";
            sb.append(shortId).append(",")
                    .append("\"").append(portName).append("\",")
                    .append(t.getSymbol()).append(",")
                    .append(t.getTradeType().name()).append(",")
                    .append(t.getQuantity()).append(",")
                    .append(t.getExecutionPrice().setScale(2, RoundingMode.HALF_UP)).append(",")
                    .append(t.getTotalValue().setScale(2, RoundingMode.HALF_UP)).append(",")
                    .append(t.getRealizedPnl() != null ? t.getRealizedPnl().setScale(2, RoundingMode.HALF_UP) : "0.00").append(",")
                    .append(t.getStatus().name()).append(",")
                    .append(dateStr).append("\n");
        }

        return sb.toString();
    }

    private TradeResponse mapToTradeResponse(Trade t) {
        return TradeResponse.builder()
                .id(t.getId())
                .userId(t.getPortfolio().getUser().getId())
                .portfolioId(t.getPortfolio().getId())
                .portfolioName(t.getPortfolio().getName())
                .symbol(t.getSymbol())
                .name(t.getCompanyName())
                .type(t.getTradeType().name())
                .qty(t.getQuantity())
                .price(t.getExecutionPrice())
                .total(t.getTotalValue())
                .realizedPnl(t.getRealizedPnl())
                .status(t.getStatus().name())
                .orderType(t.getOrderType().name())
                .executedAt(t.getExecutedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
