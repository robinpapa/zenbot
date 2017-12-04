module.exports = {
  _ns: 'zenbot',

  'strategies.stddev': require('./sentiment'),
  'strategies.list[]': '#strategies.sentiment'
}
