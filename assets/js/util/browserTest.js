;(function browserTest () {
  // test to see if this is a browser whose version is supported
  var userAgent = window.navigator.userAgent

  var chrome = userAgent.match(/Chrome\/(\d+)/)
    , firefox = userAgent.match(/Firefox\/(\d+)/)
    , trident = userAgent.match(/Trident\/(\d+)/)
    , msie = userAgent.match(/MSIE (\d+)/)
    , safari = !!~userAgent.indexOf('Safari');

  if (chrome && chrome[1] > 13 || 
      firefox && firefox[1] > 10 ||
      msie && msie[1] > 9 || 
      trident && trident[1] > 5 ||
    // this is for IE
    // SEE: http://stackoverflow.com/questions/17447373/how-can-i-target-only-internet-explorer-11-with-javascript
      safari && userAgent.match(/Version\/(\d+)/)[1] > 5) {
  } else {
    return notSupportedBrowser();
  }

  function notSupportedBrowser () {
    alert('Your browser isn\'t supported: please try using IE10+, Firefox v.11+, Chrome v.14+, or Safari v.6+');
  }
})();
