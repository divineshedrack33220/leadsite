(function () {
  var accessBtn = document.getElementById("access-btn");

  if (accessBtn) {
    accessBtn.addEventListener("click", function () {
      accessBtn.classList.add("pressed");
    });
  }
})();
