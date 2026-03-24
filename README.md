# 🧺 Gaga List | AI-Powered Smart Grocery Shopping

![Gaga List Banner](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000)

**Gaga List** is a premium, Mobile-First Progressive Web App (PWA) designed to transform how families and individuals handle grocery shopping. By leveraging cutting-edge Artificial Intelligence (Gemini, OpenAI, Groq) and Real-time Synchronization (Supabase), Gaga List makes shopping collaborative, intelligent, and incredibly fast.

---

## 📱 User Experience (UX) Philosophy

Gaga List is built with a **Pocket-First** mentality. We believe grocery lists belong in your hand, not on a desktop screen.

- **Mobile-First Design**: Optimized for one-handed use while walking through supermarket aisles.
- **PWA Ready**: Install it on your phone for a native app feel with offline support.
- **Micro-Interactions**: Haptic feedback (on supported devices) and smooth Framer Motion animations provide a high-end tactile experience.
- **Desktop Guardrail**: To preserve the intended experience, desktop users are prompted to switch to mobile or resize their windows.

---

## 🤖 AI Features (The "Grains" System)

Gaga List uses a credit-based system called **Grains** to power its advanced AI capabilities:

### 1. 🎙️ Voice-to-List (Groq & Whisper)
Just speak. Our integration with **Whisper (via Groq)** transcribes your speech with ultra-low latency, and **Gemini** extracts products, quantities, and categories instantly.

### 2. 📸 Photo-to-List (OpenAI Vision)
Found an old handwritten list or a recipe in a magazine? Snap a photo. **OpenAI GPT-4o** will parse the image and populate your digital list in seconds.

### 3. 👨‍🍳 Smart Chef Recipes (Gemini 1.5 Flash)
Got random ingredients at home? Ask the **Smart Chef**. It suggests 3 realistic recipes based strictly on what you have, including prep time and difficulty levels.

### 4. 👁️ Vision Scanner
Point your camera at a product in the pantry. The AI identifies it and suggests if it's time to add it to your shopping list.

---

## 🗺️ Advanced Functionality

### 📍 Smart Maps
Integration with **Leaflet** allows users to visualize where items were added or where they usually shop, optimizing the route within the city or the store.

### 💬 Real-time Collaborative Chat
Every list has a built-in chat. Coordinate with your family in real-time. Know exactly who is buying what, as it happens.

### 👥 Collaborative Synchronization
Shared lists update instantly across all devices. No more double-buying the same gallon of milk.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Real-time, Auth, Storage)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Models**: 
  - Google Gemini 1.5 Flash
  - OpenAI GPT-4o-mini
  - Groq (Whisper-large-v3)
- **Payments**: [Stripe](https://stripe.com/)
- **Maps**: [Leaflet](https://leafletjs.org/)

---

## 📸 Screenshots & Demo

> [PLACEHOLDER FOR GIF DEMO]

| Dashboard | List View | Smart Chef |
| :---: | :---: | :---: |
| ![Screen 1](https://via.placeholder.com/300x600?text=Dashboard) | ![Screen 2](https://via.placeholder.com/300x600?text=List+Items) | ![Screen 3](https://via.placeholder.com/300x600?text=AI+Recipes) |

---

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/paulpessoa/gaga-list.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file with:
   - Supabase Credentials
   - AI API Keys (Google, OpenAI, Groq)
   - Stripe Keys

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 👔 Approach

This project follows **Clean Architecture** principles simplified for high-velocity startups. 
- **Services Layer**: Business logic isolated from components.
- **RSC Default**: Utilizing React Server Components for maximum performance.
- **Dynamic Settings**: AI costs and Plan pricing are centralized and easily adjustable via environment variables.

---

Developed with ☕ and 🧪 by **Paul Pessoa** (Staff Engineer).
