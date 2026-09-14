package com.ppt.papertrade.entity;

/**
 * Directional condition for price alerts.
 * ABOVE: triggers when market price >= targetPrice.
 * BELOW: triggers when market price <= targetPrice.
 */
public enum AlertCondition {
    ABOVE,
    BELOW;

    public static AlertCondition fromString(String str) {
        if (str == null) return ABOVE;
        try {
            return AlertCondition.valueOf(str.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ABOVE;
        }
    }
}
