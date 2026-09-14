package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Immutable historical trade record linked to a specific Portfolio.
 */
@Entity
@Table(name = "trades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trade {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false, length = 10)
    private TradeType tradeType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "execution_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal executionPrice;

    @Column(name = "total_value", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalValue;

    @Column(name = "realized_pnl", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal realizedPnl = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.EXECUTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    @Builder.Default
    private OrderType orderType = OrderType.MARKET;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.executedAt == null) {
            this.executedAt = now;
        }
        this.createdAt = now;
    }
}
