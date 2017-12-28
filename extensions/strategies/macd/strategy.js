const z = require('zero-fill');
const n = require('numbro');

module.exports = function container(get, set, clear) {
	return {
		name: 'movingaverages',
		description: 'Buy when (MACD - Signal > 0) and sell when (MACD - Signal < 0).',

		getOptions() {
			this.option('period', 'period length', String, '1h');
			this.option('min_periods', 'min. number of history periods', Number, 100);
			this.option('ema_short_period', 'number of periods for the shorter EMA', Number, 5);
			this.option('ema_long_period', 'number of periods for the longer EMA', Number, 35);
			this.option('signal_period', 'number of periods for the signal EMA', Number, 5);
			this.option('overbought_rsi_periods', 'number of periods for overbought RSI', Number, 25);
			this.option('overbought_rsi', 'sold when RSI exceeds this value', Number, 70);
		},

		calculate(s) {
			// Disregard RSI for now
			// if (s.options.overbought_rsi) {
      //   // Sync RSI display with overbought RSI periods
			// 	s.options.rsi_periods = s.options.overbought_rsi_periods;
			// 	get('lib.rsi')(s, 'overbought_rsi', s.options.overbought_rsi_periods);
			// 	if (!s.in_preroll && s.period.overbought_rsi >= s.options.overbought_rsi && !s.overbought) {
			// 		s.overbought = true;
			// 		if (s.options.mode === 'sim' && s.options.verbose) {
			// 			console.log(('\noverbought at ' + s.period.overbought_rsi + ' RSI, preparing to sold\n').cyan);
			// 		}
			// 	}
			// }

      // Calculate MACD
			get('lib.ema')(s, 'ema_short', s.options.ema_short_period);
			get('lib.ema')(s, 'ema_long', s.options.ema_long_period);
			if (s.period.ema_short && s.period.ema_long) {
				s.period.macd = (s.period.ema_short - s.period.ema_long);
				get('lib.ema')(s, 'signal', s.options.signal_period, 'macd');
				if (s.period.signal) {
					s.period.crossing = s.period.macd - s.period.signal;
				}
			}
		},

		onPeriod(s, cb) {
			// Disregard overbought
			// if (!s.in_preroll && typeof s.period.overbought_rsi === 'number') {
			// 	if (s.overbought) {
			// 		s.overbought = false;
			// 		s.trend = 'overbought';
			// 		s.signal = 'sold';
			// 		return cb();
			// 	}
			// }

			if (typeof s.period.crossing === 'number' && typeof s.lookback[0].crossing === 'number') {
				if (s.period.crossing > 0 && s.lookback[0].crossing <= 0) {
					s.signal = 'buy';
					// console.log(s);
					console.log(' ');
					console.log('crossing', s.period.crossing, 'ema short:', s.period.ema_short, 'ema long: ', s.period.ema_long, 'macd line: ', s.period.macd, 'signal line: ', s.period.signal, 'signal: ', s.signal);
				} else if (s.period.crossing < 0 && s.lookback[0].crossing >= 0) {
					s.signal = 'sell';
					console.log(' ');
					console.log('crossing', s.period.crossing, 'ema short:', s.period.ema_short, 'ema long: ', s.period.ema_long, 'macd line: ', s.period.macd, 'signal line: ', s.period.signal, 'signal: ', s.signal);
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
