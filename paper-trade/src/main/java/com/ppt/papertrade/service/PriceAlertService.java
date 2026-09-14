package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.CreateAlertRequest;
import com.ppt.papertrade.dto.response.PriceAlertResponse;

import java.util.List;

/**
 * Service interface for price alerts management scoped to portfolio.
 */
public interface PriceAlertService {

    List<PriceAlertResponse> getPortfolioAlerts(Long userId, Long portfolioId);

    List<PriceAlertResponse> getUserAlerts(Long userId);

    PriceAlertResponse createPortfolioAlert(Long userId, Long portfolioId, CreateAlertRequest request);

    PriceAlertResponse createAlert(Long userId, CreateAlertRequest request);

    void deleteAlert(Long userId, Long alertId);

    PriceAlertResponse resetAlert(Long userId, Long alertId);
}
