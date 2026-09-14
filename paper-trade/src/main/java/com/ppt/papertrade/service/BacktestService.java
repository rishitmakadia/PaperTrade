package com.ppt.papertrade.service;

import com.ppt.papertrade.dto.request.BacktestRequest;
import com.ppt.papertrade.dto.response.BacktestResultResponse;

/**
 * Service interface for algorithmic strategy backtesting on historical market data.
 */
public interface BacktestService {

    BacktestResultResponse runBacktest(Long userId, BacktestRequest request);
}
