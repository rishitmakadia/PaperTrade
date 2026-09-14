package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByPortfolioId(Long portfolioId);

    Optional<Account> findByPortfolioIdAndPortfolioUserId(Long portfolioId, Long userId);

    List<Account> findByPortfolioUserId(Long userId);
}
