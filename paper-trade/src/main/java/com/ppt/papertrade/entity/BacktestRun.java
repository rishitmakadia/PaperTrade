package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * BacktestRun entity logging simulation runs and performance metrics.
 */
@Entity
@Table(name = "backtest_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BacktestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 30)
    private String symbol;

    @Column(nullable = false, length = 50)
    private String strategy;

    @Column(length = 100)
    private String period;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal capital;

    @Column(name = "total_return", precision = 10, scale = 4)
    private BigDecimal totalReturn;

    @Column(name = "win_rate", precision = 10, scale = 4)
    private BigDecimal winRate;

    @Column(name = "max_drawdown", precision = 10, scale = 4)
    private BigDecimal maxDrawdown;

    @Column(name = "sharpe_ratio", precision = 10, scale = 4)
    private BigDecimal sharpeRatio;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
