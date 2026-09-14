package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Holding (open position) of a portfolio in a particular stock.
 * Stores quantity and weighted average buy price.
 */
@Entity
@Table(
    name = "holdings",
    uniqueConstraints = @UniqueConstraint(name = "uq_holdings_portfolio_symbol", columnNames = {"portfolio_id", "symbol"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(nullable = false, length = 30)
    private String symbol;

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "average_buy_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal averageBuyPrice;

    @Column(length = 50)
    @Builder.Default
    private String sector = "";

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
