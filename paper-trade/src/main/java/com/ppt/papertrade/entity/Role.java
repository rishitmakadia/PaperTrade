package com.ppt.papertrade.entity;

/**
 * System roles for authorization.
 * USER: standard trading access.
 * ADMIN: access to admin dashboard, user management, and platform analytics.
 */
public enum Role {
    USER,
    ADMIN;

    public static Role fromString(String roleStr) {
        if (roleStr == null) return USER;
        try {
            return Role.valueOf(roleStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return USER;
        }
    }
}
