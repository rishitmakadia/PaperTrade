package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.ExecuteTradeRequest;
import com.ppt.papertrade.dto.response.ExecuteTradeResponse;
import com.ppt.papertrade.dto.response.TradeResponse;

import java.util.List;

/**
 * Service interface for transactional trade execution, order history, and CSV export scoped by portfolio.
 */
public interface TradeService {

    ExecuteTradeResponse executeTrade(Long userId, ExecuteTradeRequest request);

    ExecuteTradeResponse executePortfolioTrade(Long userId, Long portfolioId, ExecuteTradeRequest request);

    List<TradeResponse> getPortfolioTrades(Long userId, Long portfolioId);

    List<TradeResponse> getPortfolioStockTrades(Long userId, Long portfolioId, String symbol);

    List<TradeResponse> getUserTrades(Long userId);

    String exportPortfolioTradesCsv(Long userId, Long portfolioId);

    String exportTradesCsv(Long userId);
}
