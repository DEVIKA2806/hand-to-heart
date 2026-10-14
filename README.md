# Hand to Heart: A Multi-Role E-Commerce Ecosystem for Self-Help Groups (SHGs)

## Project Overview
Hand to Heart is a full-stack e-commerce marketplace engineered to bridge the digital divide for rural Self-Help Groups (SHGs), local sellers, resellers, and buyers. Modeled after enterprise frameworks like the Government of India's eSARAS initiative, the platform provides micro-producers with a modern online storefront while introducing a multi-tiered reseller business model and automated delivery pathways.

### Core Objectives
- **Business Innovation:** Multi-role user routing supporting unified workflows for Buyers, Sellers, Resellers, and Logistics/Delivery agents.
- **Social Impact:** Democratizing digital commerce infrastructure for micro-producers and local craft groups to unlock macro-markets.
- **Real-Time Negotiation:** Direct peer-to-peer (P2P) communication architecture enabling buyers and resellers to consult with SHG producers instantly.

---

## Technical Architecture & Stack
The platform is built using a highly decoupled, service-oriented architecture designed to handle dynamic data pipelines and concurrent connections:

- **Frontend UI/UX:** Responsive layouts engineered with semantic `HTML5`, structured `CSS3`, and dynamic DOM-manipulation via `Vanilla JavaScript`.
- **Backend Application Logic:** Restful API services built on `Node.js` and `Express.js`, incorporating modular routing mechanics.
- **Database & Data Modeling:** Object data modeling via `Mongoose` connected to a cloud-hosted `MongoDB Atlas` instance to safely isolate marketplace schemas.
- **Security & Authorization:** Token-based session management utilizing `JSON Web Tokens (JWT)`, secure one-way credential hashing via `bcrypt`, and secure environment variables (`dotenv`).
- **Real-Time Communication:** Low-latency P2P audio/video streaming via `WebRTC`, orchestrated by a custom signaling engine powered by `Socket.IO`.

---

## Advanced Engineering Features Implemented
- **WebRTC Signaling Framework:** Asynchronous client-to-server events to exchange SDP offers/answers and ICE candidates, bypassing heavy server-side media loads.
- **AI-Accelerated Development:** Built leveraging modern AI-assisted code pairing workflows; code audited manually to optimize loop efficiencies and database query times.
