const API = '/api/resell';

fetch(API)
  .then(res => res.json())
  .then(renderItems);

function renderItems(items) {
  const container = document.getElementById('resellItems');
  container.innerHTML = items.map(i => `
    <div class="card">
      <img src="${i.imageUrl}">
      <h3>${i.name}</h3>
      <p>${i.description}</p>
      <p>₹${i.price}</p>
      <button onclick="addToCart('${i._id}', '${i.name}', ${i.price}, '${i.imageUrl}')">
        Add to Cart
      </button>
    </div>
  `).join('');
}

