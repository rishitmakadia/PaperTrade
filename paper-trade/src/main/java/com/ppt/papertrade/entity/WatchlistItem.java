package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Watchlist item mapping a stock symbol to a specific portfolio.
 */
@Entity
@Table(
    name = "watchlists",
    uniqueConstraints = @UniqueConstraint(name = "uq_watchlists_portfolio_symbol", columnNames = {"portfolio_id", "symbol"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(nullable = false, length = 30)
    private String symbol;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
