package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findBySymbolIgnoreCase(String symbol);

    boolean existsBySymbolIgnoreCase(String symbol);

    List<Stock> findByActiveTrueOrderBySymbolAsc();
}
