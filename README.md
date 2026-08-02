# StyAILe.ai

> AI-powered wardrobe management platform that helps users digitally organize their clothing and receive intelligent outfit recommendations using multimodal AI.

![Status](https://img.shields.io/badge/Status-WIP-orange)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20NVIDIA-76B900)

---

## Overview

Choosing outfits from a growing wardrobe can be frustrating. Many people own numerous clothes but still struggle to decide what to wear.

StyAILe.ai solves this problem by creating a digital wardrobe where users can upload images of their clothing. The application analyzes garments using multimodal AI models and provides outfit recommendations based on style, occasion, and season.

This project was developed as an academic project while exploring modern AI APIs, computer vision, and full-stack web development.

---

## Features

- Digital wardrobe management
- Clothing image upload
- AI-powered clothing analysis
- Outfit recommendation engine
- Modern responsive interface
- Modular architecture
- Cross-platform support

### Planned Features

- User authentication
- Weather-aware outfit recommendations
- Color matching algorithm
- Smart search and filtering
- Mobile application
- Calendar integration
- Fashion trend suggestions

---

## System Architecture

```
                User

                 │

          Upload Image

                 │

          React Frontend

                 │

         Node.js Backend

                 │

      AI Vision Processing
      ┌───────────────┐
      │ Gemini API    │
      │ NVIDIA API*   │
      └───────────────┘

                 │

     Clothing Classification

                 │

      Wardrobe Database

                 │

      Outfit Recommendation
```

*NVIDIA APIs were evaluated and tested during development.

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- CSS

### Backend

- Node.js
- Express

### AI

- Google Gemini Vision API
- NVIDIA AI APIs (Experimental)
- Claude Vision (Research)

### Tools

- Git
- GitHub
- VS Code

---

## How It Works

1. User uploads clothing images.
2. Images are sent to the backend.
3. AI analyzes:
   - Clothing category
   - Colors
   - Style
   - Seasonal suitability
4. Clothing is stored digitally.
5. Recommendation engine suggests matching outfits.

---

## Installation

Clone the repository

```bash
git clone https://github.com/yourusername/StyAILe.ai.git
```

Move into the project

```bash
cd StyAILe.ai
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

---

## Folder Structure

```
StyAILe.ai
│
├── android/
├── components/
├── services/
├── public/
├── views/
├── App.tsx
├── package.json
└── README.md
```

---

## Challenges Faced

During development several AI providers were evaluated.

Challenges included:

- API rate limits
- Prompt engineering for clothing analysis
- Handling inconsistent AI responses
- Image preprocessing
- Optimizing recommendation quality

These challenges provided valuable experience integrating real-world AI services into production-like applications.

---

## What I Learned

- Building full-stack applications with React and Node.js
- Working with multimodal AI APIs
- REST API integration
- Prompt engineering
- Git collaboration
- Software architecture
- AI workflow design

---

## Future Improvements

- Authentication
- Database integration
- AI personalization
- Recommendation ranking
- Mobile app
- Better UI/UX
- Cloud deployment

---

## Screenshots

### Home

> *(Add screenshot here)*

### Wardrobe

> *(Add screenshot here)*

### AI Recommendation

> *(Add screenshot here)*

---

## Contributors

- **Aravinthan K** *(Project Lead & Developer)*
- Team Members

---

## License

This project is released under the MIT License.

---

## Connect

LinkedIn:
https://linkedin.com/in/your-profile

GitHub:
https://github.com/Aravinthan-nyc

Email:
your-email@example.com
