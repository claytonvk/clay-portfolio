// Your JavaScript code here
let observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    } else {
      entry.target.classList.remove("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer.observe(el));

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
