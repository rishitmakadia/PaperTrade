package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.request.AdminUpdateUserRequest;
import com.ppt.papertrade.dto.request.UpdateUserStatusRequest;
import com.ppt.papertrade.dto.response.AdminStatsResponse;
import com.ppt.papertrade.dto.response.AdminTradeResponse;
import com.ppt.papertrade.dto.response.UserResponse;
import com.ppt.papertrade.entity.*;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.ResourceNotFoundException;
import com.ppt.papertrade.repository.AccountRepository;
import com.ppt.papertrade.repository.PortfolioRepository;
import com.ppt.papertrade.repository.TradeRepository;
import com.ppt.papertrade.repository.UserRepository;
import com.ppt.papertrade.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final TradeRepository tradeRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getPlatformStats() {
        long totalUsers = userRepository.countByRole(Role.USER);
        long activeUsers = userRepository.countByRoleAndStatus(Role.USER, UserStatus.ACTIVE);
        long totalPortfolios = portfolioRepository.count();
        long totalTrades = tradeRepository.count();
        BigDecimal totalVolume = tradeRepository.sumTotalVolume().setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalPlatformCapital = portfolioRepository.findAll().stream()
                .map(Portfolio::getInitialCapital)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        LocalDate firstOfMonth = LocalDate.now(ZoneId.of("Asia/Kolkata")).withDayOfMonth(1);
        long newUsersThisMonth = userRepository.countByRoleAndCreatedAtGreaterThanEqual(
                Role.USER, firstOfMonth.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant()
        );

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalPortfolios(totalPortfolios)
                .totalTrades(totalTrades)
                .totalVolume(totalVolume)
                .totalPlatformCapital(totalPlatformCapital)
                .newUsersThisMonth(newUsersThisMonth)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();
        return users.stream().map(this::mapToUserResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserStatus newStatus = UserStatus.fromString(request.getStatus());
        user.setStatus(newStatus);
        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmailIgnoreCase(newEmail)) {
                throw new BadRequestException("Email address is already in use by another account: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        user.setName(request.getName().trim());

        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(Role.valueOf(request.getRole().trim().toUpperCase()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(UserStatus.fromString(request.getStatus()));
        }

        if (request.getAvatarColor() != null && !request.getAvatarColor().isBlank()) {
            user.setAvatarColor(request.getAvatarColor().trim());
        }

        user = userRepository.save(user);

        // Balance adjustment if provided
        if (request.getBalance() != null) {
            Portfolio defaultPortfolio = portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                    .orElseGet(() -> {
                        List<Portfolio> list = portfolioRepository.findByUserIdOrderByCreatedAtAsc(userId);
                        return list.isEmpty() ? null : list.get(0);
                    });

            if (defaultPortfolio != null) {
                Account account = accountRepository.findByPortfolioId(defaultPortfolio.getId()).orElse(null);
                if (account != null) {
                    account.setCashBalance(request.getBalance());
                    accountRepository.save(account);
                }
            }
        }

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId, Long currentAdminId) {
        if (userId.equals(currentAdminId)) {
            throw new BadRequestException("You cannot delete your own active administrator account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.warn("🗑 Admin {} permanently deleting user account id={}, email={}", currentAdminId, user.getId(), user.getEmail());
        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminTradeResponse> getAllTrades() {
        List<Trade> trades = tradeRepository.findAllWithPortfolioAndUserOrderByCreatedAtDesc();
        return trades.stream().map(t -> AdminTradeResponse.builder()
                .id(t.getId())
                .userId(AdminTradeResponse.UserSummary.builder()
                        .id(t.getPortfolio().getUser().getId())
                        .name(t.getPortfolio().getUser().getName())
                        .email(t.getPortfolio().getUser().getEmail())
                        .build())
                .portfolioId(t.getPortfolio().getId())
                .portfolioName(t.getPortfolio().getName())
                .symbol(t.getSymbol())
                .name(t.getCompanyName())
                .type(t.getTradeType().name())
                .qty(t.getQuantity())
                .price(t.getExecutionPrice().setScale(2, RoundingMode.HALF_UP))
                .total(t.getTotalValue().setScale(2, RoundingMode.HALF_UP))
                .realizedPnl(t.getRealizedPnl() != null ? t.getRealizedPnl().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .status(t.getStatus().name())
                .orderType(t.getOrderType().name())
                .createdAt(t.getCreatedAt())
                .build()
        ).toList();
    }

    private UserResponse mapToUserResponse(User user) {
        List<Account> accounts = accountRepository.findByPortfolioUserId(user.getId());
        BigDecimal balance = accounts.stream().map(Account::getCashBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pnl = accounts.stream().map(Account::getTotalPnl).reduce(BigDecimal.ZERO, BigDecimal::add);
        int trades = accounts.stream().mapToInt(Account::getTradeCount).sum();
        long portCount = portfolioRepository.countByUserIdAndStatus(user.getId(), PortfolioStatus.ACTIVE);

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .balance(balance.setScale(2, RoundingMode.HALF_UP))
                .status(user.getStatus().name().toLowerCase())
                .trades(trades)
                .pnl(pnl.setScale(2, RoundingMode.HALF_UP))
                .portfoliosCount((int) portCount)
                .avatarColor(user.getAvatarColor())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
