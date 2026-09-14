package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.request.CreateAlertRequest;
import com.ppt.papertrade.dto.response.PriceAlertResponse;
import com.ppt.papertrade.entity.AlertCondition;
import com.ppt.papertrade.entity.Portfolio;
import com.ppt.papertrade.entity.PortfolioStatus;
import com.ppt.papertrade.entity.PriceAlert;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.exception.ResourceNotFoundException;
import com.ppt.papertrade.exception.UnauthorizedException;
import com.ppt.papertrade.repository.PortfolioRepository;
import com.ppt.papertrade.repository.PriceAlertRepository;
import com.ppt.papertrade.service.PriceAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceAlertServiceImpl implements PriceAlertService {

    private final PriceAlertRepository priceAlertRepository;
    private final PortfolioRepository portfolioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PriceAlertResponse> getPortfolioAlerts(Long userId, Long portfolioId) {
        validatePortfolio(userId, portfolioId);
        return priceAlertRepository.findByPortfolioIdOrderByCreatedAtDesc(portfolioId)
                .stream().map(this::mapToPriceAlertResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PriceAlertResponse> getUserAlerts(Long userId) {
        return priceAlertRepository.findByPortfolioUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToPriceAlertResponse).toList();
    }

    @Override
    @Transactional
    public PriceAlertResponse createPortfolioAlert(Long userId, Long portfolioId, CreateAlertRequest request) {
        Portfolio portfolio = validatePortfolio(userId, portfolioId);

        String symbol = request.getSymbol().trim().toUpperCase();
        AlertCondition condition = AlertCondition.fromString(request.getCondition());

        PriceAlert alert = PriceAlert.builder()
                .portfolio(portfolio)
                .symbol(symbol)
                .companyName(request.getName() != null ? request.getName() : symbol)
                .targetPrice(request.getTargetPrice().setScale(2, RoundingMode.HALF_UP))
                .condition(condition)
                .active(true)
                .triggered(false)
                .build();

        alert = priceAlertRepository.save(alert);
        return mapToPriceAlertResponse(alert);
    }

    @Override
    @Transactional
    public PriceAlertResponse createAlert(Long userId, CreateAlertRequest request) {
        Long portfolioId = request.getPortfolioId();
        if (portfolioId == null) {
            portfolioId = getDefaultPortfolioId(userId);
        }
        return createPortfolioAlert(userId, portfolioId, request);
    }

    @Override
    @Transactional
    public void deleteAlert(Long userId, Long alertId) {
        priceAlertRepository.deleteByIdAndPortfolioUserId(alertId, userId);
    }

    @Override
    @Transactional
    public PriceAlertResponse resetAlert(Long userId, Long alertId) {
        PriceAlert alert = priceAlertRepository.findByIdAndPortfolioUserId(alertId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + alertId));

        alert.setTriggered(false);
        alert.setTriggeredAt(null);
        alert.setTriggeredPrice(null);
        alert.setActive(true);

        alert = priceAlertRepository.save(alert);
        return mapToPriceAlertResponse(alert);
    }

    private Portfolio validatePortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own portfolio " + portfolioId);
        }
        return portfolio;
    }

    private Long getDefaultPortfolioId(Long userId) {
        return portfolioRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(Portfolio::getId)
                .orElseGet(() -> {
                    List<Portfolio> list = portfolioRepository.findByUserIdAndStatusOrderByCreatedAtAsc(userId, PortfolioStatus.ACTIVE);
                    if (list.isEmpty()) throw new BadRequestException("No active portfolio found for user: " + userId);
                    return list.get(0).getId();
                });
    }

    private PriceAlertResponse mapToPriceAlertResponse(PriceAlert a) {
        return PriceAlertResponse.builder()
                .id(a.getId())
                .portfolioId(a.getPortfolio().getId())
                .portfolioName(a.getPortfolio().getName())
                .symbol(a.getSymbol())
                .name(a.getCompanyName())
                .targetPrice(a.getTargetPrice())
                .condition(a.getCondition().name().toLowerCase())
                .active(a.getActive())
                .triggered(a.getTriggered())
                .triggeredAt(a.getTriggeredAt())
                .triggeredPrice(a.getTriggeredPrice())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
