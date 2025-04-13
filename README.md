# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

---

## Project Specific Information

### Utility Functions

#### Populating Predefined Challenges

The application uses a list of predefined challenges for rounds where the host doesn't want to create a custom one. To populate your Firestore database (specifically the `challenges` collection) with a default set of 50 creative challenges, you can use the `populateChallenges` Cloud Function.

**Purpose:** Adds 50 challenge documents to the `/challenges` collection in Firestore. Each document has a `text` field containing the challenge string.

**Warning:** Calling this function multiple times might create duplicate challenges unless the function logic is modified to clear existing ones first (currently, it does not clear them). It's primarily intended for initial setup or resetting the challenges.

**Calling the Function (Local Emulator):**

1.  Ensure the Firebase Emulators are running (`firebase emulators:start` or `npm run emulators`).
2.  Run the following command in your terminal:

    ```bash
    curl -X POST http://localhost:5001/your-project-id/us-central1/populateChallenges -H "Content-Type: application/json" -d '{"data": {}}'
    ```
    *(Replace `your-project-id` if necessary, though a placeholder usually works with the emulator)*

    Alternatively, use the npm script (see below):
    ```bash
    npm run populate-challenges
    ```

**Calling the Function (Deployed):**

*Note: This is generally not recommended unless you add proper authentication/authorization to the function.*

If deployed, you would need to make an authenticated HTTPS request to the function's URL. The exact method depends on your client setup (e.g., using the Firebase Client SDK's `httpsCallable` or making a manual request with an ID token).

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
