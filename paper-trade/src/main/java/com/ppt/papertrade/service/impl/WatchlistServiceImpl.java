package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.entity.Portfolio;
import com.ppt.papertrade.entity.PortfolioStatus;
import com.ppt.papertrade.entity.WatchlistItem;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.ResourceNotFoundException;
import com.ppt.papertrade.exception.UnauthorizedException;
import com.ppt.papertrade.repository.PortfolioRepository;
import com.ppt.papertrade.repository.WatchlistRepository;
import com.ppt.papertrade.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatchlistServiceImpl implements WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final PortfolioRepository portfolioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<String> getPortfolioWatchlist(Long userId, Long portfolioId) {
        validatePortfolio(userId, portfolioId);
        return watchlistRepository.findByPortfolioIdOrderByCreatedAtAsc(portfolioId)
                .stream().map(WatchlistItem::getSymbol).toList();
    }

    @Override
    @Transactional
    public List<String> addToPortfolioWatchlist(Long userId, Long portfolioId, String symbol) {
        Portfolio portfolio = validatePortfolio(userId, portfolioId);
        String sym = symbol.trim().toUpperCase();

        if (!watchlistRepository.existsByPortfolioIdAndSymbolIgnoreCase(portfolioId, sym)) {
            WatchlistItem item = WatchlistItem.builder()
                    .portfolio(portfolio)
                    .symbol(sym)
                    .build();
            watchlistRepository.save(item);
        }

        return getPortfolioWatchlist(userId, portfolioId);
    }

    @Override
    @Transactional
    public List<String> removeFromPortfolioWatchlist(Long userId, Long portfolioId, String symbol) {
        validatePortfolio(userId, portfolioId);
        watchlistRepository.deleteByPortfolioIdAndSymbolIgnoreCase(portfolioId, symbol.trim().toUpperCase());
        return getPortfolioWatchlist(userId, portfolioId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getWatchlist(Long userId) {
        Long defaultPortId = getDefaultPortfolioId(userId);
        return getPortfolioWatchlist(userId, defaultPortId);
    }

    @Override
    @Transactional
    public List<String> addToWatchlist(Long userId, String symbol) {
        Long defaultPortId = getDefaultPortfolioId(userId);
        return addToPortfolioWatchlist(userId, defaultPortId, symbol);
    }

    @Override
    @Transactional
    public List<String> removeFromWatchlist(Long userId, String symbol) {
        Long defaultPortId = getDefaultPortfolioId(userId);
        return removeFromPortfolioWatchlist(userId, defaultPortId, symbol);
    }

    private Portfolio validatePortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own portfolio " + portfolioId);
        }
        return portfolio;
    }

    private Long getDefaultPortfolioId(Long userId) {
        return portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(Portfolio::getId)
                .orElseGet(() -> {
                    List<Portfolio> list = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
                    if (list.isEmpty()) throw new BadRequestException("No active portfolio found for user: " + userId);
                    return list.get(0).getId();
                });
    }
}
