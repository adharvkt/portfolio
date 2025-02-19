// Selectors
const menu = document.querySelector("#menu-btn");
const header = document.querySelector(".header");
const themeToggler = document.querySelector("#theme-toggler");
const blogContainer = document.getElementById("medium-posts");

// Toggle menu functionality
menu.addEventListener("click", () => {
  menu.classList.toggle("fa-times");
  header.classList.toggle("active");
});

// Close menu on scroll
window.addEventListener("scroll", () => {
  menu.classList.remove("fa-times");
  header.classList.remove("active");
});

// Theme toggle functionality
themeToggler.addEventListener("click", () => {
  themeToggler.classList.toggle("fa-sun");
  document.body.classList.toggle("active");
});

// Typing animation
const typedElement = document.querySelector(".typed");
if (typedElement) {
  const typedStrings = typedElement.getAttribute("data-typed-items").split(",");
  new Typed(".typed", {
    strings: typedStrings,
    loop: true,
    typeSpeed: 100,
    backSpeed: 50,
    backDelay: 100,
  });
}

// Function to fetch Medium blogs
async function fetchMediumBlogs() {
  const mediumFeedUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@adharvkt&rand=${Math.random()}`;

  try {
    const response = await fetch(mediumFeedUrl);
    const data = await response.json();

    if (data.status === "ok") {
      displayBlogs(data.items);
    } else {
      displayError("Failed to load blogs. Please try again later.");
    }
  } catch (error) {
    console.error("Error fetching Medium blogs:", error);
    displayError("Failed to load blogs. Please try again later.");
  }
}

// Function to display blogs with filtering
function displayBlogs(posts) {
  blogContainer.innerHTML = ""; // Clear previous content

  // Set the word to be excluded (case-insensitive)
  const excludedWord = "Hfjcjc";

  posts.forEach((post) => {
    // Skip this post if the title contains the excluded word
    if (post.title.toLowerCase().includes(excludedWord.toLowerCase())) {
      return;
    }

    // Extract image from content
    const imageMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
    const imageUrl = imageMatch ? imageMatch[1] : "";

    const blogCard = document.createElement("div");
    blogCard.classList.add("box"); // Flash card styling like services section

    blogCard.innerHTML = `
      <i class="fas fa-newspaper"></i>
      ${
        imageUrl
          ? `<img src="${imageUrl}" alt="${post.title}" style="width: 100%; border-radius: 0.5rem; margin-bottom: 1rem;">`
          : ""
      }
      <h3>${post.title}</h3>
      <p>${post.content.replace(/(<([^>]+)>)/gi, "").substring(0, 300)}...</p>
      <a href="${post.link}" class="btn">Read More</a>
    `;

    blogContainer.appendChild(blogCard);
  });
}

// Function to display error message
function displayError(message) {
  blogContainer.innerHTML = `<p>${message}</p>`;
}

// Combine both functions inside a single `window.onload`
window.onload = () => {
  document.body.classList.add("active"); // Ensures the theme toggler works on first click
  fetchMediumBlogs(); // Fetch blog posts on page load
};

console.log("JavaScript loaded successfully.");
