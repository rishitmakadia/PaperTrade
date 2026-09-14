package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {

    List<Holding> findByPortfolioId(Long portfolioId);

    List<Holding> findByPortfolioIdAndPortfolioUserId(Long portfolioId, Long userId);

    List<Holding> findByPortfolioUserId(Long userId);

    Optional<Holding> findByPortfolioIdAndSymbolIgnoreCase(Long portfolioId, String symbol);

    void deleteAllByPortfolioId(Long portfolioId);
}
