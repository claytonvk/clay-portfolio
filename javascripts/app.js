const lightImages = [];
const darkImages = [];

// Preload light images
for (let i = 1; i <= 3; i++) {
  const img = new Image();
  img.src = `./media/light-imgs/img${i}.jpg`;
  lightImages.push(img);
}

// Preload dark images
for (let i = 1; i <= 3; i++) {
  const img = new Image();
  img.src = `./media/dark-imgs/img${i}.jpg`;
  darkImages.push(img);
}

document.addEventListener("DOMContentLoaded", function () {
  const mask = document.querySelector(".gradient-mask");
  const hero = document.querySelector(".hero-img");
  const logo = document.querySelector(".logo");
  let img = 1;
  let light = false;

  function changeHero() {
    img = Math.floor(Math.random() * 3) + 1;
    logo.classList.toggle("light");
    light = logo.classList.contains("light") ? true : false;
    if (light) {
      hero.style.backgroundImage = `url(./media/light-imgs/img${img}.jpg)`;
      logo.style.transition = "none";
      logo.style.opacity = 0;
      logo.style.transition = "5s ease-in 5s";
      logo.src = "./media/logo-light.png";
      logo.style.opacity = "1";
    } else {
      hero.style.backgroundImage = `url(./media/dark-imgs/img${img}.jpg)`;
      logo.style.transition = "none";
      logo.style.opacity = 0;
      logo.style.transition = "5s ease-in 5s";
      logo.src = "./media/logo-dark.png";
      logo.style.opacity = "1";
    }
  }

  logo.addEventListener("click", changeHero);

  window.setInterval(changeHero, 5000);

  hero.style.backgroundImage = `url(./media/light-imgs/img${img}.jpg)`;
  logo.style.transition = "none";
  logo.style.opacity = 0;
  logo.style.transition = "5s ease-in 5s";
  logo.src = "./media/logo-light.png";
  logo.style.opacity = "1";
  //   } else {
  hero.style.backgroundImage = `url(./media/dark-imgs/img${img}.jpg)`;
  logo.style.transition = "none";
  logo.style.opacity = 0;
  logo.style.transition = "5s ease-in 5s";
  logo.src = "./media/logo-dark.png";
  logo.style.opacity = "1";

  window.addEventListener("scroll", () => {
    let percent =
      (hero.getBoundingClientRect().y + hero.getBoundingClientRect().height) /
      hero.getBoundingClientRect().height;
    mask.style.height = `${(1 - percent) * 200 + 5}%`;
  });

  const sun = document.querySelector("#sun");
  let rotationAngle = 0; // Initial rotation angle

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    rotationAngle = scrollY / 5; // You can adjust the rotation speed by multiplying with a factor
    // Apply the rotation to the image
    sun.style.transform = `rotate(${rotationAngle}deg)`;
  });

  const p2 = document.getElementById("second-paragraph");
  const p3 = document.getElementById("third-paragraph");
  const line = document.querySelector(".line");

  function lineHeight() {
    line.style.height = `${
      (p3.getBoundingClientRect().bottom - sun.getBoundingClientRect().bottom) /
      2
    }px`;
  }

  lineHeight();
  addEventListener("resize", lineHeight);

  // const threshold = [];
  // for (let i = 1; i <= 100; i += 10) {
  //   threshold.push(i / 100);
  // }

  // let lineAnimator = new IntersectionObserver(
  //   (entry) => {
  //     let percentage = Math.floor((1 - entry[0].intersectionRatio) * 100);
  //     lineAnimate.style.height = `${percentage}%`;
  //     console.log(`${percentage}%`);
  //   },
  //   {
  //     threshold: threshold,
  //     rootMargin: "-50px",
  //   }
  // );

  // const lineContainer = document.querySelectorAll(".line-container");
  // const lineAnimate = document.querySelector(".line-animate");
  // lineContainer.forEach((el) => lineAnimator.observe(el));

  const lineContainer = document.querySelector(".line-container");
  const lineAnimate = document.querySelector(".line-animate");

  window.addEventListener("scroll", () => {
    // Calculate the percentage of the element's visibility in the viewport
    const elementTop = lineContainer.getBoundingClientRect().top;
    const elementHeight = lineContainer.clientHeight;
    const viewportHeight = window.innerHeight;

    const percentage = Math.max(
      0,
      Math.min(
        100,
        (1 - (viewportHeight - elementTop - 100) / elementHeight) * 100
      )
    );

    // Set the height of lineAnimate based on the percentage of visibility
    lineAnimate.style.height = `${percentage}%`;

    console.log(`${percentage}%`);
  });

  let observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  });

  const hiddenElements = document.querySelectorAll(".hidden");
  hiddenElements.forEach((el) => observer.observe(el));

  let blurrer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log();
        entry.target.classList.add("clear");
      }
    });
  });

  const blurredElements = document.querySelectorAll(".blur");
  blurredElements.forEach((el) => blurrer.observe(el));

  // Function to check if you've reached the bottom of the page
  function isAtBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollY = window.scrollY;

    // Check if you've reached the bottom
    return scrollY + clientHeight >= scrollHeight;
  }

  let mins = 1;
  const time = document.querySelector("small");

  function showToast() {
    if (isAtBottom()) {
      // You've reached the bottom of the page
      var toast = new bootstrap.Toast(document.getElementById("liveToast"));
      toast.show();
      removeEventListener("scroll", showToast);
    }
  }
  // Event listener for the scroll event
  window.addEventListener("scroll", showToast);

  window.setInterval(() => {
    time.innerHTML = `${mins} mins ago`;
    mins += 1;
  }, 1000 * 60);
});
