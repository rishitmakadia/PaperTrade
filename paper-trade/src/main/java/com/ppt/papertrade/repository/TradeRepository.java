package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.OrderStatus;
import com.ppt.papertrade.entity.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {

    List<Trade> findByPortfolioIdOrderByCreatedAtDesc(Long portfolioId);

    List<Trade> findByPortfolioIdAndSymbolIgnoreCaseOrderByCreatedAtDesc(Long portfolioId, String symbol);

    List<Trade> findByPortfolioUserIdOrderByCreatedAtDesc(Long userId);

    List<Trade> findByPortfolioIdAndStatusOrderByCreatedAtAsc(Long portfolioId, OrderStatus status);

    List<Trade> findByPortfolioIdAndStatusAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
            Long portfolioId, OrderStatus status, Instant from
    );

    List<Trade> findByPortfolioUserIdAndStatusAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
            Long userId, OrderStatus status, Instant from
    );

    long countByPortfolioIdAndStatus(Long portfolioId, OrderStatus status);

    long countByPortfolioUserIdAndStatus(Long userId, OrderStatus status);

    void deleteAllByPortfolioId(Long portfolioId);

    @Query("SELECT COALESCE(SUM(t.totalValue), 0) FROM Trade t WHERE t.status = 'EXECUTED'")
    BigDecimal sumTotalVolume();

    @Query("SELECT t FROM Trade t JOIN FETCH t.portfolio p JOIN FETCH p.user u ORDER BY t.createdAt DESC")
    List<Trade> findAllWithPortfolioAndUserOrderByCreatedAtDesc();
}
