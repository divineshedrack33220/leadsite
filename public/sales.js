(function () {
  var root = document.getElementById("page-content");
  if (!root) return;

  var timer = null;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function startCountdown(days) {
    var end = Date.now() + days * 24 * 60 * 60 * 1000;

    var elDays = document.getElementById("cd-days");
    var elHours = document.getElementById("cd-hours");
    var elMins = document.getElementById("cd-mins");
    var elSecs = document.getElementById("cd-secs");

    if (!elDays) return;

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
    timer = setInterval(tick, 1000);
  }

  function bindForm() {
    var orderForm = document.getElementById("order-form-main");
    if (!orderForm) return;

    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var data = {
        name: document.getElementById("of-name").value,
        phone: document.getElementById("of-phone").value,
        altphone: document.getElementById("of-alt").value,
        number: document.getElementById("of-num").value,
        address: document.getElementById("of-address").value,
        quantity: document.getElementById("of-quantity").value
      };

      if (window.lsAnalytics) {
        window.lsAnalytics.trackOrder(data);
      }

      fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          orderForm.innerHTML = "<p class='order-success'>Thank you! Your order has been received. We will call you shortly to confirm delivery.</p>";
        })
        .catch(function () {
          orderForm.innerHTML = "<p class='order-success'>Something went wrong. Please try again.</p>";
        });
    });
  }

  function scrollToForm() {
    var form = document.getElementById("order-form-main");
    if (!form) return;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    var nameInput = document.getElementById("of-name");
    if (nameInput) {
      setTimeout(function () { nameInput.focus({ preventScroll: true }); }, 600);
    }
  }

  function bindButtons() {
    var btns = document.querySelectorAll(
      ".offer-btn, .buy-btn, .order-btn-blue, .yellow-btn, .want-btn, " +
      ".want-img, .order-img, .order2-img, .order3-img, .buy-gif, .offer-gif"
    );
    btns.forEach(function (btn) {
      btn.classList.add("clickable");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        btn.classList.add("pressed");
        scrollToForm();
      });
    });
  }

  fetch("/api/content/sales")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      root.innerHTML = data.content || "";
      startCountdown(2);
      bindForm();
      bindButtons();
    })
    .catch(function () {
      root.innerHTML = "<p style='text-align:center;padding:40px'>Content unavailable.</p>";
    });
})();
