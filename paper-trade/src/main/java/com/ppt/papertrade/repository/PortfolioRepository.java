package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.Portfolio;
import com.ppt.papertrade.entity.PortfolioStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findByUserIdAndStatusOrderByCreatedAtAsc(Long userId, PortfolioStatus status);

    List<Portfolio> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Portfolio> findByIdAndUserId(Long id, Long userId);

    Optional<Portfolio> findByUserIdAndIsDefaultTrue(Long userId);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    long countByUserIdAndStatus(Long userId, PortfolioStatus status);

    @Query("SELECT p FROM Portfolio p JOIN FETCH p.user u WHERE p.status = 'ACTIVE' ORDER BY p.createdAt DESC")
    List<Portfolio> findAllActiveWithUser();
}
