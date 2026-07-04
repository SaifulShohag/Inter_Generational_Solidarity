# Inter-GenAIrational Solidarity
> *Bridging the digital divide and combating senior isolation through hyper-local, AI-driven mutual aid.*

---

## 🖥️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation & Running

```bash
# 1. Navigate to the app directory
cd vibeforall

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Other Commands

```bash
# Type-check the project
npx tsc --noEmit

# Build for production
npm run build

# Preview the production build
npm run preview
```

### Demo Login

On the login screen, select a role and use the **demo login** button — no credentials needed.

- **Bénévole (Volunteer)** — access the volunteer dashboard, missions, statistics, and history
- **Senior** — access the elderly home screen with AI voice and chat assistants

---

## 📋 Executive Summary

The **Inter-GenAIrational Solidarity** platform is a hyper-local community assistance network designed to mitigate social isolation and mobility barriers among older demographics.By leveraging Generative AI, the platform eliminates technical barriers for seniors, seamlessly transforming natural voice or accessible text inputs into actionable local volunteer opportunities.

### Key Metrics & Social Context
* **Demographic Shift:** According to the INSEE, seniors aged 65 and older constitute **22%** of the population, matching the size of the under-20 demographic.
* **Functional Challenges:** A significant portion of this demographic faces a "practical disability" in executing standard tasks of daily living, such as grocery shopping and accessing reliable transportation.
* **Severe Isolation:** According to Les Petits Frères des Pauvres,
  * **2 million** seniors live completely cut off from family and close social circles.
  * **1.5 million** seniors report zero or near-zero contact with direct descendants.
  * **9 million** seniors do not leave their residences on a daily basis, rendering them socially invisible.

---

## 🚀 Core Innovations

### 1. Multimodal Input Harmonization
The platform processes heterogeneous inputs (natural speech, non-verbal iconography) and normalizes them via Generative AI into a consistent dual-format (high-clarity text + synthesized speech).This guarantees that volunteers receive clear, professional, and emotionally contextualized data regardless of the user's physical or technical limitations.
### 2. Algorithmic Dynamic Routing
To optimize fulfillment rates, the application bypasses static geographical boundaries. Instead, a dynamic radius calculation analyzes local population density in real-time to adjust the broadcast perimeter, maximizing volunteer acquisition across both urban and rural environments.

---

## 📈 Expected Impact & Value Proposition

### 1. Eradicating Social Invisibility
By providing a frictionless link to the outside world, the platform targets the **9 million seniors** who face daily confinement. It restores their presence within the local ecosystem and converts passive isolation into active community engagement.

### 2. Restoring Autonomy and Dignity
The system bypasses complex smartphone interfaces, neutralizing the "practical disability" caused by digital exclusion. Features like customizable virtual voices and adapted keyboards give non-verbal or mute users an autonomous, expressive, and dignified voice in their neighborhood.

### 3. Rebuilding the Local Social Fabric
By reconnecting the **2 million seniors** completely cut off from traditional family structures, the app fosters deep, empathetic human interactions. Every functional mission (e.g., grocery shopping, transportation) doubles as an opportunity for meaningful intergenerational conversation.

### 4. Territorial Equity (Urban & Rural Resilience)
The dynamic radius routing algorithms ensure that community aid is not restricted to dense urban areas. Seniors living in isolated, low-density rural zones gain identical access to support by automatically unlocking vehicle-equipped volunteers within a **15–20 km perimeter**.

---

## 🛠️ Functional Architecture & Workflow

### Phase 1: High-Accessibility Ingestion
The user interface features an optimized layout with two primary input pathways:
* **Voice Channel:** Captures and streams natural, unstructured spoken requests.
* **Accessible Written Channel:** Tailored for non-verbal or mute users, utilizing high-contrast help icons and an adapted virtual keyboard.

### Phase 2: Generative AI Processing & Format Harmonization
The backend pipeline processes inputs to generate a standardized "Double Format" output:
* **Audio-to-Text Pipeline:** Generates precise text transcripts from natural speech inputs.
* **Text-to-Speech (TTS) Pipeline:** Polishes written text for clarity and syntax, instantly generating a warm, natural virtual voice that allows non-verbal users to select their preferred vocal tone.

### Phase 3: Density-Based Radius Optimization
The system dynamically computes the alert dispatch area based on geolocation data:
* **High-Density (Urban):** Restricts the radius to **1–2 km** to minimize noise and leverage immediate walking-distance volunteers.
* **Low-Density (Rural):** Automatically scales the radius up to **15–20 km** to target mobile, vehicle-equipped volunteers.

### Phase 4: Volunteer Dispatch & Execution
* **Dual-Format Delivery:** Volunteers receive the request with both text and audio capabilities (preserving the senior's authentic voice or the customized AI voice) to retain a strong human connection.
* **Concurrency Control:** Upon volunteer acceptance, the mission is securely and instantly withdrawn from the network pool to avoid duplicate fulfillment.
* **Secure Navigation:** The application generates an optimized, secure route map to the destination.
* **On-Site Communication Framework:** Upon arrival, an adapted text-chat module enables seamless, dignified interaction with non-verbal or mute seniors.



