package com.ppt.papertrade.entity;

public enum PortfolioStatus {
    ACTIVE,
    ARCHIVED;

    public static PortfolioStatus fromString(String val) {
        if (val == null) return ACTIVE;
        for (PortfolioStatus s : values()) {
            if (s.name().equalsIgnoreCase(val.trim())) return s;
        }
        return ACTIVE;
    }
}
