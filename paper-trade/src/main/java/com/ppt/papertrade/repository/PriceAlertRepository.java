package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.PriceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceAlertRepository extends JpaRepository<PriceAlert, Long> {

    List<PriceAlert> findByPortfolioIdOrderByCreatedAtDesc(Long portfolioId);

    List<PriceAlert> findByPortfolioUserIdOrderByCreatedAtDesc(Long userId);

    List<PriceAlert> findByPortfolioIdAndSymbolIgnoreCaseAndActiveTrueAndTriggeredFalse(Long portfolioId, String symbol);

    List<PriceAlert> findByActiveTrueAndTriggeredFalse();

    Optional<PriceAlert> findByIdAndPortfolioUserId(Long id, Long userId);

    Optional<PriceAlert> findByIdAndPortfolioId(Long id, Long portfolioId);

    void deleteByIdAndPortfolioUserId(Long id, Long userId);

    void deleteByIdAndPortfolioId(Long id, Long portfolioId);

    void deleteAllByPortfolioId(Long portfolioId);
}
