(function () {
  var root = document.getElementById("page-content");
  if (!root) return;

  function bindButtons() {
    var accessBtn = document.getElementById("access-btn");
    if (accessBtn) {
      accessBtn.addEventListener("click", function () {
        accessBtn.classList.add("pressed");
      });
    }
  }

  fetch("/api/content/index")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      root.innerHTML = data.content || "";
      bindButtons();
    })
    .catch(function () {
      root.innerHTML = "<p style='text-align:center;padding:40px'>Content unavailable.</p>";
    });
})();
