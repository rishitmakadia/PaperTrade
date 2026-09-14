package com.ppt.papertrade.service;

import java.util.List;

/**
 * Service interface for managing portfolio-scoped watchlists.
 */
public interface WatchlistService {

    List<String> getPortfolioWatchlist(Long userId, Long portfolioId);

    List<String> addToPortfolioWatchlist(Long userId, Long portfolioId, String symbol);

    List<String> removeFromPortfolioWatchlist(Long userId, Long portfolioId, String symbol);

    List<String> getWatchlist(Long userId);

    List<String> addToWatchlist(Long userId, String symbol);

    List<String> removeFromWatchlist(Long userId, String symbol);
}
