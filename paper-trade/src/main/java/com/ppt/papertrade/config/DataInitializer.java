package com.ppt.papertrade.config;

import com.ppt.papertrade.entity.*;
import com.ppt.papertrade.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

/**
 * Initializes the database with default NSE stocks, demo users, realistic trade histories, and portfolios.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final AccountRepository accountRepository;
    private final StockRepository stockRepository;
    private final WatchlistRepository watchlistRepository;
    private final TradeRepository tradeRepository;
    private final HoldingRepository holdingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedStocks();
        seedUsers();
        seedTradesIfEmpty();
    }

    private void seedStocks() {
        if (stockRepository.count() > 0) {
            return;
        }

        log.info("🌱 Seeding default NSE stock universe...");

        List<Stock> defaultStocks = List.of(
                Stock.builder().symbol("RELIANCE").companyName("Reliance Industries Ltd").exchange("NSE").sector("Energy").build(),
                Stock.builder().symbol("TCS").companyName("Tata Consultancy Services Ltd").exchange("NSE").sector("IT").build(),
                Stock.builder().symbol("HDFCBANK").companyName("HDFC Bank Ltd").exchange("NSE").sector("Banking").build(),
                Stock.builder().symbol("INFY").companyName("Infosys Ltd").exchange("NSE").sector("IT").build(),
                Stock.builder().symbol("ICICIBANK").companyName("ICICI Bank Ltd").exchange("NSE").sector("Banking").build(),
                Stock.builder().symbol("BHARTIARTL").companyName("Bharti Airtel Ltd").exchange("NSE").sector("Telecom").build(),
                Stock.builder().symbol("WIPRO").companyName("Wipro Ltd").exchange("NSE").sector("IT").build(),
                Stock.builder().symbol("SBIN").companyName("State Bank of India").exchange("NSE").sector("Banking").build(),
                Stock.builder().symbol("TATAMOTORS").companyName("Tata Motors Ltd").exchange("NSE").sector("Auto").build(),
                Stock.builder().symbol("MARUTI").companyName("Maruti Suzuki India Ltd").exchange("NSE").sector("Auto").build(),
                Stock.builder().symbol("BAJFINANCE").companyName("Bajaj Finance Ltd").exchange("NSE").sector("NBFC").build(),
                Stock.builder().symbol("SUNPHARMA").companyName("Sun Pharmaceutical Industries Ltd").exchange("NSE").sector("Pharma").build(),
                Stock.builder().symbol("LT").companyName("Larsen & Toubro Ltd").exchange("NSE").sector("Infrastructure").build(),
                Stock.builder().symbol("ASIANPAINT").companyName("Asian Paints Ltd").exchange("NSE").sector("Consumer").build(),
                Stock.builder().symbol("NESTLEIND").companyName("Nestle India Ltd").exchange("NSE").sector("FMCG").build(),
                Stock.builder().symbol("HINDUNILVR").companyName("Hindustan Unilever Ltd").exchange("NSE").sector("FMCG").build(),
                Stock.builder().symbol("ITC").companyName("ITC Ltd").exchange("NSE").sector("FMCG").build(),
                Stock.builder().symbol("KOTAKBANK").companyName("Kotak Mahindra Bank Ltd").exchange("NSE").sector("Banking").build(),
                Stock.builder().symbol("AXISBANK").companyName("Axis Bank Ltd").exchange("NSE").sector("Banking").build(),
                Stock.builder().symbol("TITAN").companyName("Titan Company Limited").exchange("NSE").sector("Consumer").build(),
                Stock.builder().symbol("TRENT").companyName("Trent Ltd").exchange("NSE").sector("Consumer").build()
        );

        stockRepository.saveAll(defaultStocks);
        log.info("✓ Saved {} stock master records", defaultStocks.size());
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        log.info("🌱 Seeding demo accounts with default portfolios (PaperTrade)...");

        // 1. Regular Trader: Krunal Valvi
        createUserWithAccount(
                "Krunal Valvi",
                "krunal@example.com",
                "password123",
                Role.USER,
                UserStatus.ACTIVE,
                new BigDecimal("1247832.5000"),
                new BigDecimal("247832.5000"),
                47,
                "#00d4ff",
                Arrays.asList("RELIANCE", "TCS", "HDFCBANK", "INFY")
        );

        // 2. Regular Trader: Shubham Bhimani
        createUserWithAccount(
                "Shubham Bhimani",
                "Shubham@example.com",
                "password123",
                Role.USER,
                UserStatus.ACTIVE,
                new BigDecimal("876540.0000"),
                new BigDecimal("-123460.0000"),
                32,
                "#00ff88",
                Arrays.asList("ICICIBANK", "WIPRO")
        );

        // 3. Regular Trader: Vraj Rajarapa
        createUserWithAccount(
                "Vraj Rajarapa",
                "Vraj@example.com",
                "password123",
                Role.USER,
                UserStatus.ACTIVE,
                new BigDecimal("1589200.0000"),
                new BigDecimal("589200.0000"),
                89,
                "#b44dff",
                Arrays.asList("SBIN", "TATAMOTORS")
        );

        // 4. Inactive Trader: Mayur Chavda
        createUserWithAccount(
                "Mayur Chavda",
                "Mayur@example.com",
                "password123",
                Role.USER,
                UserStatus.INACTIVE,
                new BigDecimal("543000.0000"),
                new BigDecimal("-457000.0000"),
                12,
                "#ffd700",
                List.of()
        );

        // 5. Regular Trader: Raj Kikani
        createUserWithAccount(
                "Raj Kikani",
                "Raj@example.com",
                "password123",
                Role.USER,
                UserStatus.ACTIVE,
                new BigDecimal("2134500.0000"),
                new BigDecimal("1134500.0000"),
                134,
                "#ff6b35",
                Arrays.asList("MARUTI", "BAJFINANCE")
        );

        // 6. Admin Account
        createUserWithAccount(
                "Admin",
                "admin@admin.com",
                "12345678",
                Role.ADMIN,
                UserStatus.ACTIVE,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0,
                "#ff3366",
                List.of()
        );

        log.info("✓ Seed complete! Demo accounts ready:");
        log.info("  Trader: krunal@example.com / password123");
        log.info("  Admin:  admin@admin.com / 12345678");
    }

    private void seedTradesIfEmpty() {
        if (tradeRepository.count() > 0) {
            return;
        }

        log.info("🌱 Seeding realistic platform trade ledger...");

        List<Portfolio> portfolios = portfolioRepository.findAllActiveWithUser();
        Instant now = Instant.now();

        for (Portfolio p : portfolios) {
            if (p.getUser().getRole() == Role.ADMIN) continue;

            String email = p.getUser().getEmail().toLowerCase();
            if (email.contains("raj")) {
                saveTrade(p, "MARUTI", "Maruti Suzuki India Ltd", TradeType.BUY, 15, new BigDecimal("12450.00"), now.minus(14, ChronoUnit.DAYS));
                saveTrade(p, "MARUTI", "Maruti Suzuki India Ltd", TradeType.SELL, 5, new BigDecimal("12890.00"), now.minus(10, ChronoUnit.DAYS));
                saveTrade(p, "BAJFINANCE", "Bajaj Finance Ltd", TradeType.BUY, 40, new BigDecimal("7120.00"), now.minus(8, ChronoUnit.DAYS));
                saveTrade(p, "RELIANCE", "Reliance Industries Ltd", TradeType.BUY, 50, new BigDecimal("2980.00"), now.minus(4, ChronoUnit.DAYS));
                saveTrade(p, "BAJFINANCE", "Bajaj Finance Ltd", TradeType.SELL, 15, new BigDecimal("7450.00"), now.minus(2, ChronoUnit.DAYS));
            } else if (email.contains("vraj")) {
                saveTrade(p, "SBIN", "State Bank of India", TradeType.BUY, 200, new BigDecimal("785.00"), now.minus(18, ChronoUnit.DAYS));
                saveTrade(p, "TATAMOTORS", "Tata Motors Ltd", TradeType.BUY, 150, new BigDecimal("945.00"), now.minus(12, ChronoUnit.DAYS));
                saveTrade(p, "SBIN", "State Bank of India", TradeType.SELL, 100, new BigDecimal("830.00"), now.minus(6, ChronoUnit.DAYS));
                saveTrade(p, "INFY", "Infosys Ltd", TradeType.BUY, 80, new BigDecimal("1820.00"), now.minus(3, ChronoUnit.DAYS));
            } else if (email.contains("shubham")) {
                saveTrade(p, "ICICIBANK", "ICICI Bank Ltd", TradeType.BUY, 120, new BigDecimal("1180.00"), now.minus(20, ChronoUnit.DAYS));
                saveTrade(p, "WIPRO", "Wipro Ltd", TradeType.BUY, 250, new BigDecimal("490.00"), now.minus(15, ChronoUnit.DAYS));
                saveTrade(p, "ICICIBANK", "ICICI Bank Ltd", TradeType.SELL, 40, new BigDecimal("1225.00"), now.minus(7, ChronoUnit.DAYS));
                saveTrade(p, "TCS", "Tata Consultancy Services Ltd", TradeType.BUY, 30, new BigDecimal("3950.00"), now.minus(1, ChronoUnit.DAYS));
            } else if (email.contains("mayur")) {
                saveTrade(p, "HDFCBANK", "HDFC Bank Ltd", TradeType.BUY, 60, new BigDecimal("1620.00"), now.minus(25, ChronoUnit.DAYS));
                saveTrade(p, "HDFCBANK", "HDFC Bank Ltd", TradeType.SELL, 30, new BigDecimal("1590.00"), now.minus(16, ChronoUnit.DAYS));
            }
        }
    }

    private void saveTrade(Portfolio portfolio, String symbol, String companyName, TradeType type, int qty, BigDecimal price, Instant time) {
        BigDecimal total = price.multiply(BigDecimal.valueOf(qty));
        BigDecimal pnl = type == TradeType.SELL ? price.multiply(BigDecimal.valueOf(0.04)).multiply(BigDecimal.valueOf(qty)) : BigDecimal.ZERO;

        Trade trade = Trade.builder()
                .portfolio(portfolio)
                .symbol(symbol)
                .companyName(companyName)
                .tradeType(type)
                .quantity(qty)
                .executionPrice(price)
                .totalValue(total)
                .realizedPnl(pnl)
                .status(OrderStatus.EXECUTED)
                .orderType(OrderType.MARKET)
                .executedAt(time)
                .createdAt(time)
                .build();

        tradeRepository.save(trade);
    }

    private void createUserWithAccount(
            String name,
            String email,
            String rawPassword,
            Role role,
            UserStatus status,
            BigDecimal balance,
            BigDecimal pnl,
            int trades,
            String avatarColor,
            List<String> watchlist
    ) {
        User user = User.builder()
                .name(name)
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(status)
                .avatarColor(avatarColor)
                .build();

        user = userRepository.save(user);

        BigDecimal initialCap = new BigDecimal("1000000.0000");
        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .name("Main Portfolio")
                .description("Default primary portfolio")
                .initialCapital(initialCap)
                .status(PortfolioStatus.ACTIVE)
                .isDefault(true)
                .build();

        portfolio = portfolioRepository.save(portfolio);

        Account account = Account.builder()
                .portfolio(portfolio)
                .cashBalance(balance)
                .initialBalance(initialCap)
                .totalPnl(pnl)
                .tradeCount(trades)
                .build();

        accountRepository.save(account);

        for (String sym : watchlist) {
            WatchlistItem item = WatchlistItem.builder()
                    .portfolio(portfolio)
                    .symbol(sym)
                    .build();
            watchlistRepository.save(item);
        }
    }
}
