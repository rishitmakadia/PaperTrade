package com.ppt.papertrade.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Stock entity representing tradeable equities (e.g. NSE stocks).
 */
@Entity
@Table(name = "stocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String symbol;

    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String exchange = "NSE";

    @Column(length = 50)
    @Builder.Default
    private String sector = "Other";

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

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
