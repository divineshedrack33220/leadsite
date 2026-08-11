(function () {
  var page = document.currentScript && document.currentScript.getAttribute("data-page") || "index";

  function getParam(name) {
    var m = window.location.search.match(new RegExp("[?&]" + name + "=([^&]+)"));
    return m ? decodeURIComponent(m[1]) : "";
  }

  function send(url, body) {
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true
      });
    }
  }

  var payload = {
    page: page,
    referrer: document.referrer,
    utm_source: getParam("utm_source"),
    utm_medium: getParam("utm_medium"),
    utm_campaign: getParam("utm_campaign")
  };

  window.lsAnalytics = {
    payload: payload,
    trackOrder: function (extra) {
      var body = {};
      Object.keys(payload).forEach(function (k) { body[k] = payload[k]; });
      Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
      send("/api/order", body);
    }
  };

  send("/api/track", payload);
})();
