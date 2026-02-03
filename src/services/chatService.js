// This service handles integration with Google Gemini API
export class ChatService {
  constructor() {
    // Using the API key from environment variables
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
    
    // Vérifier si la clé API est définie
    if (!this.apiKey) {
      console.error("Clé API Gemini non définie ! Veuillez définir REACT_APP_GEMINI_API_KEY dans .env");
    }
  }

  // Get a response from the AI model
  async getChatResponse(messages) {
    try {
      // Vérifier si la clé API est définie
      if (!this.apiKey) {
        throw new Error("Clé API Gemini non définie. Veuillez configurer votre clé dans le fichier .env");
      }
      
      // Convertir les messages au format Gemini
      const contents = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            maxOutputTokens: 2048
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur de l'API Gemini:", data);
        throw new Error(data.error?.message || "Erreur de l'API Gemini");
      }

      // Extraire le texte de la réponse
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("Réponse vide de l'API Gemini");
      }

      return responseText;
    } catch (error) {
      console.error("Error getting chat response:", error);
      const errorMessage = error.message || "Erreur inconnue lors de la communication avec l'API";
      const errorObject = new Error(errorMessage);
      errorObject.message = errorMessage;
      throw errorObject;
    }
  }

  // Traite une réponse multimodale (contient potentiellement des images)
  processMultimodalResponse(contentArray) {
    let result = {
      text: "",
      images: []
    };

    for (const content of contentArray) {
      if (content.type === "text") {
        result.text += content.text;
      } else if (content.type === "image_url" && content.image_url && content.image_url.url) {
        result.images.push(content.image_url.url);
      }
    }

    console.log("Réponse traitée:", result);
    return result;
  }
}

// Create a single instance of the service
const chatServiceInstance = new ChatService();

// Export the instance as default
export default chatServiceInstance; 