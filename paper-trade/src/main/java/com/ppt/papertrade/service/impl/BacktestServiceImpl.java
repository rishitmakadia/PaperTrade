package com.ppt.papertrade.service.impl;

import com.ppt.papertrade.dto.request.BacktestRequest;
import com.ppt.papertrade.dto.response.BacktestResultResponse;
import com.ppt.papertrade.dto.response.BacktestTradeResponse;
import com.ppt.papertrade.dto.response.CandleResponse;
import com.ppt.papertrade.entity.BacktestRun;
import com.ppt.papertrade.entity.TradeType;
import com.ppt.papertrade.entity.User;
import com.ppt.papertrade.exception.BadRequestException;
import com.ppt.papertrade.marketdata.MarketDataService;
import com.ppt.papertrade.repository.BacktestRunRepository;
import com.ppt.papertrade.repository.UserRepository;
import com.ppt.papertrade.service.BacktestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Strategy backtesting engine supporting SMA, EMA, RSI, MACD, Bollinger Bands, and Support & Resistance.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BacktestServiceImpl implements BacktestService {

    private final MarketDataService marketDataService;
    private final BacktestRunRepository backtestRunRepository;
    private final UserRepository userRepository;

    private static final List<String> VALID_STRATEGIES = Arrays.asList(
            "SMA", "EMA", "RSI", "MACD", "BOLLINGER", "S&R"
    );

    @Override
    public BacktestResultResponse runBacktest(Long userId, BacktestRequest request) {
        String symbol = request.getSymbol().trim().toUpperCase();
        String strategy = request.getStrategy().trim().toUpperCase();

        if (!VALID_STRATEGIES.contains(strategy)) {
            throw new BadRequestException("Invalid strategy: " + strategy + ". Valid options: " + String.join(", ", VALID_STRATEGIES));
        }

        LocalDate start = request.getStartDate() != null && !request.getStartDate().isBlank()
                ? LocalDate.parse(request.getStartDate())
                : LocalDate.now().minusYears(1);

        LocalDate end = request.getEndDate() != null && !request.getEndDate().isBlank()
                ? LocalDate.parse(request.getEndDate())
                : LocalDate.now();

        List<CandleResponse> candles = marketDataService.getHistoricalCandlesBetween(symbol, start, end);
        if (candles == null || candles.isEmpty()) {
            throw new BadRequestException("No historical candle data available for symbol: " + symbol);
        }

        List<Signal> signals = switch (strategy) {
            case "SMA" -> generateSmaSignals(candles);
            case "EMA" -> generateEmaSignals(candles);
            case "RSI" -> generateRsiSignals(candles);
            case "MACD" -> generateMacdSignals(candles);
            case "BOLLINGER" -> generateBollingerSignals(candles);
            case "S&R" -> generateSupportResistanceSignals(candles);
            default -> generateSmaSignals(candles);
        };

        BigDecimal initialCapital = request.getCapital() != null && request.getCapital().compareTo(BigDecimal.ZERO) > 0
                ? request.getCapital().setScale(2, RoundingMode.HALF_UP)
                : new BigDecimal("100000.00");

        SimulationResult sim = simulateExecution(signals, candles, initialCapital);

        // Record backtest run if authenticated user
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                BacktestRun run = BacktestRun.builder()
                        .user(user)
                        .symbol(symbol)
                        .strategy(strategy)
                        .period(start + " to " + end)
                        .capital(initialCapital)
                        .totalReturn(sim.totalReturn)
                        .winRate(sim.winRate)
                        .maxDrawdown(sim.maxDrawdown)
                        .sharpeRatio(sim.sharpeRatio)
                        .build();
                backtestRunRepository.save(run);
            });
        }

        return BacktestResultResponse.builder()
                .symbol(symbol)
                .strategy(strategy)
                .period(start + " to " + end)
                .candles(candles.size())
                .signals(signals.size())
                .capital(initialCapital)
                .totalReturn(sim.totalReturn)
                .winRate(sim.winRate)
                .maxDrawdown(sim.maxDrawdown)
                .sharpeRatio(sim.sharpeRatio)
                .finalCapital(sim.finalCapital)
                .trades(sim.trades)
                .build();
    }

    private static record Signal(int index, TradeType type, BigDecimal price) {}

    private static class SimulationResult {
        BigDecimal totalReturn;
        BigDecimal winRate;
        BigDecimal maxDrawdown;
        BigDecimal sharpeRatio;
        BigDecimal finalCapital;
        List<BacktestTradeResponse> trades;
    }

    private static class PositionHold {
        BigDecimal entryPrice;
        int entryIndex;
        int quantity;

        PositionHold(BigDecimal entryPrice, int entryIndex, int quantity) {
            this.entryPrice = entryPrice;
            this.entryIndex = entryIndex;
            this.quantity = quantity;
        }
    }

    private SimulationResult simulateExecution(List<Signal> signals, List<CandleResponse> candles, BigDecimal initialCapital) {
        List<BacktestTradeResponse> trades = new ArrayList<>();
        BigDecimal cash = initialCapital;
        PositionHold currentPosition = null;

        List<BigDecimal> portfolioHistory = new ArrayList<>();
        portfolioHistory.add(initialCapital);

        for (Signal signal : signals) {
            if (signal.type == TradeType.BUY && currentPosition == null && cash.compareTo(BigDecimal.ZERO) > 0) {
                // Use 95% of available cash
                BigDecimal allocatable = cash.multiply(new BigDecimal("0.95"));
                int qty = allocatable.divide(signal.price, 0, RoundingMode.FLOOR).intValue();
                if (qty > 0) {
                    BigDecimal cost = signal.price.multiply(BigDecimal.valueOf(qty));
                    cash = cash.subtract(cost);
                    currentPosition = new PositionHold(signal.price, signal.index, qty);
                }
            } else if (signal.type == TradeType.SELL && currentPosition != null) {
                BigDecimal proceeds = signal.price.multiply(BigDecimal.valueOf(currentPosition.quantity));
                cash = cash.add(proceeds);

                BigDecimal invested = currentPosition.entryPrice.multiply(BigDecimal.valueOf(currentPosition.quantity));
                BigDecimal pnl = proceeds.subtract(invested).setScale(2, RoundingMode.HALF_UP);
                BigDecimal pnlPercent = invested.compareTo(BigDecimal.ZERO) > 0
                        ? pnl.divide(invested, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                trades.add(BacktestTradeResponse.builder()
                        .entryPrice(currentPosition.entryPrice)
                        .entryIndex(currentPosition.entryIndex)
                        .exitPrice(signal.price)
                        .exitIndex(signal.index)
                        .quantity(currentPosition.quantity)
                        .pnl(pnl)
                        .pnlPercent(pnlPercent)
                        .build());

                currentPosition = null;
            }

            BigDecimal currentPrice = candles.get(signal.index).getClose();
            BigDecimal positionVal = currentPosition != null
                    ? currentPrice.multiply(BigDecimal.valueOf(currentPosition.quantity))
                    : BigDecimal.ZERO;
            portfolioHistory.add(cash.add(positionVal));
        }

        // Close any remaining position at last candle close
        if (currentPosition != null && !candles.isEmpty()) {
            BigDecimal lastClose = candles.get(candles.size() - 1).getClose();
            BigDecimal proceeds = lastClose.multiply(BigDecimal.valueOf(currentPosition.quantity));
            cash = cash.add(proceeds);

            BigDecimal invested = currentPosition.entryPrice.multiply(BigDecimal.valueOf(currentPosition.quantity));
            BigDecimal pnl = proceeds.subtract(invested).setScale(2, RoundingMode.HALF_UP);
            BigDecimal pnlPercent = invested.compareTo(BigDecimal.ZERO) > 0
                    ? pnl.divide(invested, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            trades.add(BacktestTradeResponse.builder()
                    .entryPrice(currentPosition.entryPrice)
                    .entryIndex(currentPosition.entryIndex)
                    .exitPrice(lastClose)
                    .exitIndex(candles.size() - 1)
                    .quantity(currentPosition.quantity)
                    .pnl(pnl)
                    .pnlPercent(pnlPercent)
                    .build());
        }

        BigDecimal finalCapital = cash.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalReturn = initialCapital.compareTo(BigDecimal.ZERO) > 0
                ? finalCapital.subtract(initialCapital).divide(initialCapital, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long winCount = trades.stream().filter(t -> t.getPnl().compareTo(BigDecimal.ZERO) > 0).count();
        BigDecimal winRate = !trades.isEmpty()
                ? BigDecimal.valueOf(winCount).divide(BigDecimal.valueOf(trades.size()), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Max Drawdown calculation
        double peak = portfolioHistory.get(0).doubleValue();
        double maxDrawdown = 0.0;
        for (BigDecimal val : portfolioHistory) {
            double v = val.doubleValue();
            if (v > peak) peak = v;
            if (peak > 0) {
                double dd = ((peak - v) / peak) * 100.0;
                if (dd > maxDrawdown) maxDrawdown = dd;
            }
        }

        // Sharpe Ratio (simplified annualized standard deviation of trade returns)
        double sharpeRatio = 0.0;
        if (portfolioHistory.size() > 1) {
            List<Double> returns = new ArrayList<>();
            for (int i = 1; i < portfolioHistory.size(); i++) {
                double prev = portfolioHistory.get(i - 1).doubleValue();
                double curr = portfolioHistory.get(i).doubleValue();
                if (prev > 0) returns.add((curr - prev) / prev);
            }
            if (!returns.isEmpty()) {
                double avgReturn = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                double variance = returns.stream().mapToDouble(r -> Math.pow(r - avgReturn, 2)).average().orElse(0.0);
                double stdDev = Math.sqrt(variance);
                if (stdDev > 0) {
                    sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252);
                }
            }
        }

        SimulationResult result = new SimulationResult();
        result.finalCapital = finalCapital;
        result.totalReturn = totalReturn;
        result.winRate = winRate;
        result.maxDrawdown = BigDecimal.valueOf(maxDrawdown).setScale(2, RoundingMode.HALF_UP);
        result.sharpeRatio = BigDecimal.valueOf(sharpeRatio).setScale(2, RoundingMode.HALF_UP);
        result.trades = trades;

        return result;
    }

    // ── Technical Indicator Helpers ──────────────────────────────────────────

    private List<Signal> generateSmaSignals(List<CandleResponse> candles) {
        List<Signal> signals = new ArrayList<>();
        List<Double> closes = candles.stream().map(c -> c.getClose().doubleValue()).toList();

        for (int i = 50; i < closes.size(); i++) {
            Double fastSMA = calculateSMA(closes.subList(0, i + 1), 20);
            Double slowSMA = calculateSMA(closes.subList(0, i + 1), 50);
            Double prevFastSMA = calculateSMA(closes.subList(0, i), 20);
            Double prevSlowSMA = calculateSMA(closes.subList(0, i), 50);

            if (fastSMA != null && slowSMA != null && prevFastSMA != null && prevSlowSMA != null) {
                // Golden cross
                if (prevFastSMA <= prevSlowSMA && fastSMA > slowSMA) {
                    signals.add(new Signal(i, TradeType.BUY, candles.get(i).getClose()));
                }
                // Death cross
                else if (prevFastSMA >= prevSlowSMA && fastSMA < slowSMA) {
                    signals.add(new Signal(i, TradeType.SELL, candles.get(i).getClose()));
                }
            }
        }
        return signals;
    }

    private List<Signal> generateEmaSignals(List<CandleResponse> candles) {
        List<Signal> signals = new ArrayList<>();
        List<Double> closes = candles.stream().map(c -> c.getClose().doubleValue()).toList();

        for (int i = 26; i < closes.size(); i++) {
            Double fastEMA = calculateEMA(closes.subList(0, i + 1), 12);
            Double slowEMA = calculateEMA(closes.subList(0, i + 1), 26);
            Double prevFastEMA = calculateEMA(closes.subList(0, i), 12);
            Double prevSlowEMA = calculateEMA(closes.subList(0, i), 26);

            if (fastEMA != null && slowEMA != null && prevFastEMA != null && prevSlowEMA != null) {
                if (prevFastEMA <= prevSlowEMA && fastEMA > slowEMA) {
                    signals.add(new Signal(i, TradeType.BUY, candles.get(i).getClose()));
                } else if (prevFastEMA >= prevSlowEMA && fastEMA < slowEMA) {
                    signals.add(new Signal(i, TradeType.SELL, candles.get(i).getClose()));
                }
            }
        }
        return signals;
    }

    private List<Signal> generateRsiSignals(List<CandleResponse> candles) {
        List<Signal> signals = new ArrayList<>();
        List<Double> closes = candles.stream().map(c -> c.getClose().doubleValue()).toList();

        for (int i = 15; i < closes.size(); i++) {
            Double rsi = calculateRSI(closes.subList(0, i + 1), 14);
            Double prevRSI = calculateRSI(closes.subList(0, i), 14);

            if (rsi != null && prevRSI != null) {
                // Oversold bounce: buy when RSI crosses above 30
                if (prevRSI <= 30.0 && rsi > 30.0) {
                    signals.add(new Signal(i, TradeType.BUY, candles.get(i).getClose()));
                }
                // Overbought: sell when RSI crosses below 70
                else if (prevRSI >= 70.0 && rsi < 70.0) {
                    signals.add(new Signal(i, TradeType.SELL, candles.get(i).getClose()));
                }
            }
        }
        return signals;
    }

    private List<Signal> generateMacdSignals(List<CandleResponse> candles) {
        List<Signal> signals = new ArrayList<>();
        List<Double> closes = candles.stream().map(c -> c.getClose().doubleValue()).toList();

        for (int i = 35; i < closes.size(); i++) {
            MacdResult macd = calculateMACD(closes.subList(0, i + 1));
            MacdResult prevMacd = calculateMACD(closes.subList(0, i));

            if (macd != null && prevMacd != null) {
                if (prevMacd.macd <= prevMacd.signal && macd.macd > macd.signal) {
                    signals.add(new Signal(i, TradeType.BUY, candles.get(i).getClose()));
                } else if (prevMacd.macd >= prevMacd.signal && macd.macd < macd.signal) {
                    signals.add(new Signal(i, TradeType.SELL, candles.get(i).getClose()));
                }
            }
        }
        return signals;
    }

    private List<Signal> generateBollingerSignals(List<CandleResponse> candles) {
        List<Signal> signals = new ArrayList<>();
        List<Double> closes = candles.stream().map(c -> c.getClose().doubleValue()).toList();

        for (int i = 20; i < closes.size(); i++) {
            BollingerResult bands = calculateBollinger(closes.subList(0, i + 1), 20, 2.0);
            if (bands != null) {
                double price = candles.get(i).getClose().doubleValue();
                if (price <= bands.lower) {
                    signals.add(new Signal(i, TradeType.BUY, candles.get(i).getClose()));
                } else if (price >= bands.upper) {
                    signals.add(new Signal(i, TradeType.SELL, candles.get(i).getClose()));
                }
            }
        }
        return signals;
    }

    private List<Signal> generateSupportResistanceSignals(List<CandleResponse> candles) {
        List<Signal> signals = new ArrayList<>();
        List<Double> closes = candles.stream().map(c -> c.getClose().doubleValue()).toList();
        int window = 10;

        List<Double> swingHigh = new ArrayList<>();
        List<Double> swingLow = new ArrayList<>();

        for (int i = window; i < closes.size() - window; i++) {
            if (closes.get(i) > closes.get(i - 1) && closes.get(i) > closes.get(i + 1)) {
                swingHigh.add(closes.get(i));
            }
            if (closes.get(i) < closes.get(i - 1) && closes.get(i) < closes.get(i + 1)) {
                swingLow.add(closes.get(i));
            }
        }

        for (int i = window + 5; i < closes.size(); i++) {
            double currentPrice = closes.get(i);
            double recentHigh = swingHigh.isEmpty() ? 0 : swingHigh.get(swingHigh.size() - 1);
            double recentLow = swingLow.isEmpty() ? Double.MAX_VALUE : swingLow.get(swingLow.size() - 1);

            if (recentHigh > 0 && currentPrice > recentHigh * 1.01) {
                signals.add(new Signal(i, TradeType.BUY, candles.get(i).getClose()));
            } else if (recentLow < Double.MAX_VALUE && currentPrice < recentLow * 0.99) {
                signals.add(new Signal(i, TradeType.SELL, candles.get(i).getClose()));
            }
        }
        return signals;
    }

    private Double calculateSMA(List<Double> data, int period) {
        if (data.size() < period) return null;
        double sum = 0.0;
        for (int i = data.size() - period; i < data.size(); i++) {
            sum += data.get(i);
        }
        return sum / period;
    }

    private Double calculateEMA(List<Double> data, int period) {
        if (data.size() < period) return null;
        double k = 2.0 / (period + 1);
        double ema = data.subList(0, period).stream().mapToDouble(Double::doubleValue).sum() / period;
        for (int i = period; i < data.size(); i++) {
            ema = data.get(i) * k + ema * (1.0 - k);
        }
        return ema;
    }

    private Double calculateRSI(List<Double> data, int period) {
        if (data.size() < period + 1) return null;
        double gains = 0.0;
        double losses = 0.0;

        for (int i = data.size() - period; i < data.size(); i++) {
            double delta = data.get(i) - data.get(i - 1);
            if (delta > 0) gains += delta;
            else losses -= delta;
        }

        double avgGain = gains / period;
        double avgLoss = losses / period;
        if (avgLoss == 0) return avgGain > 0 ? 100.0 : 0.0;

        double rs = avgGain / avgLoss;
        return 100.0 - (100.0 / (1.0 + rs));
    }

    private static record MacdResult(double macd, double signal) {}

    private MacdResult calculateMACD(List<Double> data) {
        if (data.size() < 26) return null;
        Double ema12 = calculateEMA(data, 12);
        Double ema26 = calculateEMA(data, 26);
        if (ema12 == null || ema26 == null) return null;

        double macdLine = ema12 - ema26;
        double signalLine = macdLine;
        if (data.size() >= 35) {
            double k = 2.0 / (9 + 1);
            signalLine = macdLine * k + macdLine * (1.0 - k);
        }
        return new MacdResult(macdLine, signalLine);
    }

    private static record BollingerResult(double middle, double upper, double lower) {}

    private BollingerResult calculateBollinger(List<Double> data, int period, double stdDevMultiplier) {
        Double sma = calculateSMA(data, period);
        if (sma == null) return null;

        List<Double> recent = data.subList(data.size() - period, data.size());
        double variance = recent.stream().mapToDouble(c -> Math.pow(c - sma, 2)).sum() / period;
        double stdDev = Math.sqrt(variance);

        return new BollingerResult(sma, sma + stdDev * stdDevMultiplier, sma - stdDev * stdDevMultiplier);
    }
}
