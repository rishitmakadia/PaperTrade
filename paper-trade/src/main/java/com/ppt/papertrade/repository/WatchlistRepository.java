package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistRepository extends JpaRepository<WatchlistItem, Long> {

    List<WatchlistItem> findByPortfolioIdOrderByCreatedAtAsc(Long portfolioId);

    List<WatchlistItem> findByPortfolioUserIdOrderByCreatedAtAsc(Long userId);

    Optional<WatchlistItem> findByPortfolioIdAndSymbolIgnoreCase(Long portfolioId, String symbol);

    boolean existsByPortfolioIdAndSymbolIgnoreCase(Long portfolioId, String symbol);

    void deleteByPortfolioIdAndSymbolIgnoreCase(Long portfolioId, String symbol);

    void deleteAllByPortfolioId(Long portfolioId);
}
