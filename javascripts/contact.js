document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    let observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          console.log("SHOWING");
        } else {
          console.log("NOTSHOWING");
        }
      });
    });

    const hiddenElements = document.querySelectorAll(".hidden");
    hiddenElements.forEach((el) => observer.observe(el));
  }, 500);
});
