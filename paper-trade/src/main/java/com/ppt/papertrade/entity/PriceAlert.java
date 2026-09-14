package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Price Alert entity for tracking price trigger thresholds for a portfolio.
 */
@Entity
@Table(name = "price_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlert {

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

    @Column(name = "target_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal targetPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AlertCondition condition;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean triggered = false;

    @Column(name = "triggered_at")
    private Instant triggeredAt;

    @Column(name = "triggered_price", precision = 19, scale = 4)
    private BigDecimal triggeredPrice;

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
