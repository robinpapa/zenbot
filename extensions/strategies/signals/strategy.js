const z = require('zero-fill');
const	n = require('numbro');

module.exports = function container(get, set, clear) {
	return {
		name: 'signals',
		description: 'Buy when (MACD - Signal > 0) and sell when (MACD - Signal < 0).',

		getOptions() {
			this.option('period', 'period length', String, '20m');
			this.option('min_periods', 'min. number of history periods', Number, 10);
			this.option('ema_short_period', 'number of periods for the shorter EMA', Number, 12);
			this.option('ema_long_period', 'number of periods for the longer EMA', Number, 26);
			this.option('signal_period', 'number of periods for the signal EMA', Number, 9);
			this.option('up_trend_threshold', 'threshold to trigger a buy signal', Number, 0);
			this.option('down_trend_threshold', 'threshold to trigger a sold signal', Number, 0);

			this.option('overbought_rsi_periods', 'number of periods for overbought RSI', Number, 25);
			this.option('overbought_rsi', 'sold when RSI exceeds this value', Number, 70);
		},

		calculate(s) {
			if (s.options.overbought_rsi) {
        // Sync RSI display with overbought RSI periods
				s.options.rsi_periods = s.options.overbought_rsi_periods;
				get('lib.rsi')(s, 'overbought_rsi', s.options.overbought_rsi_periods);
				if (!s.in_preroll && s.period.overbought_rsi >= s.options.overbought_rsi && !s.overbought) {
					s.overbought = true;
					if (s.options.mode === 'sim' && s.options.verbose) {
						console.log(('\noverbought at ' + s.period.overbought_rsi + ' RSI, preparing to sold\n').cyan);
					}
				}
			}
			get('lib.ta_macd')(s, 'macd', 'macd_histogram', 'macd_signal', s.options.ema_long_period, s.options.ema_short_period, s.options.signal_period);
		},

		onPeriod(s, cb) {
			if (!s.in_preroll && typeof s.period.overbought_rsi === 'number') {
				if (s.overbought) {
					s.overbought = false;
					s.trend = 'overbought';
					s.signal = 'sold';
					return cb();
				}
			}

			if (typeof s.period.macd_histogram === 'number' && typeof s.lookback[0].macd_histogram === 'number') {
				if ((s.period.macd_histogram - s.options.up_trend_threshold) > 0 && (s.lookback[0].macd_histogram - s.options.up_trend_threshold) <= 0) {
					s.signal = 'buy';
				} else if ((s.period.macd_histogram + s.options.down_trend_threshold) < 0 && (s.lookback[0].macd_histogram + s.options.down_trend_threshold) >= 0) {
					s.signal = 'sell';
				} else {
					s.signal = null;  // Hold
				}
			}
			cb();
		},

		onReport(s) {
			const cols = [];
			if (typeof s.period.macd_histogram === 'number') {
				let color = 'grey';
				if (s.period.macd_histogram > 0) {
					color = 'green';
				} else if (s.period.macd_histogram < 0) {
					color = 'red';
				}
				cols.push(z(8, n(s.period.macd_histogram).format('+00.0000'), ' ')[color]);
				cols.push(z(8, n(s.period.overbought_rsi).format('00'), ' ').cyan);
			} else {
				cols.push('         ');
			}
			return cols;
		}
	};
};
