package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.request.LoginRequest;
import com.ppt.papertrade.dto.request.ResetPortfolioRequest;
import com.ppt.papertrade.dto.request.SignupRequest;
import com.ppt.papertrade.dto.request.UpdateProfileRequest;
import com.ppt.papertrade.dto.response.AuthResponse;
import com.ppt.papertrade.dto.response.UserResponse;
import com.ppt.papertrade.entity.*;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.ResourceNotFoundException;
import com.ppt.papertrade.exception.UnauthorizedException;
import com.ppt.papertrade.repository.*;
import com.ppt.papertrade.security.JwtTokenProvider;
import com.ppt.papertrade.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Authentication service implementation handling signup, login, profile updates, and default portfolio provisioning.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final AccountRepository accountRepository;
    private final HoldingRepository holdingRepository;
    private final TradeRepository tradeRepository;
    private final WatchlistRepository watchlistRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .status(UserStatus.ACTIVE)
                .avatarColor("#00d4ff")
                .build();

        user = userRepository.save(user);

        // Automatically provision a default "Main Portfolio" for new users
        BigDecimal defaultCapital = new BigDecimal("1000000.0000");
        Portfolio mainPortfolio = Portfolio.builder()
                .user(user)
                .name("Main Portfolio")
                .description("Primary trading portfolio")
                .initialCapital(defaultCapital)
                .status(PortfolioStatus.ACTIVE)
                .isDefault(true)
                .build();

        mainPortfolio = portfolioRepository.save(mainPortfolio);

        Account account = Account.builder()
                .portfolio(mainPortfolio)
                .cashBalance(defaultCapital)
                .initialBalance(defaultCapital)
                .totalPnl(BigDecimal.ZERO)
                .tradeCount(0)
                .build();

        accountRepository.save(account);
        mainPortfolio.setAccount(account);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        UserResponse userResponse = buildUserResponse(user, defaultCapital, BigDecimal.ZERO, 0, 1, List.of());

        return AuthResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (org.springframework.security.authentication.LockedException | org.springframework.security.authentication.DisabledException e) {
            throw new UnauthorizedException("Account is deactivated. Please contact administrator.");
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw new UnauthorizedException("Invalid credentials");
        } catch (org.springframework.security.core.AuthenticationException e) {
            throw new UnauthorizedException("Authentication failed: " + e.getMessage());
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is deactivated. Please contact administrator.");
        }

        UserResponse userResponse = computeAggregatedUserResponse(user);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return computeAggregatedUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new UnauthorizedException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmailIgnoreCase(newEmail)) {
                    throw new BadRequestException("Email already in use");
                }
                user.setEmail(newEmail);
            }
        }

        if (request.getAvatarColor() != null && !request.getAvatarColor().isBlank()) {
            user.setAvatarColor(request.getAvatarColor());
        }

        // Balance adjustment for default portfolio
        if (request.getBalance() != null) {
            if (request.getBalance().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Balance cannot be negative");
            }
            Portfolio defaultPort = portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                    .orElseGet(() -> {
                        List<Portfolio> list = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
                        return !list.isEmpty() ? list.get(0) : null;
                    });
            if (defaultPort != null) {
                Account acc = defaultPort.getAccount() != null ? defaultPort.getAccount() : accountRepository.findByPortfolioId(defaultPort.getId()).orElse(null);
                if (acc != null) {
                    acc.setCashBalance(request.getBalance());
                    accountRepository.save(acc);
                }
            }
        }

        user = userRepository.save(user);
        return computeAggregatedUserResponse(user);
    }

    @Override
    @Transactional
    public Map<String, Object> resetPortfolio(Long userId, ResetPortfolioRequest request) {
        Portfolio defaultPort = portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseGet(() -> {
                    List<Portfolio> list = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
                    if (list.isEmpty()) throw new BadRequestException("No portfolio found to reset");
                    return list.get(0);
                });

        holdingRepository.deleteAllByPortfolioId(defaultPort.getId());
        tradeRepository.deleteAllByPortfolioId(defaultPort.getId());

        BigDecimal freshBalance = request != null && request.getBalance() != null && request.getBalance().compareTo(BigDecimal.ZERO) > 0
                ? request.getBalance()
                : defaultPort.getInitialCapital();

        defaultPort.setInitialCapital(freshBalance);
        portfolioRepository.save(defaultPort);

        Account account = defaultPort.getAccount() != null ? defaultPort.getAccount() : accountRepository.findByPortfolioId(defaultPort.getId()).orElse(null);
        if (account != null) {
            account.setCashBalance(freshBalance);
            account.setInitialBalance(freshBalance);
            account.setTotalPnl(BigDecimal.ZERO);
            account.setTradeCount(0);
            accountRepository.save(account);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Default portfolio reset successfully");
        result.put("balance", freshBalance);
        return result;
    }

    private UserResponse computeAggregatedUserResponse(User user) {
        List<Account> accounts = accountRepository.findByPortfolioUserId(user.getId());
        BigDecimal totalCash = accounts.stream().map(Account::getCashBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPnl = accounts.stream().map(Account::getTotalPnl).reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalTrades = accounts.stream().mapToInt(Account::getTradeCount).sum();

        List<Portfolio> portfolios = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(user.getId(), PortfolioStatus.ACTIVE);
        List<String> watchlist = watchlistRepository.findByPortfolioUserIdOrderByCreatedAtAsc(user.getId())
                .stream().map(WatchlistItem::getSymbol).distinct().toList();

        return buildUserResponse(user, totalCash, totalPnl, totalTrades, portfolios.size(), watchlist);
    }

    private UserResponse buildUserResponse(
            User user, BigDecimal balance, BigDecimal pnl, int trades, int portfoliosCount, List<String> watchlist
    ) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .balance(balance)
                .status(user.getStatus().name().toLowerCase())
                .trades(trades)
                .pnl(pnl)
                .portfoliosCount(portfoliosCount)
                .watchlist(watchlist)
                .avatarColor(user.getAvatarColor())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
