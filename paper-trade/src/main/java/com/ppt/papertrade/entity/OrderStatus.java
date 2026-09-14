package com.ppt.papertrade.entity;

/**
 * Lifecycle status of an order.
 */
public enum OrderStatus {
    EXECUTED,
    PENDING,
    CANCELLED;

    public static OrderStatus fromString(String str) {
        if (str == null) return EXECUTED;
        try {
            return OrderStatus.valueOf(str.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return EXECUTED;
        }
    }
}
