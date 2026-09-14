package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Account entity holding virtual funds, total realized P&L, and trade statistics for a specific Portfolio.
 * Uses BigDecimal for financial accuracy.
 */
@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false, unique = true)
    private Portfolio portfolio;

    @Column(name = "cash_balance", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal cashBalance = new BigDecimal("1000000.0000");

    @Column(name = "initial_balance", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal initialBalance = new BigDecimal("1000000.0000");

    @Column(name = "total_pnl", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal totalPnl = BigDecimal.ZERO;

    @Column(name = "trade_count", nullable = false)
    @Builder.Default
    private Integer tradeCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
