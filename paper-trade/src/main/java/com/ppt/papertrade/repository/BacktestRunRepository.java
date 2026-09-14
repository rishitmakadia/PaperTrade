package com.ppt.papertrade.repository;

import com.ppt.papertrade.entity.BacktestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BacktestRunRepository extends JpaRepository<BacktestRun, Long> {

    List<BacktestRun> findByUserIdOrderByCreatedAtDesc(Long userId);
}
