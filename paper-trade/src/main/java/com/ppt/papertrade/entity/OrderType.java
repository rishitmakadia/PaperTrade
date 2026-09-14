package com.ppt.papertrade.entity;

/**
 * Execution order type (e.g. MARKET or LIMIT).
 */
public enum OrderType {
    MARKET,
    LIMIT;

    public static OrderType fromString(String str) {
        if (str == null) return MARKET;
        try {
            return OrderType.valueOf(str.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return MARKET;
        }
    }
}
