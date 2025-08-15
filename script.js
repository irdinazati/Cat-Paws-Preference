const cardContainer = document.getElementById("card-container");
const likeCountEl = document.getElementById("like-count");
const likedGallery = document.getElementById("liked-gallery");
const popup = document.getElementById("popup");
const closePopup = document.getElementById("close-popup");

let likedCats = [];
let totalSwiped = 0;
const maxCats = 20;

// Initialize app
function initApp() {
  likedCats = [];
  totalSwiped = 0;
  cardContainer.innerHTML = "";
  likedGallery.innerHTML = "";
  likeCountEl.textContent = ""; // hide 0 initially
  popup.style.display = "none";

  loadCats();
}

// Load 20 cats at once
function loadCats() {
  const fetches = [];
  const batch = 10; // max 10 per request
  const times = Math.ceil(maxCats / batch);

  for (let i = 0; i < times; i++) {
    fetches.push(
      fetch(`https://api.thecatapi.com/v1/images/search?limit=${batch}`)
        .then(res => res.json())
    );
  }

  Promise.all(fetches)
    .then(results => {
      results.flat().forEach(cat => createCard(cat.url));
    })
    .catch(() => console.error("Failed to load cat images."));
}

// Create a card
function createCard(imageUrl) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.style.position = "absolute";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "Cat";

  const likeOverlay = document.createElement("div");
  likeOverlay.classList.add("overlay", "like");
  likeOverlay.textContent = "❤️";

  const dislikeOverlay = document.createElement("div");
  dislikeOverlay.classList.add("overlay", "dislike");
  dislikeOverlay.textContent = "❌";

  card.appendChild(img);
  card.appendChild(likeOverlay);
  card.appendChild(dislikeOverlay);
  cardContainer.appendChild(card);

  enableSwipe(card, imageUrl, likeOverlay, dislikeOverlay);
}

// Enable swipe functionality
function enableSwipe(card, imageUrl, likeOverlay, dislikeOverlay) {
  let startX = 0, currentX = 0, isDragging = false, moved = false;
  const swipeThreshold = 50, tapThreshold = 8;

  card.addEventListener("mousedown", startDrag);
  card.addEventListener("touchstart", startDrag, { passive: true });

  function startDrag(e) {
    startX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    currentX = startX;
    moved = false;
    isDragging = true;
    card.style.transition = "none";

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);
  }

  function onDrag(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const pointX = e.type.includes("mouse") ? e.clientX : e.touches[0]?.clientX;
    if (pointX == null) return;

    currentX = pointX;
    const diffX = currentX - startX;
    if (Math.abs(diffX) > tapThreshold) moved = true;

    card.style.transform = `translateX(${diffX}px) rotate(${diffX / 15}deg)`;

    const opacity = Math.min(Math.abs(diffX) / 100, 1);
    if (diffX > 0) {
      likeOverlay.style.opacity = opacity;
      likeOverlay.style.transform = `translate(-50%, -50%) scale(${0.5 + opacity})`;
      dislikeOverlay.style.opacity = 0;
    } else {
      dislikeOverlay.style.opacity = opacity;
      dislikeOverlay.style.transform = `translate(-50%, -50%) scale(${0.5 + opacity})`;
      likeOverlay.style.opacity = 0;
    }
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    const diffX = currentX - startX;

    if (!moved || Math.abs(diffX) <= swipeThreshold) {
      card.style.transition = "transform 0.25s ease";
      card.style.transform = "translateX(0px) rotate(0deg)";
      likeOverlay.style.opacity = 0;
      dislikeOverlay.style.opacity = 0;
      cleanup();
      return;
    }

    if (diffX > 0) likedCats.push(imageUrl);

    totalSwiped++;

    card.style.transition = "transform 0.25s ease";
    card.style.transform = `translateX(${diffX > 0 ? 500 : -500}px) rotate(${diffX > 0 ? 20 : -20}deg)`;

    setTimeout(() => {
      card.remove();
      if (likedCats.length) likeCountEl.textContent = likedCats.length;
      updateGallery();

      if (totalSwiped >= maxCats) showPopup();
    }, 200);

    cleanup();
  }

  function cleanup() {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("touchend", endDrag);
    document.removeEventListener("touchcancel", endDrag);
  }
}

// Update gallery
function updateGallery() {
  likedGallery.innerHTML = likedCats
    .map(src => `<img src="${src}" alt="Cat" style="width:100px; margin:5px; border-radius:10px;">`)
    .join("");
}

// // Show popup and auto-reset
// function showPopup() {
//   popup.style.display = "flex"; // make sure it's flex for centering
//   // Remove auto-reset
// }

// Close popup manually
closePopup.onclick = () => {
  popup.style.display = "none";
  initApp(); // reset only when user clicks close
};

// Show popup
function showPopup() {
  popup.style.display = "flex"; // make sure it's flex for centering

  // Update popup content
  const popupContent = document.querySelector(".popup-content");
  if (!popupContent) return;

  if (likedCats.length === 0) {
    popupContent.innerHTML = `
      <span id="close-popup">&times;</span>
      <h2>You liked 0 cat 😿</h2>
      <p>Try swiping some cats next time!</p>
    `;
  } else {
    popupContent.innerHTML = `
      <span id="close-popup">&times;</span>
      <h2>You liked ${likedCats.length} cat${likedCats.length > 1 ? 's' : ''} ❤️</h2>
      <div id="liked-gallery"></div>
    `;
    // Update the liked gallery inside popup
    const popupGallery = popupContent.querySelector("#liked-gallery");
    popupGallery.innerHTML = likedCats
      .map(src => `<img src="${src}" alt="Cat" style="width:100px; margin:5px; border-radius:10px;">`)
      .join("");
  }

  // Re-attach close button listener
  const closeBtn = popupContent.querySelector("#close-popup");
  closeBtn.onclick = () => {
    popup.style.display = "none";
    initApp(); // reset when user clicks close
  };
}



// Start app
initApp();
