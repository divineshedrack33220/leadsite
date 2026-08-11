(function () {
  var orderForm = document.getElementById("order-form-main");

  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      orderForm.innerHTML = "<p class='order-success'>Thank you! Your order has been received. We will call you shortly to confirm delivery.</p>";
    });
  }

  function startCountdown(days) {
    var end = Date.now() + days * 24 * 60 * 60 * 1000;

    var elDays = document.getElementById("cd-days");
    var elHours = document.getElementById("cd-hours");
    var elMins = document.getElementById("cd-mins");
    var elSecs = document.getElementById("cd-secs");

    if (!elDays) return;

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function tick() {
      var diff = end - Date.now();
      if (diff < 0) diff = 0;

      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((diff % (1000 * 60)) / 1000);

      elDays.textContent = pad(d);
      elHours.textContent = pad(h);
      elMins.textContent = pad(m);
      elSecs.textContent = pad(s);
    }

    tick();
    setInterval(tick, 1000);
  }

  startCountdown(2);
})();
