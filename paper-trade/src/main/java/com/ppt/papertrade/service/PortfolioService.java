package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.CreatePortfolioRequest;
import com.ppt.papertrade.dto.request.UpdatePortfolioRequest;
import com.ppt.papertrade.dto.response.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Service interface for first-class portfolio management and accounting.
 */
public interface PortfolioService {

    PortfolioResponse createPortfolio(Long userId, CreatePortfolioRequest request);

    List<PortfolioSummaryResponse> getUserPortfolios(Long userId);

    PortfolioResponse getPortfolioDetail(Long userId, Long portfolioId);

    PortfolioResponse updatePortfolio(Long userId, Long portfolioId, UpdatePortfolioRequest request);

    void deletePortfolio(Long userId, Long portfolioId);

    List<HoldingResponse> getPortfolioPositions(Long userId, Long portfolioId);

    List<EquityPointResponse> getPortfolioEquityCurve(Long userId, Long portfolioId, int requestedDays);

    PortfolioStatsResponse getPortfolioStats(Long userId, Long portfolioId);

    PortfolioPerformanceResponse getPortfolioPerformance(Long userId, Long portfolioId, int requestedDays);

    Map<String, Object> resetPortfolio(Long userId, Long portfolioId, BigDecimal customBalance);
}
