document.addEventListener("DOMContentLoaded", function () {
  // Your JavaScript code heresss

  setTimeout(() => {
    let observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          console.log("SHOWING");
          console.log("SHOWING");
        } else {
          console.log("NOTSHOWING");
        }
      });
    });

    const hiddenElements = document.querySelectorAll(".hidden");
    hiddenElements.forEach((el) => observer.observe(el));
  }, 500);

  function isAtTop() {
    const scrollY = window.scrollY;
    return scrollY === 0;
  }

  let mins = 1;
  const time = document.querySelector("small");

  function showToast() {
    if (isAtTop()) {
      // You've reached the bottom of the page
      var toast = new bootstrap.Toast(document.getElementById("liveToast"));
      toast.show();
      removeEventListener("scroll", showToast);
    }
  }
  // Event listener for the scroll event
  window.addEventListener("scroll", showToast);
  showToast();

  window.setInterval(() => {
    time.innerHTML = `${mins} mins ago`;
    mins += 1;
  }, 1000 * 60);
});
