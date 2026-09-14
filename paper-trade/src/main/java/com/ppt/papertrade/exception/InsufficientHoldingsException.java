package com.ppt.papertrade.exception;

public class InsufficientHoldingsException extends RuntimeException {
    public InsufficientHoldingsException(String message) {
        super(message);
    }
}
