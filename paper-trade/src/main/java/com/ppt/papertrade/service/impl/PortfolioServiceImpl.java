package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.request.CreatePortfolioRequest;
import com.ppt.papertrade.dto.request.UpdatePortfolioRequest;
import com.ppt.papertrade.dto.response.*;
import com.ppt.papertrade.entity.*;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.ResourceNotFoundException;
import com.ppt.papertrade.exception.UnauthorizedException;
import com.ppt.papertrade.marketdata.MarketDataService;
import com.ppt.papertrade.repository.*;
import com.ppt.papertrade.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final AccountRepository accountRepository;
    private final HoldingRepository holdingRepository;
    private final TradeRepository tradeRepository;
    private final UserRepository userRepository;
    private final MarketDataService marketDataService;

    @Override
    @Transactional
    public PortfolioResponse createPortfolio(Long userId, CreatePortfolioRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String name = request.getName().trim();
        if (portfolioRepository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new BadRequestException("Portfolio with name '" + name + "' already exists");
        }

        BigDecimal capital = request.getInitialCapital() != null && request.getInitialCapital().compareTo(BigDecimal.ZERO) > 0
                ? request.getInitialCapital().setScale(4, RoundingMode.HALF_UP)
                : new BigDecimal("1000000.0000");

        long existingCount = portfolioRepository.countByUserIdAndStatus(userId, PortfolioStatus.ACTIVE);

        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .initialCapital(capital)
                .status(PortfolioStatus.ACTIVE)
                .isDefault(existingCount == 0)
                .build();

        portfolio = portfolioRepository.save(portfolio);

        Account account = Account.builder()
                .portfolio(portfolio)
                .cashBalance(capital)
                .initialBalance(capital)
                .totalPnl(BigDecimal.ZERO)
                .tradeCount(0)
                .build();

        account = accountRepository.save(account);
        portfolio.setAccount(account);

        return mapToPortfolioResponse(portfolio, account, Collections.emptyList(), Collections.emptyMap());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PortfolioSummaryResponse> getUserPortfolios(Long userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
        if (portfolios.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch fetch holdings for live price calculations
        List<Holding> allHoldings = holdingRepository.findByPortfolioUserId(userId);
        Map<Long, List<Holding>> holdingsByPortfolio = allHoldings.stream()
                .collect(Collectors.groupingBy(h -> h.getPortfolio().getId()));

        List<String> symbols = allHoldings.stream().map(Holding::getSymbol).distinct().toList();
        Map<String, BigDecimal> priceMap = getLivePriceMap(symbols);

        return portfolios.stream().map(p -> {
            Account acc = p.getAccount() != null ? p.getAccount() : accountRepository.findByPortfolioId(p.getId()).orElse(null);
            List<Holding> pHoldings = holdingsByPortfolio.getOrDefault(p.getId(), Collections.emptyList());
            return calculatePortfolioSummary(p, acc, pHoldings, priceMap);
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PortfolioResponse getPortfolioDetail(Long userId, Long portfolioId) {
        Portfolio portfolio = findPortfolioAndValidateOwnership(portfolioId, userId);
        Account account = portfolio.getAccount() != null ? portfolio.getAccount() : accountRepository.findByPortfolioId(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found for portfolio: " + portfolioId));

        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        List<String> symbols = holdings.stream().map(Holding::getSymbol).distinct().toList();
        Map<String, BigDecimal> priceMap = getLivePriceMap(symbols);

        return mapToPortfolioResponse(portfolio, account, holdings, priceMap);
    }

    @Override
    @Transactional
    public PortfolioResponse updatePortfolio(Long userId, Long portfolioId, UpdatePortfolioRequest request) {
        Portfolio portfolio = findPortfolioAndValidateOwnership(portfolioId, userId);

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(portfolio.getName())) {
                if (portfolioRepository.existsByUserIdAndNameIgnoreCase(userId, newName)) {
                    throw new BadRequestException("Portfolio with name '" + newName + "' already exists");
                }
                portfolio.setName(newName);
            }
        }

        if (request.getDescription() != null) {
            portfolio.setDescription(request.getDescription().trim());
        }

        portfolio = portfolioRepository.save(portfolio);
        Account account = portfolio.getAccount() != null ? portfolio.getAccount() : accountRepository.findByPortfolioId(portfolioId).orElse(null);
        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        Map<String, BigDecimal> priceMap = getLivePriceMap(holdings.stream().map(Holding::getSymbol).distinct().toList());

        return mapToPortfolioResponse(portfolio, account, holdings, priceMap);
    }

    @Override
    @Transactional
    public void deletePortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = findPortfolioAndValidateOwnership(portfolioId, userId);

        long activeCount = portfolioRepository.countByUserIdAndStatus(userId, PortfolioStatus.ACTIVE);
        if (activeCount <= 1) {
            throw new BadRequestException("Cannot delete your only active portfolio. Please create another portfolio first.");
        }

        // Soft archive portfolio
        portfolio.setStatus(PortfolioStatus.ARCHIVED);
        if (Boolean.TRUE.equals(portfolio.getIsDefault())) {
            portfolio.setIsDefault(false);
            // Promote another portfolio to default
            List<Portfolio> remaining = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
            for (Portfolio rem : remaining) {
                if (!rem.getId().equals(portfolioId)) {
                    rem.setIsDefault(true);
                    portfolioRepository.save(rem);
                    break;
                }
            }
        }
        portfolioRepository.save(portfolio);
        log.info("Portfolio {} (ID: {}) archived by user ID {}", portfolio.getName(), portfolioId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HoldingResponse> getPortfolioPositions(Long userId, Long portfolioId) {
        findPortfolioAndValidateOwnership(portfolioId, userId);
        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        return holdings.stream().map(this::mapToHoldingResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquityPointResponse> getPortfolioEquityCurve(Long userId, Long portfolioId, int requestedDays) {
        Portfolio portfolio = findPortfolioAndValidateOwnership(portfolioId, userId);
        Account account = portfolio.getAccount() != null ? portfolio.getAccount() : accountRepository.findByPortfolioId(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found for portfolio: " + portfolioId));

        int days = Math.min(Math.max(requestedDays, 1), 365);
        List<Trade> allExecutedTrades = tradeRepository
                .findByPortfolioIdAndStatusOrderByCreatedAtAsc(portfolioId, OrderStatus.EXECUTED);

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate windowStart = today.minusDays(days);
        Instant windowStartInstant = windowStart.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant();

        BigDecimal runningCash = account.getInitialBalance() != null
                ? account.getInitialBalance()
                : portfolio.getInitialCapital();

        for (Trade t : allExecutedTrades) {
            if (t.getCreatedAt().isBefore(windowStartInstant)) {
                if (t.getTradeType() == TradeType.SELL) {
                    runningCash = runningCash.add(t.getTotalValue());
                } else {
                    runningCash = runningCash.subtract(t.getTotalValue());
                }
            }
        }

        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE;
        Map<String, List<Trade>> tradesByDate = new HashMap<>();
        for (Trade t : allExecutedTrades) {
            if (!t.getCreatedAt().isBefore(windowStartInstant)) {
                String d = t.getCreatedAt().atZone(ZoneId.of("Asia/Kolkata")).toLocalDate().format(dtf);
                tradesByDate.computeIfAbsent(d, k -> new ArrayList<>()).add(t);
            }
        }

        List<EquityPointResponse> curve = new ArrayList<>();
        for (int i = days; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String dateStr = d.format(dtf);

            List<Trade> dayTrades = tradesByDate.getOrDefault(dateStr, Collections.emptyList());
            for (Trade t : dayTrades) {
                if (t.getTradeType() == TradeType.SELL) {
                    runningCash = runningCash.add(t.getTotalValue());
                } else {
                    runningCash = runningCash.subtract(t.getTotalValue());
                }
            }

            BigDecimal pointValue = runningCash.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            curve.add(EquityPointResponse.builder()
                    .date(dateStr)
                    .value(pointValue)
                    .build());
        }

        if (allExecutedTrades.isEmpty()) {
            BigDecimal currentBal = account.getCashBalance().setScale(2, RoundingMode.HALF_UP);
            return curve.stream()
                    .map(p -> EquityPointResponse.builder().date(p.getDate()).value(currentBal).build())
                    .toList();
        }

        return curve;
    }

    @Override
    @Transactional(readOnly = true)
    public PortfolioStatsResponse getPortfolioStats(Long userId, Long portfolioId) {
        findPortfolioAndValidateOwnership(portfolioId, userId);
        Account account = accountRepository.findByPortfolioId(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found for portfolio: " + portfolioId));

        Instant startOfToday = LocalDate.now(ZoneId.of("Asia/Kolkata"))
                .atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant();

        List<Trade> todayTrades = tradeRepository
                .findByPortfolioIdAndStatusAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
                        portfolioId, OrderStatus.EXECUTED, startOfToday
                );

        int buyCount = 0;
        int sellCount = 0;
        BigDecimal dayPnl = BigDecimal.ZERO;

        for (Trade t : todayTrades) {
            if (t.getTradeType() == TradeType.BUY) {
                buyCount++;
                dayPnl = dayPnl.subtract(t.getTotalValue());
            } else if (t.getTradeType() == TradeType.SELL) {
                sellCount++;
                dayPnl = dayPnl.add(t.getTotalValue());
            }
        }

        long totalTrades = tradeRepository.countByPortfolioIdAndStatus(portfolioId, OrderStatus.EXECUTED);

        return PortfolioStatsResponse.builder()
                .dayPnl(dayPnl.setScale(2, RoundingMode.HALF_UP))
                .buyCount(buyCount)
                .sellCount(sellCount)
                .totalTrades(totalTrades)
                .balance(account.getCashBalance().setScale(2, RoundingMode.HALF_UP))
                .pnl(account.getTotalPnl().setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PortfolioPerformanceResponse getPortfolioPerformance(Long userId, Long portfolioId, int requestedDays) {
        Portfolio portfolio = findPortfolioAndValidateOwnership(portfolioId, userId);
        Account account = portfolio.getAccount() != null ? portfolio.getAccount() : accountRepository.findByPortfolioId(portfolioId).orElse(null);

        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolioId);
        Map<String, BigDecimal> priceMap = getLivePriceMap(holdings.stream().map(Holding::getSymbol).distinct().toList());

        BigDecimal cash = account != null ? account.getCashBalance() : portfolio.getInitialCapital();
        BigDecimal holdingsValue = holdings.stream().map(h -> {
            BigDecimal p = priceMap.getOrDefault(h.getSymbol().toUpperCase(), h.getAverageBuyPrice());
            return p.multiply(BigDecimal.valueOf(h.getQuantity()));
        }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal portfolioValue = cash.add(holdingsValue);
        BigDecimal totalPnl = portfolioValue.subtract(portfolio.getInitialCapital());
        BigDecimal returnPercentage = portfolio.getInitialCapital().compareTo(BigDecimal.ZERO) > 0
                ? totalPnl.multiply(BigDecimal.valueOf(100)).divide(portfolio.getInitialCapital(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<Trade> executedTrades = tradeRepository.findByPortfolioIdOrderByCreatedAtDesc(portfolioId);
        int buyCount = 0;
        int sellCount = 0;
        int winningTrades = 0;
        int losingTrades = 0;

        for (Trade t : executedTrades) {
            if (t.getTradeType() == TradeType.BUY) {
                buyCount++;
            } else if (t.getTradeType() == TradeType.SELL) {
                sellCount++;
                if (t.getRealizedPnl() != null) {
                    if (t.getRealizedPnl().compareTo(BigDecimal.ZERO) > 0) {
                        winningTrades++;
                    } else if (t.getRealizedPnl().compareTo(BigDecimal.ZERO) < 0) {
                        losingTrades++;
                    }
                }
            }
        }

        BigDecimal winRate = sellCount > 0
                ? BigDecimal.valueOf(winningTrades).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(sellCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<EquityPointResponse> curve = getPortfolioEquityCurve(userId, portfolioId, requestedDays);

        return PortfolioPerformanceResponse.builder()
                .portfolioId(portfolio.getId())
                .portfolioName(portfolio.getName())
                .initialCapital(portfolio.getInitialCapital().setScale(2, RoundingMode.HALF_UP))
                .cashBalance(cash.setScale(2, RoundingMode.HALF_UP))
                .totalPortfolioValue(portfolioValue.setScale(2, RoundingMode.HALF_UP))
                .totalPnl(totalPnl.setScale(2, RoundingMode.HALF_UP))
                .returnPercentage(returnPercentage)
                .totalTrades(executedTrades.size())
                .buyCount(buyCount)
                .sellCount(sellCount)
                .winningTrades(winningTrades)
                .losingTrades(losingTrades)
                .winRate(winRate)
                .equityCurve(curve)
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> resetPortfolio(Long userId, Long portfolioId, BigDecimal customBalance) {
        Portfolio portfolio = findPortfolioAndValidateOwnership(portfolioId, userId);
        Account account = portfolio.getAccount() != null ? portfolio.getAccount() : accountRepository.findByPortfolioId(portfolioId)
                .orElseGet(() -> Account.builder().portfolio(portfolio).build());

        // Wipe holdings and trades strictly for THIS portfolio only
        holdingRepository.deleteAllByPortfolioId(portfolioId);
        tradeRepository.deleteAllByPortfolioId(portfolioId);

        BigDecimal freshBalance = customBalance != null && customBalance.compareTo(BigDecimal.ZERO) > 0
                ? customBalance.setScale(4, RoundingMode.HALF_UP)
                : portfolio.getInitialCapital();

        portfolio.setInitialCapital(freshBalance);
        portfolioRepository.save(portfolio);

        account.setCashBalance(freshBalance);
        account.setInitialBalance(freshBalance);
        account.setTotalPnl(BigDecimal.ZERO);
        account.setTradeCount(0);
        accountRepository.save(account);

        log.info("Portfolio '{}' (ID: {}) reset with balance ₹{} for user ID {}", portfolio.getName(), portfolioId, freshBalance, userId);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Portfolio '" + portfolio.getName() + "' reset successfully");
        result.put("portfolioId", portfolioId);
        result.put("balance", freshBalance.setScale(2, RoundingMode.HALF_UP));
        return result;
    }

    private Portfolio findPortfolioAndValidateOwnership(Long portfolioId, Long userId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own this portfolio.");
        }

        if (portfolio.getStatus() != PortfolioStatus.ACTIVE) {
            throw new BadRequestException("Portfolio is archived or inactive.");
        }

        return portfolio;
    }

    private PortfolioSummaryResponse calculatePortfolioSummary(
            Portfolio p, Account acc, List<Holding> holdings, Map<String, BigDecimal> priceMap
    ) {
        BigDecimal cash = acc != null ? acc.getCashBalance() : p.getInitialCapital();
        BigDecimal holdingsValue = holdings.stream().map(h -> {
            BigDecimal price = priceMap.getOrDefault(h.getSymbol().toUpperCase(), h.getAverageBuyPrice());
            return price.multiply(BigDecimal.valueOf(h.getQuantity()));
        }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal portfolioValue = cash.add(holdingsValue);
        BigDecimal totalPnl = portfolioValue.subtract(p.getInitialCapital());
        BigDecimal returnPct = p.getInitialCapital().compareTo(BigDecimal.ZERO) > 0
                ? totalPnl.multiply(BigDecimal.valueOf(100)).divide(p.getInitialCapital(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return PortfolioSummaryResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .initialCapital(p.getInitialCapital().setScale(2, RoundingMode.HALF_UP))
                .cashBalance(cash.setScale(2, RoundingMode.HALF_UP))
                .currentPortfolioValue(portfolioValue.setScale(2, RoundingMode.HALF_UP))
                .totalPnl(totalPnl.setScale(2, RoundingMode.HALF_UP))
                .returnPercentage(returnPct)
                .holdingsCount(holdings.size())
                .tradeCount(acc != null ? acc.getTradeCount() : 0)
                .isDefault(p.getIsDefault())
                .status(p.getStatus().name())
                .build();
    }

    private PortfolioResponse mapToPortfolioResponse(
            Portfolio p, Account acc, List<Holding> holdings, Map<String, BigDecimal> priceMap
    ) {
        BigDecimal cash = acc != null ? acc.getCashBalance() : p.getInitialCapital();
        BigDecimal investedValue = holdings.stream()
                .map(h -> h.getAverageBuyPrice().multiply(BigDecimal.valueOf(h.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentHoldingsValue = holdings.stream().map(h -> {
            BigDecimal price = priceMap.getOrDefault(h.getSymbol().toUpperCase(), h.getAverageBuyPrice());
            return price.multiply(BigDecimal.valueOf(h.getQuantity()));
        }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPortfolioValue = cash.add(currentHoldingsValue);
        BigDecimal realizedPnl = acc != null ? acc.getTotalPnl() : BigDecimal.ZERO;
        BigDecimal unrealizedPnl = currentHoldingsValue.subtract(investedValue);
        BigDecimal totalPnl = realizedPnl.add(unrealizedPnl);
        BigDecimal returnPct = p.getInitialCapital().compareTo(BigDecimal.ZERO) > 0
                ? totalPnl.multiply(BigDecimal.valueOf(100)).divide(p.getInitialCapital(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return PortfolioResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .name(p.getName())
                .description(p.getDescription())
                .initialCapital(p.getInitialCapital().setScale(2, RoundingMode.HALF_UP))
                .cashBalance(cash.setScale(2, RoundingMode.HALF_UP))
                .investedValue(investedValue.setScale(2, RoundingMode.HALF_UP))
                .currentHoldingsValue(currentHoldingsValue.setScale(2, RoundingMode.HALF_UP))
                .totalPortfolioValue(totalPortfolioValue.setScale(2, RoundingMode.HALF_UP))
                .realizedPnl(realizedPnl.setScale(2, RoundingMode.HALF_UP))
                .unrealizedPnl(unrealizedPnl.setScale(2, RoundingMode.HALF_UP))
                .totalPnl(totalPnl.setScale(2, RoundingMode.HALF_UP))
                .returnPercentage(returnPct)
                .tradeCount(acc != null ? acc.getTradeCount() : 0)
                .holdingsCount(holdings.size())
                .status(p.getStatus().name())
                .isDefault(p.getIsDefault())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private HoldingResponse mapToHoldingResponse(Holding h) {
        return HoldingResponse.builder()
                .id(h.getId())
                .portfolioId(h.getPortfolio().getId())
                .symbol(h.getSymbol())
                .name(h.getCompanyName())
                .qty(h.getQuantity())
                .avgPrice(h.getAverageBuyPrice().setScale(2, RoundingMode.HALF_UP))
                .sector(h.getSector())
                .updatedAt(h.getUpdatedAt())
                .createdAt(h.getCreatedAt())
                .build();
    }

    private Map<String, BigDecimal> getLivePriceMap(List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            List<StockQuoteResponse> quotes = marketDataService.getAllQuotes(symbols);
            return quotes.stream().collect(Collectors.toMap(
                    q -> q.getSymbol().toUpperCase(),
                    StockQuoteResponse::getPrice,
                    (p1, p2) -> p1
            ));
        } catch (Exception e) {
            log.warn("Failed to fetch live quotes for price map: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
