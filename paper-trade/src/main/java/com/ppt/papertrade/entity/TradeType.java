package com.ppt.papertrade.entity;

/**
 * Type of trading transaction.
 * BUY: acquire shares and decrease cash balance.
 * SELL: liquidate shares, calculate realized P&L, and increase cash balance.
 */
public enum TradeType {
    BUY,
    SELL;

    public static TradeType fromString(String str) {
        if (str == null) return BUY;
        try {
            return TradeType.valueOf(str.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return BUY;
        }
    }
}
