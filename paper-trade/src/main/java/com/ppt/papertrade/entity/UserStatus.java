package com.ppt.papertrade.entity;

/**
 * Account active/inactive status.
 * Inactive users cannot execute trades or modify their portfolio.
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE;

    public static UserStatus fromString(String statusStr) {
        if (statusStr == null) return ACTIVE;
        try {
            return UserStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ACTIVE;
        }
    }
}
