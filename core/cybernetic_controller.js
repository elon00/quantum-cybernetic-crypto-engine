/**
 * Cybernetics Homeostasis Controller (Norbert Wiener Circular Causality Engine)
 * Implements Negative Feedback Loop & Ashby's Law of Requisite Variety
 * to dynamically stabilize block times, transaction fees, and consensus health.
 */
class CyberneticController {
    constructor(targetBlockTimeMs = 8000) {
        this.targetBlockTime = targetBlockTimeMs;
        this.integralError = 0;
        this.lastError = 0;
        this.kp = 0.00015; // Proportional Gain
        this.ki = 0.00001; // Integral Gain
        this.kd = 0.00005; // Derivative Gain

        this.telemetryHistory = [];
        this.maxHistory = 50;
        this.currentDifficulty = 3; // Number of leading zeros
        this.baseGasFeeGwei = 15.0;
    }

    /**
     * Executes the circular causality feedback loop:
     * Sensor (Time Delta) -> Comparator (Error) -> Actuator (Difficulty & Fee Adjustment)
     */
    evaluateCycle(actualBlockTimeMs, mempoolSize) {
        const error = this.targetBlockTime - actualBlockTimeMs;
        this.integralError += error;
        // Anti-windup clamp
        this.integralError = Math.max(-100000, Math.min(100000, this.integralError));
        const derivativeError = error - this.lastError;
        this.lastError = error;

        // PID correction signal
        const correctionSignal = (this.kp * error) + (this.ki * this.integralError) + (this.kd * derivativeError);

        // Adjust difficulty: If blocks are mined too fast (error > 0), increase difficulty
        if (error > 2500 && this.currentDifficulty < 6) {
            this.currentDifficulty += 1;
        } else if (error < -3500 && this.currentDifficulty > 1) {
            this.currentDifficulty -= 1;
        }

        // Adjust gas fee (Negative feedback on mempool congestion)
        const congestionRatio = mempoolSize / 50.0;
        const feeDelta = (congestionRatio - 0.5) * 2.0;
        this.baseGasFeeGwei = Math.max(1.0, +(this.baseGasFeeGwei + feeDelta + (correctionSignal * 10)).toFixed(2));

        const snapshot = {
            timestamp: Date.now(),
            targetBlockTime: this.targetBlockTime,
            actualBlockTime: actualBlockTimeMs,
            errorMs: error,
            correctionSignal: +correctionSignal.toFixed(6),
            currentDifficulty: this.currentDifficulty,
            baseGasFeeGwei: this.baseGasFeeGwei,
            mempoolCongestion: mempoolSize,
            systemStability: error === 0 ? 100 : Math.max(10, +(100 - (Math.abs(error) / this.targetBlockTime) * 100).toFixed(1))
        };

        this.telemetryHistory.push(snapshot);
        if (this.telemetryHistory.length > this.maxHistory) {
            this.telemetryHistory.shift();
        }

        return snapshot;
    }

    getLatestTelemetry() {
        return this.telemetryHistory[this.telemetryHistory.length - 1] || {
            targetBlockTime: this.targetBlockTime,
            actualBlockTime: this.targetBlockTime,
            errorMs: 0,
            correctionSignal: 0,
            currentDifficulty: this.currentDifficulty,
            baseGasFeeGwei: this.baseGasFeeGwei,
            mempoolCongestion: 0,
            systemStability: 100
        };
    }
}

module.exports = CyberneticController;
