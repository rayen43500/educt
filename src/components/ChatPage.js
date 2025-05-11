import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import chatService from '../services/chatService';
import WritingPlanner from './WritingPlanner';

// Fonction pour formatter le texte avec mise en évidence
const formatMessage = (text) => {
  if (!text) return '';
  
  // Remplacer les mots clés avec des balises de formatage
  const formattedText = text
    // Mettre en gras les mots entre **texte**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Mettre en italique les mots entre *texte*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Souligner les mots entre _texte_
    .replace(/_(.*?)_/g, '<u>$1</u>')
    // Colorer les conseils
    .replace(/(Conseil :.*)/g, '<span class="text-success">$1</span>')
    // Colorer les avertissements
    .replace(/(Attention :.*)/g, '<span class="text-warning">$1</span>')
    // Respecter les sauts de ligne
    .replace(/\n/g, '<br/>');
    
  return formattedText;
};

// Fonction sécurisée pour vérifier la prise en charge
const safeCheckBrowserCapabilities = () => {
  try {
    const hasBasicFeatures = typeof window !== 'undefined' && 
      window.File && 
      window.FileReader && 
      window.FileList;
    
    // Vérification sécurisée de Blob
    let hasBlobSupport = false;
    try {
      hasBlobSupport = typeof window.Blob === 'function';
    } catch (e) {
      console.error('Erreur lors de la vérification de Blob:', e);
    }
    
    // Vérification de la prise en charge de la synthèse vocale
    const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    
    // Vérification de la prise en charge de la reconnaissance vocale
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSpeechRecognition = typeof SpeechRecognition !== 'undefined';
    
    return {
      hasFileSupport: hasBasicFeatures && hasBlobSupport,
      hasSpeechSynthesis,
      hasSpeechRecognition,
      browserInfo: {
        name: navigator?.userAgent?.match(/chrome|chromium|crios/i) ? 'Chrome' :
              navigator?.userAgent?.match(/firefox|fxios/i) ? 'Firefox' :
              navigator?.userAgent?.match(/safari/i) ? 'Safari' :
              navigator?.userAgent?.match(/edg/i) ? 'Edge' :
              'Autre navigateur',
        version: 'Non détecté'
      }
    };
  } catch (e) {
    console.error('Erreur lors de la vérification du navigateur:', e);
    return { 
      hasFileSupport: false, 
      hasSpeechSynthesis: false,
      hasSpeechRecognition: false,
      browserInfo: { name: 'Erreur', version: 'Erreur' } 
    };
  }
};

const ChatPage = () => {
  // Vérification initiale sécurisée
  const { hasFileSupport, hasSpeechSynthesis, hasSpeechRecognition, browserInfo } = safeCheckBrowserCapabilities();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'system',
      content: "You are ChatAlimi, an educational assistant specialized in correcting and improving student writing. Reply in French and be supportive. Use formatting such as **bold** for important points, *italics* for emphasis, and _underlined_ for corrections. Start guidance with 'Conseil :' and warnings with 'Attention :'. When appropriate, you can send images to illustrate your explanations.\n\nTu dois te concentrer UNIQUEMENT sur la correction de textes. Ne pas proposer d'aide à la création de textes ou de productions écrites.\n\nVoici les critères d'évaluation à utiliser pour analyser et corriger les productions écrites:\n\nC1 - Adéquation avec la situation de communication:\n- Production du nombre de phrases demandé ou plus\n- Manifestation de compréhension en réalisant la tâche demandée\n- Utilisation du vocabulaire approprié à la situation de communication\n- SUGGESTIONS: Proposer des termes plus précis ou plus adaptés au contexte, suggérer d'autres manières d'exprimer les idées importantes\n- IDÉES: Suggérer des pistes pour développer certains aspects du sujet qui mériteraient plus d'attention\n\nC2 - Lisibilité de l'écriture:\n- Respect des normes au niveau des lettres minuscules et majuscules\n- SUGGESTIONS: Indiquer où ajouter des majuscules avec des exemples précis\n\nC3 - Correction linguistique:\n- Agencement correct des mots dans les phrases produites\n- Respect des accords étudiés\n- Écriture correcte des formes verbales étudiées\n- Utilisation de la ponctuation forte: point et point d'interrogation\n- SUGGESTIONS: Proposer des reformulations des phrases incorrectes, montrer les formes verbales correctes, proposer des alternatives pour enrichir la ponctuation\n- IDÉES: Proposer des variations de phrases pour exprimer la même idée de façon plus élégante\n\nC4 - Correction orthographique:\n- Écriture correcte du lexique et des mots-outils étudiés\n- SUGGESTIONS: Donner la liste des mots mal orthographiés avec leur orthographe correcte, proposer des mots de vocabulaire supplémentaires liés au sujet\n- IDÉES: Suggérer un vocabulaire plus riche et des expressions idiomatiques qui enrichiraient le texte\n\nC5 - Cohérence du texte:\n- Emploi correct des substituts pour éviter les répétitions\n- Progression des événements dans le récit\n- Absence de contradiction\n- Introduction opportune de répliques ou passages descriptifs\n- SUGGESTIONS: Proposer des substituts pour remplacer les répétitions, suggérer des connecteurs logiques pour améliorer la progression\n- IDÉES: Suggérer des transitions plus fluides entre les parties du texte, proposer des idées pour étoffer les passages qui manquent de développement\n\nC6 - Originalité des idées:\n- Créativité dans la production\n- Utilisation d'un vocabulaire riche\n- SUGGESTIONS: Proposer des idées pour enrichir certains passages, suggérer des expressions imagées ou des comparaisons pertinentes\n- IDÉES: Proposer des rebondissements inattendus, des détails surprenants, des dialogues originaux ou des descriptions innovantes pour rendre le texte plus captivant\n\nC7 - Présentation matérielle:\n- Présentation d'une copie propre sans rature ni surcharge\n- Respect des caractéristiques formelles du type d'écrit demandé\n- SUGGESTIONS: Proposer un format adapté, suggérer une meilleure disposition du texte si nécessaire\n\nPour chaque texte soumis:\n1. Analyse-le en fonction de ces 7 critères\n2. Structure ta réponse avec une section pour chaque critère\n3. Pour chaque critère, identifie les points forts et les points à améliorer\n4. TRÈS IMPORTANT: Donne des suggestions concrètes et des exemples d'alternatives pour chaque problème identifié\n5. TRÈS IMPORTANT: Propose des idées créatives pour enrichir le texte, notamment en développant les idées qui pourraient être plus approfondies\n6. Termine par une conclusion encourageante avec des conseils d'amélioration clairs\n\nNe te contente jamais de signaler les erreurs - propose toujours des alternatives concrètes, des corrections spécifiques, des exemples et des idées nouvelles pour enrichir la production écrite.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 2,
      role: 'assistant',
      content: "Bonjour ! Je suis **ChatAlimi**, ton assistant pour corriger et enrichir tes textes.\n\nPartage ton texte avec moi, et je l'analyserai selon les 7 critères d'évaluation suivants :\n\n**C1 - Adéquation avec la situation de communication**\n**C2 - Lisibilité de l'écriture**\n**C3 - Correction linguistique**\n**C4 - Correction orthographique**\n**C5 - Cohérence du texte**\n**C6 - Originalité des idées**\n**C7 - Présentation matérielle**\n\nPour chaque critère, je te donnerai :\n• Les points forts de ton texte\n• Les éléments à améliorer\n• Des suggestions concrètes de corrections\n• Des idées créatives pour enrichir ton texte\n\nPar exemple, pour une phrase comme _\"Le garçon a manger une pomme hier.\"_, je pourrais suggérer :\n\n**C3 - Correction linguistique** :\n- ✓ Points forts : Bonne structure sujet-verbe-complément\n- ⚠️ À améliorer : Conjugaison du verbe \"manger\" au passé composé\n- 📝 Suggestion : \"Le garçon a **mangé** une pomme hier.\"\n- 💡 Idée créative : \"Le jeune garçon a savouré une pomme juteuse hier après-midi, se délectant de chaque bouchée.\"\n\nTu peux aussi utiliser notre **planificateur de production écrite** pour organiser tes idées avant d'écrire.\n\nJe suis prêt à t'aider ! Partage ton texte quand tu veux.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isFileUploadEnabled] = useState(hasFileSupport);
  const [browserDetails] = useState(browserInfo);
  
  // Variables d'état pour la reconnaissance vocale et la synthèse vocale
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState(null);
  const [speakingProgress, setSpeakingProgress] = useState(0); // progression de 0 à 100
  const [isSpeechSynthesisSupported] = useState(hasSpeechSynthesis);
  const [isSpeechRecognitionSupported] = useState(hasSpeechRecognition);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voicePrefs, setVoicePrefs] = useState({
    rate: 0.92,      // Vitesse de lecture (0.1 à 2)
    pitch: 1.0,      // Ton de la voix (0 à 2)
    volume: 1.0,     // Volume (0 à 1)
    useSegmentation: true // Utiliser la segmentation pour une meilleure fiabilité
  });
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(hasSpeechSynthesis ? window.speechSynthesis : null);

  // Référence pour l'intervalle de vérification de la synthèse vocale
  const checkIntervalRef = useRef(null);

  // Variable d'état pour suivre les interruptions externes
  const [isCancellationRequested, setIsCancellationRequested] = useState(false);
  const activeSpeechRef = useRef({
    isActive: false,
    messageId: null,
    segments: [],
    currentSegment: 0,
    totalSegments: 0
  });

  // Ajouter des références pour suivre l'état actuel immédiatement
  const isSpeakingRef = useRef(false);
  const cancelRequestedRef = useRef(false);

  // Ajout de l'état pour le planificateur d'écriture
  const [showWritingPlanner, setShowWritingPlanner] = useState(false);

  // useEffect pour les avertissements si nécessaire
  useEffect(() => {
    if (!isFileUploadEnabled) {
      console.warn("Ce navigateur ne prend pas en charge toutes les fonctionnalités nécessaires pour l'upload d'images.");
      setError(`L'upload d'images n'est pas disponible sur ce navigateur. Si cette fonctionnalité est importante, essayez d'utiliser Chrome, Firefox ou Edge.`);
    }
    
    if (!isSpeechSynthesisSupported) {
      console.warn("Ce navigateur ne prend pas en charge la synthèse vocale.");
    }
    
    if (!isSpeechRecognitionSupported) {
      console.warn("Ce navigateur ne prend pas en charge la reconnaissance vocale.");
    }
  }, [isFileUploadEnabled, isSpeechSynthesisSupported, isSpeechRecognitionSupported]);

  // Corriger le problème de context suspendu de speechSynthesis dans certains navigateurs
  useEffect(() => {
    const fixSpeechSynthesis = () => {
      if (isSpeechSynthesisSupported) {
        // Certains navigateurs suspendent speechSynthesis quand la page devient inactive
        if (speechSynthesisRef.current && speechSynthesisRef.current.paused && !isCancellationRequested) {
          console.log("Détection de synthèse vocale en pause, tentative de reprise...");
          speechSynthesisRef.current.resume();
        }
      }
    };

    // Ajouter des écouteurs d'événements pour détecter les changements de visibilité
    document.addEventListener('visibilitychange', fixSpeechSynthesis);
    window.addEventListener('focus', fixSpeechSynthesis);
    window.addEventListener('blur', fixSpeechSynthesis);

    // Intervalles de vérification et correction pour les navigateurs problématiques
    const resumeInterval = setInterval(() => {
      if (isSpeaking && !isCancellationRequested) {
        fixSpeechSynthesis();
      }
    }, 1000);

    return () => {
      document.removeEventListener('visibilitychange', fixSpeechSynthesis);
      window.removeEventListener('focus', fixSpeechSynthesis);
      window.removeEventListener('blur', fixSpeechSynthesis);
      clearInterval(resumeInterval);
    };
  }, [isSpeaking, isSpeechSynthesisSupported, isCancellationRequested]);

  // useEffect pour vérifier périodiquement si la synthèse vocale est toujours active
  useEffect(() => {
    let checkInterval;
    
    if (isSpeaking) {
      // Vérifier toutes les 500ms si la synthèse vocale est toujours active
      checkInterval = setInterval(() => {
        if (speechSynthesisRef.current && !speechSynthesisRef.current.speaking) {
          // Si la synthèse vocale s'est arrêtée sans déclencher onend
          setIsSpeaking(false);
          setCurrentSpeakingMessageId(null);
          setSpeakingProgress(0);
        }
      }, 500);
    }
    
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [isSpeaking]);

  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur lors du défilement vers le bas:', err);
      // Fallback silencieux en cas d'erreur
    }
  };

  useEffect(() => {
    try {
      scrollToBottom();
    } catch (err) {
      console.error('Erreur lors du défilement automatique:', err);
    }
  }, [messages]);

  const handleImageChange = (e) => {
    if (!isFileUploadEnabled) {
      const browser = browserDetails.name || browserInfo.name;
      setError(`Votre navigateur (${browser}) ne prend pas en charge l'upload d'images. Veuillez utiliser un navigateur plus récent comme Chrome, Firefox ou Edge.`);
      return;
    }

    const file = e.target.files[0];
    console.log("Fichier sélectionné:", file);
    
    if (!file) {
      console.log("Aucun fichier sélectionné");
      return;
    }
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError(`Le fichier sélectionné (${file.type}) n'est pas une image. Types acceptés: jpg, png, gif, webp.`);
      console.log("Type de fichier non valide:", file.type);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError(`L'image est trop volumineuse (${(file.size / 1024 / 1024).toFixed(2)} Mo). Maximum 5 Mo.`);
      console.log("Fichier trop volumineux:", file.size);
      return;
    }
    
    try {
      setSelectedImage(file);
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      
      reader.onloadend = () => {
        console.log("Image chargée avec succès");
        setImagePreview(reader.result);
      };
      
      reader.onerror = (error) => {
        console.error("Erreur lors de la lecture du fichier:", error);
        setError(`Impossible de lire le fichier image (${file.name}). Erreur: ${error.message || 'inconnue'}`);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Erreur lors du traitement de l'image:", err);
      setError(`Une erreur s'est produite lors du traitement de l'image: ${err.message || 'Erreur inconnue'}`);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerImageSelect = () => {
    if (!isFileUploadEnabled) {
      const browser = browserDetails.name || browserInfo.name;
      const version = browserDetails.version || browserInfo.version;
      setError(`Votre navigateur (${browser} ${version}) ne prend pas en charge l'upload d'images. Veuillez utiliser Chrome, Firefox ou Edge.`);
      return;
    }
    
    try {
      // Vérifier si fileInputRef.current existe avant d'appeler click()
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        console.error("Référence au input file manquante");
        setError("Impossible d'ouvrir le sélecteur de fichiers. Veuillez actualiser la page ou utiliser un autre navigateur.");
      }
    } catch (err) {
      console.error("Erreur lors de l'ouverture du sélecteur de fichiers:", err);
      setError(`Erreur lors de l'ouverture du sélecteur de fichiers: ${err.message || 'Erreur inconnue'}`);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    console.log("Envoi du message - Texte:", newMessage);
    console.log("Envoi du message - Image:", selectedImage);
    
    if (newMessage.trim() === '' && !selectedImage) {
      console.log("Aucun contenu à envoyer");
      return;
    }
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message with image if selected
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: newMessage,
      timestamp: timestamp,
      image: imagePreview
    };
    
    console.log("Message utilisateur créé:", userMessage);
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setError(null);
    clearSelectedImage();
    
    try {
      // Préparer un message pour l'API qui décrit l'image si présente
      let messageForAPI = newMessage;
      
      if (userMessage.image) {
        console.log("Image détectée dans le message");
        messageForAPI += "\n\n[L'utilisateur a joint une image à ce message]";
      }
      
      // Format messages for the API (only include role and content)
      const apiMessages = messages
        .filter(msg => msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant')
        .map(({ role, content }) => ({ role, content }));
      
      // Add the new user message
      apiMessages.push({ role: userMessage.role, content: messageForAPI });
      
      // Vérifier si la demande semble être une correction de texte
      const isCorrectionRequest = messageForAPI.toLowerCase().includes('corrige') || 
                                  messageForAPI.toLowerCase().includes('correction') ||
                                  messageForAPI.toLowerCase().includes('évaluer') ||
                                  messageForAPI.toLowerCase().includes('critères');
      
      // Si c'est une demande de correction, ajouter un message système spécifique
      if (isCorrectionRequest) {
        apiMessages.push({
          role: 'system',
          content: "Pour cette correction, analyse le texte de l'élève selon les 7 critères d'évaluation mentionnés précédemment. Structure ta réponse en 7 sections, une pour chaque critère. Pour chaque critère, identifie les points forts et les points à améliorer. Utilise des exemples concrets tirés du texte de l'élève. Termine par une conclusion encourageante et constructive. Utilise le formatage (gras, italique, souligné) pour mettre en évidence les éléments importants."
        });
      }
      
      console.log("Appel de l'API avec les messages:", apiMessages);
      
      // Get response from AI
      const response = await chatService.getChatResponse(apiMessages);
      
      console.log("Réponse reçue de l'API:", response);
      
      // Add bot response - handle both text-only and multimodal responses
      const botResponse = {
        id: messages.length + 2,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Check if response is a multimodal object
      if (typeof response === 'object' && response !== null && response.text !== undefined) {
        // C'est une réponse multimodale avec potentiellement des images
        botResponse.content = response.text;
        
        // Ajouter les images s'il y en a
        if (response.images && response.images.length > 0) {
          botResponse.images = response.images;
        }
      } else {
        // Réponse texte standard
        botResponse.content = response;
      }
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (err) {
      console.error('Error getting chat response:', err);
      // Utiliser un message d'erreur par défaut si l'erreur ou le message d'erreur est indéfini
      const errorMessage = err?.message || "Une erreur s'est produite lors de la communication avec l'IA";
      setError(`Désolé, ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour lire à haute voix un message
  const handleSpeakMessage = (text, messageId) => {
    if (!isSpeechSynthesisSupported) {
      setError('La synthèse vocale n\'est pas prise en charge par votre navigateur. Essayez Chrome ou Edge.');
      return;
    }
    
    if (isSpeaking) {
      // Ajout d'un log pour identifier d'où vient l'annulation
      console.log("Annulation demandée de la lecture en cours. Source: handleSpeakMessage");
      
      // Marquer comme une annulation explicite de l'utilisateur
      setIsCancellationRequested(true);
      cancelRequestedRef.current = true;
      
      // Arrêter la lecture en cours
      try {
        speechSynthesisRef.current.cancel();
        console.log("Annulation réussie de la synthèse vocale");
      } catch (err) {
        console.error("Erreur lors de l'annulation de la synthèse vocale:", err);
      }
      
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentSpeakingMessageId(null);
      setSpeakingProgress(0);
      
      // Réinitialiser la référence de suivi
      activeSpeechRef.current = {
        isActive: false,
        messageId: null,
        segments: [],
        currentSegment: 0,
        totalSegments: 0
      };
      
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      
      // Réinitialiser l'état d'annulation après un court délai
      setTimeout(() => {
        setIsCancellationRequested(false);
        cancelRequestedRef.current = false;
        console.log("État d'annulation réinitialisé");
      }, 500);
      
      return;
    }
    
    // Initialiser l'état de lecture immédiatement avec les références
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    setCurrentSpeakingMessageId(messageId);
    setIsCancellationRequested(false);
    cancelRequestedRef.current = false;
    
    try {
      // Force activer l'audio sur l'appareil avec un son silencieux
      // Cela est nécessaire sur certains navigateurs/appareils
      try {
        // Créer un court son pour activer l'audio du système
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Configurer un son très court et à peine audible
        gainNode.gain.value = 0.05; // Volume suffisant pour activer l'audio
        oscillator.frequency.value = 440; // Fréquence audible (La 440Hz)
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Jouer le son pendant 100ms
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close().catch(err => console.log("Erreur fermeture audio:", err));
        }, 100);
        
        // Forcer le déverrouillage des contrôles audio sur iOS et Safari
        if (typeof document !== 'undefined') {
          const unlockAudio = () => {
            if (audioContext.state === 'suspended') {
              audioContext.resume().then(() => {
                console.log('Audio context déverrouillé avec succès');
              }).catch(err => {
                console.warn('Échec du déverrouillage audio:', err);
              });
            }
          };
          
          // Attacher des écouteurs d'événements temporaires pour le déverrouillage
          const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
          const cleanupFuncs = events.map(event => {
            const handler = unlockAudio;
            document.addEventListener(event, handler, { once: true });
            return () => document.removeEventListener(event, handler);
          });
          
          // Nettoyer les écouteurs après 5 secondes
          setTimeout(() => {
            cleanupFuncs.forEach(cleanup => cleanup());
          }, 5000);
        }
      } catch (err) {
        console.warn("Impossible d'activer l'audio du système:", err);
        // On continue malgré l'erreur, car cela pourrait quand même fonctionner
      }
      
      // Nettoyer le texte pour la synthèse vocale
      // 1. Supprimer les balises HTML et entités HTML
      let cleanText = text.replace(/<\/?[^>]+(>|$)/g, " ");
      cleanText = cleanText.replace(/&[a-z]+;/g, " ");
      
      // 2. Remplacer les caractères spéciaux de formatage par des espaces
      cleanText = cleanText.replace(/[\*_\[\]\(\)\{\}\#\+\~\`]/g, " ");
      
      // 3. Conserver la ponctuation essentielle et les accents pour une lecture correcte
      cleanText = cleanText.replace(/[^\w\s.,!?;:«»""''\-–—àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ]/g, " ");
      
      // 4. Supprimer les espaces multiples et les espaces avant la ponctuation
      cleanText = cleanText.replace(/\s+/g, " ");
      cleanText = cleanText.replace(/\s+([.,!?;:])/g, "$1");
      cleanText = cleanText.trim();
      
      // 5. Améliorations spécifiques pour la lecture
      // Ajouter une pause après les points pour une meilleure séparation
      cleanText = cleanText.replace(/\./g, ". ");
      // Ajouter une pause après les questions/exclamations
      cleanText = cleanText.replace(/[!?]/g, "$& ");
      
      console.log("Texte original:", text);
      console.log("Texte nettoyé pour lecture:", cleanText);
      
      // Marquer le message comme "en cours de lecture"
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setCurrentSpeakingMessageId(messageId);
      setSpeakingProgress(0);
      
      // Annuler toute lecture précédente
      speechSynthesisRef.current.cancel();
      
      // Obtenir les voix disponibles
      const getVoices = () => {
        // Récupérer les voix disponibles
        const voices = speechSynthesisRef.current.getVoices();
        
        // Chercher une voix française
        let frenchVoice = null;
        
        for (const voice of voices) {
          // Priorité aux voix françaises
          if (voice.lang.includes('fr') || voice.lang.includes('FR')) {
            frenchVoice = voice;
            // Priorité aux voix féminines pour plus de clarté
            if (voice.name.includes('female') || voice.name.toLowerCase().includes('femme')) {
              break;
            }
          }
        }
        
        return frenchVoice;
      };
      
      // Solution par lecture de segments courts pour garantir que tout le texte est lu
      const readTextInSegments = () => {
        // Diviser le texte en segments plus courts et gérables
        const words = cleanText.split(/\s+/);
        let segments = [];
        
        // Détecter le navigateur pour adapter les stratégies
        const isEdge = navigator.userAgent.indexOf("Edg") > -1;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        // Adapter la longueur des segments selon le navigateur
        const wordsPerSegment = (isEdge || isSafari) ? 5 : 7; // Segments encore plus courts pour Edge et Safari
        
        console.log("Navigateur détecté:", isEdge ? "Edge" : isSafari ? "Safari" : "Autre", "- Segments de", wordsPerSegment, "mots");
        
        // Diviser le texte en segments
        for (let i = 0; i < words.length; i += wordsPerSegment) {
          const segmentCandidate = words.slice(i, i + wordsPerSegment).join(" ").trim();
          // N'ajouter que les segments non vides
          if (segmentCandidate) {
            segments.push(segmentCandidate);
          }
        }
        
        console.log("Segments à lire:", segments.length, segments);
        
        // Le nombre total de segments pour calculer la progression
        const totalSegments = segments.length;
        
        // Mettre à jour la référence de suivi
        activeSpeechRef.current = {
          isActive: true,
          messageId: messageId,
          segments: segments,
          currentSegment: 0,
          totalSegments: totalSegments,
          lastActivity: Date.now()
        };
        
        // Réinitialiser l'état d'annulation
        setIsCancellationRequested(false);
        
        // Fonction pour lire chaque segment séquentiellement
        const readNextSegment = (index = 0) => {
          // Vérifier si la lecture doit se poursuivre en utilisant les références
          if (cancelRequestedRef.current || !isSpeakingRef.current || index >= totalSegments) {
            console.log("Lecture terminée ou annulée. isSpeaking:", isSpeakingRef.current, "isCancellationRequested:", cancelRequestedRef.current, "index:", index, "totalSegments:", totalSegments);
            
            // Ne pas modifier l'état si une annulation explicite a déjà été effectuée
            if (!cancelRequestedRef.current) {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              setCurrentSpeakingMessageId(null);
              setSpeakingProgress(100);
            }
            
            // Mettre à jour la référence de suivi
            activeSpeechRef.current.isActive = false;
            activeSpeechRef.current.currentSegment = 0;
            
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            return;
          }
          
          // Mettre à jour la progression
          const progress = Math.floor((index / totalSegments) * 100);
          setSpeakingProgress(progress);
          
          // Mettre à jour le segment en cours dans la référence
          activeSpeechRef.current.currentSegment = index;
          
          // Créer l'utterance pour ce segment
          const utterance = new SpeechSynthesisUtterance(segments[index]);
          
          // Base configuration pour tous les navigateurs
          utterance.lang = 'fr-FR';
          
          // Récupérer une voix française si disponible
          const frenchVoice = getVoices();
          if (frenchVoice) {
            utterance.voice = frenchVoice;
          } else {
            // Si aucune voix française n'est trouvée, on force la langue
            utterance.lang = 'fr-FR';
          }
          
          // Détecter le navigateur pour adapter les stratégies
          const isEdge = navigator.userAgent.indexOf("Edg") > -1;
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          
          // Appliquer les préférences utilisateur avec volume maximisé
          utterance.rate = voicePrefs.rate;
          if (isEdge || isSafari) {
            // Edge et Safari ont des problèmes avec certains taux de lecture
            utterance.rate = Math.min(Math.max(voicePrefs.rate, 0.7), 1.1); // Restreindre la plage
          }
          
          utterance.pitch = voicePrefs.pitch;
          utterance.volume = 1.0; // Toujours volume maximum pour éviter les problèmes d'audio
          
          // Dans Safari, utiliser une pause plus longue entre les segments
          const pauseDuration = isSafari ? 300 : isEdge ? 200 : 150;
          
          console.log(`Lecture du segment ${index + 1}/${totalSegments}: "${segments[index]}"`);
          
          // Gérer la fin de la lecture d'un segment
          utterance.onstart = () => {
            console.log(`Début de lecture du segment ${index + 1}`);
            activeSpeechRef.current.lastActivity = Date.now();
          };
          
          utterance.onend = () => {
            console.log(`Fin du segment ${index + 1}, isSpeaking:`, isSpeakingRef.current);
            
            // Si l'état a changé entretemps, gérer proprement l'arrêt
            if (!isSpeakingRef.current) {
              console.log(`Le segment ${index + 1} s'est terminé mais la lecture a été annulée entre-temps`);
              return;
            }
            
            // Petite pause avant le prochain segment pour une meilleure fluidité
            const timeoutId = setTimeout(() => {
              // Double vérification pour éviter des appels après annulation
              if (isSpeakingRef.current && !cancelRequestedRef.current) {
                // Vérifier que la référence est toujours valide
                if (activeSpeechRef.current.isActive && activeSpeechRef.current.messageId === messageId) {
                  try {
                    readNextSegment(index + 1);
                  } catch (err) {
                    console.error(`Erreur lors de la lecture du segment ${index + 1}:`, err);
                    // Tenter de continuer malgré l'erreur après un délai plus long
                    setTimeout(() => {
                      if (isSpeakingRef.current && !cancelRequestedRef.current) {
                        try {
                          readNextSegment(index + 1);
                        } catch (e) {
                          console.error("Deuxième échec de lecture:", e);
                          setIsSpeaking(false);
                          isSpeakingRef.current = false;
                          setError("Impossible de continuer la lecture après plusieurs tentatives.");
                        }
                      }
                    }, 1000);
                  }
                } else {
                  console.log("La référence de suivi a changé, arrêt de la séquence de lecture");
                }
              } else {
                console.log("La lecture a été annulée pendant la pause entre segments");
              }
            }, pauseDuration);
            
            // Stocker l'ID du timeout pour pouvoir l'annuler si nécessaire
            const timeouts = activeSpeechRef.current.timeouts || [];
            activeSpeechRef.current.timeouts = [...timeouts, timeoutId];
          };
          
          // Gérer les erreurs lors de la lecture d'un segment
          utterance.onerror = (event) => {
            console.error("Erreur de lecture pour le segment", index, event);
            console.log("Type d'erreur:", event.error, "Message:", event.message);
            
            // Si c'est l'erreur "canceled", possiblement due à une annulation directe
            if (event.error === 'canceled' || event.error === 'interrupted') {
              console.log("Annulation détectée, vérification si elle était intentionnelle...");
              
              // Si ce n'était pas une annulation explicite, tenter de récupérer
              if (!cancelRequestedRef.current && isSpeakingRef.current) {
                console.log("Annulation non intentionnelle détectée, tentative de reprise...");
                
                // Attendre un peu plus longtemps avant de réessayer
                setTimeout(() => {
                  if (isSpeakingRef.current && !cancelRequestedRef.current) {
                    // Continuer avec le segment actuel ou le suivant selon le contexte
                    try {
                      readNextSegment(index);
                    } catch (err) {
                      console.error("Impossible de reprendre après annulation:", err);
                    }
                  }
                }, 800);
              } else {
                console.log("Annulation intentionnelle confirmée, arrêt de la lecture");
              }
              return;
            }
            
            // Pour les autres types d'erreurs, continuer avec le segment suivant
            if (isSpeakingRef.current && !cancelRequestedRef.current) {
              console.warn(`Erreur, passage au segment ${index + 2}`);
              setTimeout(() => {
                if (isSpeakingRef.current && !cancelRequestedRef.current) {
                  try {
                    readNextSegment(index + 1);
                  } catch (err) {
                    console.error("Impossible de continuer après erreur:", err);
                  }
                }
              }, pauseDuration * 2); // Pause plus longue après une erreur
            }
          };
          
          // Lire le segment
          speechSynthesisRef.current.speak(utterance);
          
          // Force le navigateur à jouer le son immédiatement
          if (!speechSynthesisRef.current.speaking) {
            speechSynthesisRef.current.pause();
            speechSynthesisRef.current.resume();
          }
        };
        
        // Commencer la lecture séquentielle
        if (segments.length > 0) {
          // S'assurer que l'état est initialisé AVANT le setTimeout
          // Utiliser des références pour un accès immédiat
          
          // Affirmer explicitement l'état de lecture avant le timeout
          if (!isSpeakingRef.current) {
            console.log("Initialisation explicite de l'état de lecture");
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            setCurrentSpeakingMessageId(messageId);
          }
          
          // Réinitialiser explicitement l'état d'annulation
          if (cancelRequestedRef.current) {
            console.log("Réinitialisation de l'état d'annulation avant démarrage");
            setIsCancellationRequested(false);
            cancelRequestedRef.current = false;
          }
          
          // Attendre un court instant avant de démarrer la lecture
          console.log("Programmation du démarrage de lecture dans 300ms");
          setTimeout(() => {
            // Double vérification explicite de l'état en utilisant les références
            console.log("Vérification avant démarrage - isSpeaking:", isSpeakingRef.current, "isCancellationRequested:", cancelRequestedRef.current);
            
            // Vérifier que la lecture n'a pas été annulée entre-temps
            if (!isSpeakingRef.current) {
              console.log("État de lecture non défini, définition explicite");
              setIsSpeaking(true);
              isSpeakingRef.current = true;
              setCurrentSpeakingMessageId(messageId);
            }
            
            if (cancelRequestedRef.current) {
              console.log("Annulation demandée pendant l'initialisation, abandon");
              setIsSpeaking(false);
              isSpeakingRef.current = false;
              console.log("La lecture a été annulée avant le début de la séquence");
            } else {
              // Vérifier explicitement que la synthèse vocale est disponible
              if (speechSynthesisRef.current) {
                console.log("Synthèse vocale disponible, démarrage de la lecture");
                try {
                  readNextSegment(0);
                } catch (err) {
                  console.error("Erreur au démarrage de la lecture:", err);
                  setIsSpeaking(false);
                  isSpeakingRef.current = false;
                  setError("Impossible de démarrer la lecture vocale: " + (err.message || "erreur inconnue"));
                }
              } else {
                console.error("Référence à la synthèse vocale perdue, tentative de récupération");
                // Tenter de récupérer la référence
                speechSynthesisRef.current = window.speechSynthesis;
                if (speechSynthesisRef.current) {
                  console.log("Récupération réussie, démarrage de la lecture");
                  try {
                    readNextSegment(0);
                  } catch (e) {
                    console.error("Erreur au démarrage après récupération:", e);
                    setIsSpeaking(false);
                    isSpeakingRef.current = false;
                    setError("Erreur lors de l'initialisation de la synthèse vocale");
                  }
                } else {
                  console.error("Impossible de récupérer la synthèse vocale");
                  setIsSpeaking(false);
                  isSpeakingRef.current = false;
                  setError("La synthèse vocale n'est plus disponible. Veuillez actualiser la page.");
                }
              }
            }
          }, 300);
        } else {
          // S'il n'y a pas de segments valides (texte vide ou nettoyé en vide)
          console.log("Aucun segment valide à lire.");
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          setCurrentSpeakingMessageId(null);
          setSpeakingProgress(100);
          activeSpeechRef.current.isActive = false;
        }
        
        // Surveiller si la lecture s'arrête de manière inattendue
        // Nettoyer l'intervalle précédent s'il existe
        if (checkIntervalRef.current) {
          console.log("Nettoyage de l'intervalle de vérification précédent");
          clearInterval(checkIntervalRef.current);
        }
        
        checkIntervalRef.current = setInterval(() => {
          if (!isSpeakingRef.current || cancelRequestedRef.current) {
            console.log("Arrêt de la surveillance: plus en mode lecture ou annulation demandée");
            clearInterval(checkIntervalRef.current);
            return;
          }
          
          if (!speechSynthesisRef.current.speaking && isSpeakingRef.current && !cancelRequestedRef.current) {
            console.log("La lecture s'est arrêtée de manière inattendue, tentative de reprise...");
            console.log("État actuel - speaking:", speechSynthesisRef.current.speaking, "paused:", speechSynthesisRef.current.paused);
            
            // Tenter de reprendre la lecture là où elle s'est arrêtée en utilisant la référence de suivi
            const currentIndex = activeSpeechRef.current.currentSegment;
            
            // Vérifier que l'on est bien dans le bon contexte de lecture
            if (activeSpeechRef.current.isActive && 
                activeSpeechRef.current.messageId === messageId &&
                currentIndex < activeSpeechRef.current.totalSegments) {
              
              console.log(`Reprise à partir du segment ${currentIndex + 1}/${activeSpeechRef.current.totalSegments}`);
              speechSynthesisRef.current.cancel(); // Annuler tout ce qui pourrait être en attente
              
              // Attendre un court instant avant la reprise
              setTimeout(() => {
                if (isSpeakingRef.current && !cancelRequestedRef.current) { // Vérifier encore si toujours en mode lecture
                  readNextSegment(currentIndex);
                } else {
                  console.log("La lecture a été annulée pendant la tentative de reprise");
                }
              }, 200);
            } else {
              console.log("Impossible de reprendre: références de suivi invalides ou lecture terminée");
              clearInterval(checkIntervalRef.current);
            }
            
            // Il faut arrêter l'intervalle pour éviter des reprises multiples
            clearInterval(checkIntervalRef.current);
          }
        }, 2000);
      };
      
      // Attendre que les voix soient chargées si nécessaire
      if (speechSynthesisRef.current.getVoices().length === 0) {
        // Essayer de forcer le chargement des voix
        speechSynthesisRef.current.onvoiceschanged = () => {
          console.log("Voix chargées:", speechSynthesisRef.current.getVoices().length);
          // Démarrer la lecture par segments une fois les voix chargées
          readTextInSegments();
          speechSynthesisRef.current.onvoiceschanged = null;
        };
        
        // Si après 2 secondes les voix ne sont toujours pas chargées, tenter quand même la lecture
        setTimeout(() => {
          if (speechSynthesisRef.current.getVoices().length === 0) {
            console.warn("Impossible de charger les voix, tentative de lecture sans voix spécifique");
            readTextInSegments();
          }
        }, 2000);
      } else {
        console.log("Voix disponibles:", speechSynthesisRef.current.getVoices().length);
        // Voix déjà chargées, démarrer immédiatement
        readTextInSegments();
      }
    } catch (err) {
      console.error('Erreur lors de la synthèse vocale:', err);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentSpeakingMessageId(null);
      setSpeakingProgress(0);
      setError(`Problème de lecture audio: ${err.message || 'erreur inconnue'}. Vérifiez le volume de votre appareil.`);
    }
  };
  
  // Fonction pour démarrer/arrêter la reconnaissance vocale
  const startSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported) {
      setError('La reconnaissance vocale n\'est pas prise en charge par votre navigateur. Essayez Chrome ou Edge.');
      return;
    }
    
    // Définir la classe de reconnaissance vocale appropriée
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (isListening) {
      // Arrêter la reconnaissance en cours
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }
    
    try {
      // Créer une nouvelle instance de reconnaissance vocale
      recognitionRef.current = new SpeechRecognition();
      
      // Configurer la reconnaissance
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      // Indiquer à l'utilisateur que l'enregistrement a commencé
      setError(null); // Effacer les messages d'erreur précédents
      
      // Gérer les résultats
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const isFinal = event.results[0].isFinal;
        
        // Afficher le texte reconnu uniquement lorsqu'il est finalisé
        if (isFinal) {
          // Traiter le texte reconnu (première lettre en majuscule si c'est le début d'un message)
          let processedText = transcript;
          if (newMessage.trim() === '') {
            processedText = transcript.charAt(0).toUpperCase() + transcript.slice(1);
          }
          
          setNewMessage((prev) => {
            const updatedMessage = prev.trim() === '' ? 
              processedText : 
              `${prev} ${processedText}`;
            return updatedMessage;
          });
        }
      };
      
      // Gérer les événements de début et de fin
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      // Gérer les erreurs
      recognitionRef.current.onerror = (event) => {
        console.error('Erreur de reconnaissance vocale:', event);
        setIsListening(false);
        
        // Messages d'erreur plus descriptifs
        if (event.error === 'no-speech') {
          setError('Aucune parole détectée. Veuillez parler plus fort ou vérifier votre microphone.');
        } else if (event.error === 'audio-capture') {
          setError('Impossible d\'accéder au microphone. Vérifiez les permissions de votre navigateur.');
        } else if (event.error === 'not-allowed') {
          setError('L\'accès au microphone a été refusé. Vérifiez les permissions de votre navigateur.');
        } else {
          setError(`Erreur lors de la reconnaissance vocale: ${event.error}`);
        }
      };
      
      // Démarrer la reconnaissance
      recognitionRef.current.start();
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la reconnaissance vocale:', err);
      setError(`La reconnaissance vocale n'est pas disponible ou une erreur s'est produite: ${err.message}`);
    }
  };

  // Nettoyage lors de l'annulation explicite
  const cancelSpeech = () => {
    // Annuler tous les timeouts en attente
    if (activeSpeechRef.current.timeouts && activeSpeechRef.current.timeouts.length > 0) {
      activeSpeechRef.current.timeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      activeSpeechRef.current.timeouts = [];
    }
    
    // Marquer l'annulation comme intentionnelle avec les deux mécanismes
    setIsCancellationRequested(true);
    cancelRequestedRef.current = true;
    
    // Nettoyer l'intervalle de vérification
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    // Arrêter la synthèse vocale
    try {
      speechSynthesisRef.current.cancel();
    } catch (err) {
      console.error("Erreur lors de l'annulation de la synthèse vocale:", err);
    }
    
    // Réinitialiser les états avec les deux mécanismes
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setCurrentSpeakingMessageId(null);
    setSpeakingProgress(0);
    
    // Réinitialiser la référence
    activeSpeechRef.current = {
      isActive: false,
      messageId: null,
      segments: [],
      currentSegment: 0,
      totalSegments: 0,
      timeouts: []
    };
    
    // Réinitialiser l'état d'annulation après un délai
    setTimeout(() => {
      setIsCancellationRequested(false);
      cancelRequestedRef.current = false;
    }, 500);
  };

  // Ajouter un useEffect pour créer un "watchdog" qui garde la lecture active
  useEffect(() => {
    // Ne rien faire si la synthèse vocale n'est pas supportée
    if (!isSpeechSynthesisSupported) return;
    
    // Si on est supposé être en train de lire
    if (isSpeakingRef.current && !cancelRequestedRef.current) {
      let watchdogTimer = null;
      
      // Mettre en place un watchdog qui vérifie régulièrement l'état de la synthèse vocale
      const watchdog = () => {
        if (!isSpeakingRef.current) {
          // Si la référence indique qu'on ne parle plus, arrêter le watchdog
          console.log("Watchdog: L'état de parole a changé, arrêt de la surveillance");
          return;
        }
        
        // Si la synthèse est supposée être active mais ne l'est pas
        if (activeSpeechRef.current.isActive && !speechSynthesisRef.current.speaking) {
          // Vérifier s'il s'agit d'une pause normale entre segments
          const timeSinceLastActivity = Date.now() - (activeSpeechRef.current.lastActivity || 0);
          console.log(`Watchdog: Vérification d'activité, temps écoulé: ${timeSinceLastActivity}ms`);
          
          // Si ça fait plus de 800ms qu'il n'y a pas eu d'activité, c'est anormal
          if (timeSinceLastActivity > 800) {
            console.log("Watchdog: Détection d'un arrêt anormal de la synthèse vocale, tentative de reprise");
            
            // Récupérer le segment actuel et essayer de le rejouer
            const currentIndex = activeSpeechRef.current.currentSegment;
            const totalSegments = activeSpeechRef.current.totalSegments;
            
            if (currentIndex < totalSegments) {
              console.log(`Watchdog: Reprise du segment ${currentIndex + 1}/${totalSegments}`);
              const segmentToRead = activeSpeechRef.current.segments[currentIndex];
              
              // Créer une nouvelle utterance pour ce segment
              try {
                const utterance = new SpeechSynthesisUtterance(segmentToRead);
                utterance.lang = 'fr-FR';
                utterance.rate = voicePrefs.rate;
                utterance.volume = 1.0;
                
                // Récupérer une voix française si disponible
                try {
                  const voices = speechSynthesisRef.current.getVoices();
                  const frenchVoice = voices.find(voice => voice.lang.includes('fr'));
                  if (frenchVoice) {
                    utterance.voice = frenchVoice;
                  }
                } catch (e) {
                  console.warn("Watchdog: Impossible de définir la voix", e);
                }
                
                // Enregistrer l'heure de la dernière activité
                activeSpeechRef.current.lastActivity = Date.now();
                
                // Lire le segment d'urgence
                speechSynthesisRef.current.cancel(); // Annuler tout ce qui pourrait être en cours
                speechSynthesisRef.current.speak(utterance);
              } catch (err) {
                console.error("Watchdog: Erreur lors de la tentative de reprise", err);
              }
            } else {
              console.log("Watchdog: Tous les segments ont été lus, arrêt de la surveillance");
              clearInterval(watchdogTimer);
            }
          }
        } else if (speechSynthesisRef.current.speaking) {
          // Si la synthèse est active, mettre à jour l'heure de la dernière activité
          activeSpeechRef.current.lastActivity = Date.now();
        }
      };
      
      // Lancer le watchdog toutes les 500ms
      watchdogTimer = setInterval(watchdog, 500);
      
      // Nettoyer le watchdog quand l'état change
      return () => {
        if (watchdogTimer) {
          clearInterval(watchdogTimer);
        }
      };
    }
  }, [isSpeakingRef.current, cancelRequestedRef.current, isSpeechSynthesisSupported, voicePrefs.rate]);

  // Fonction pour le mode production écrite avec processus en plusieurs étapes
  const activateIntegratedProductionMode = () => {
    // Commencer par proposer des sujets, pas directement le planificateur
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Ajouter un message utilisateur
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: "Je souhaite faire une production écrite. Aide-moi à choisir un sujet et à développer mon texte.",
      timestamp: timestamp
    };
    
    // Ajouter l'instruction système pour le mode production
    const systemMessage = {
      id: messages.length + 2,
      role: 'system',
      content: "L'élève commence une production écrite. Guide-le par étapes : 1) Propose plusieurs sujets adaptés à son niveau, 2) Une fois le sujet choisi, suggère d'utiliser le plan d'écriture ou propose un plan simple, 3) Aide à développer chaque partie avec des conseils précis et des suggestions pour enrichir le vocabulaire.",
      timestamp: timestamp
    };
    
    // Mettre à jour les messages
    setMessages(prev => [...prev, userMessage]);
    
    // Simuler une réponse de l'assistant proposant des sujets
    setIsLoading(true);
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 3,
        role: 'assistant',
        content: "Je vais t'aider à créer une belle production écrite ! Commençons par choisir un sujet intéressant. Voici quelques idées :\n\n1. **Une aventure à la plage** - Tu pourrais raconter une journée exceptionnelle avec une découverte surprenante.\n\n2. **Mon ami(e) imaginaire** - Décris comment est cet ami, ce que vous faites ensemble.\n\n3. **Un voyage dans le futur** - Imagine comment sera le monde dans 100 ans.\n\n4. **Le jour où j'ai aidé quelqu'un** - Raconte une histoire où tu as fait une bonne action.\n\n5. **Un animal extraordinaire** - Invente un animal avec des pouvoirs spéciaux.\n\nQuel sujet te plairait le plus ? Tu peux aussi proposer ton propre sujet si tu as une autre idée !",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };
  
  // Fonction pour activer le planificateur d'écriture
  const toggleWritingPlanner = () => {
    setShowWritingPlanner(!showWritingPlanner);
    // Masquer les modes spécifiques si le planificateur est ouvert
    if (!showWritingPlanner) {
      // Si on ouvre le planificateur, on peut ajouter un message de guidage
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          role: 'assistant',
          content: "Le planificateur de production écrite va t'aider à organiser ton texte. Tu pourras définir l'état initial et la suite des événements de ton récit. Une fois terminé, le plan sera envoyé dans notre conversation et je pourrai t'aider à développer ton texte et à l'améliorer.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Fonction pour le mode correction
  const activateCorrectionMode = () => {
    // Envoyer directement une demande de correction
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Ajouter un message utilisateur
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: "Je souhaite faire corriger un texte selon les 7 critères d'évaluation.",
      timestamp: timestamp
    };
    
    // Ajouter l'instruction système pour le mode correction
    const systemMessage = {
      id: messages.length + 2,
      role: 'system',
      content: "L'élève souhaite que tu corriges un texte selon les 7 critères. Demande-lui de partager son texte. Après réception du texte, analyse-le en fonction des 7 critères d'évaluation détaillés plus haut. Structure ta réponse en 7 sections, une pour chaque critère. Précise les points forts et les points à améliorer.",
      timestamp: timestamp
    };
    
    // Mettre à jour les messages
    setMessages(prev => [...prev, userMessage]);
    
    // Simuler une réponse de l'assistant
    setIsLoading(true);
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 3,
        role: 'assistant',
        content: "Je suis prêt à corriger ton texte selon les 7 critères d'évaluation. Partage-le-moi, et je t'aiderai à l'améliorer.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  // Fonction pour appliquer le template du planificateur dans le flux de conversation
  const handleApplyWritingTemplate = (template) => {
    // Cacher le planificateur
    setShowWritingPlanner(false);
    
    // Ajouter le plan directement au message en cours d'édition, sans envoyer automatiquement
    setNewMessage(`Voici le plan de mon texte :\n\n${template}`);
    
    // Mettre le focus sur le champ de texte
    setTimeout(() => {
      document.querySelector('.chat-input .form-control')?.focus();
    }, 100);
  };

  return (
    <div className="chat-page d-flex flex-column vh-100">
      <header className="container-fluid py-2 bg-white shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Link to="/" className="btn btn-outline-secondary me-3">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="h5 mb-0">
              <span style={{ color: 'var(--primary-color)' }}>Chat</span>
              <span className="tech-accent">Alimi</span> 
              <span className="badge bg-info ms-2" style={{ fontSize: '0.6rem', verticalAlign: 'top' }}>AI</span>
            </h1>
          </div>
          <div className="badge bg-success">
            <i className="fas fa-graduation-cap me-1"></i> Assistant Éducatif
          </div>
        </div>
      </header>

      <div className="container flex-grow-1 py-4">
        <div className="chat-container p-3 d-flex flex-column mx-auto" style={{ maxWidth: '850px' }}>
          <div className="chat-messages flex-grow-1 overflow-auto p-3 mb-3" style={{ maxHeight: '70vh' }}>
            {isSpeechSynthesisSupported && (
              <div className="text-center mb-3">
                <button 
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => {
                    if (isSpeaking) {
                      // Utiliser la fonction d'annulation sécurisée
                      cancelSpeech();
                    } else {
                      // Lire le dernier message de l'assistant
                      const assistantMessages = messages.filter(m => m.role === 'assistant');
                      if (assistantMessages.length > 0) {
                        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
                        handleSpeakMessage(lastAssistantMessage.content, lastAssistantMessage.id);
                      }
                    }
                  }}
                  disabled={!isSpeechSynthesisSupported || messages.filter(m => m.role === 'assistant').length === 0}
                >
                  <i className={`fas ${isSpeaking ? 'fa-stop' : 'fa-volume-up'}`}></i>
                  {' '}{isSpeaking ? 'Arrêter la lecture' : 'Lire dernier message'}
                </button>
                
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  title="Paramètres de lecture vocale"
                >
                  <i className="fas fa-sliders-h"></i>{' '}
                  Options de lecture
                </button>
                
                <div className="mt-2 small text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Si la lecture est incomplète, activez le "Mode fiabilité maximale" dans les options
                </div>
                
                {/* Paramètres de lecture vocale */}
                {showVoiceSettings && (
                  <div className="voice-settings card p-3 mt-2 text-start">
                    <h6 className="mb-3"><i className="fas fa-cog me-2"></i>Paramètres de lecture vocale</h6>
                    
                    <div className="mb-3">
                      <label htmlFor="voice-rate" className="form-label d-flex justify-content-between">
                        <span>Vitesse</span>
                        <span className="badge bg-primary">
                          {voicePrefs.rate < 0.8 ? 'Lente' : voicePrefs.rate > 1.1 ? 'Rapide' : 'Normale'}
                        </span>
                      </label>
                      <div className="btn-group w-100" role="group">
                        <button 
                          type="button" 
                          className={`btn btn-sm ${voicePrefs.rate < 0.8 ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setVoicePrefs({...voicePrefs, rate: 0.7})}
                        >
                          <i className="fas fa-walking"></i> Lente
                        </button>
                        <button 
                          type="button" 
                          className={`btn btn-sm ${voicePrefs.rate >= 0.8 && voicePrefs.rate <= 1.1 ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setVoicePrefs({...voicePrefs, rate: 0.9})}
                        >
                          <i className="fas fa-running"></i> Normale
                        </button>
                        <button 
                          type="button" 
                          className={`btn btn-sm ${voicePrefs.rate > 1.1 ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setVoicePrefs({...voicePrefs, rate: 1.2})}
                        >
                          <i className="fas fa-bicycle"></i> Rapide
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-check form-switch mb-4">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="segmentation-switch" 
                        checked={voicePrefs.useSegmentation}
                        onChange={(e) => setVoicePrefs({...voicePrefs, useSegmentation: e.target.checked})}
                      />
                      <label className="form-check-label" htmlFor="segmentation-switch">
                        <strong>Mode fiabilité maximale</strong>
                        <span className="d-block small text-muted">
                          Recommandé pour les longs textes ou si la lecture est incomplète
                        </span>
                      </label>
                    </div>
                    
                    <div className="text-center">
                      <button 
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={() => {
                          setVoicePrefs({
                            rate: 0.9,
                            pitch: 1.0,
                            volume: 1.0,
                            useSegmentation: true
                          });
                        }}
                      >
                        <i className="fas fa-undo me-1"></i> Réinitialiser
                      </button>
                      
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowVoiceSettings(false)}
                      >
                        <i className="fas fa-check me-1"></i> Appliquer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {messages
              .filter(message => message.role !== 'system')
              .map((message) => (
                <div 
                  key={message.id} 
                  className={`d-flex mb-3 ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="me-2 align-self-end mb-1">
                      <div className="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-robot text-white"></i>
                      </div>
                    </div>
                  )}
                  <div 
                    className={`message p-3 rounded-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-light border'
                    } ${currentSpeakingMessageId === message.id ? 'currently-speaking' : ''}`}
                    style={{ maxWidth: '80%' }}
                  >
                    {message.image && (
                      <div className="message-image mb-2">
                        <img 
                          src={message.image} 
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', cursor: 'pointer' }}
                          onClick={() => window.open(message.image, '_blank')}
                          aria-label="Image partagée par l'utilisateur"
                        />
                      </div>
                    )}
                    
                    {/* Afficher les images provenant du modèle AI (si présentes) */}
                    {message.images && message.images.map((imageUrl, index) => (
                      <div className="message-image mb-2" key={`img-${message.id}-${index}`}>
                        <img 
                          src={imageUrl} 
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', cursor: 'pointer' }}
                          onClick={() => window.open(imageUrl, '_blank')}
                          aria-label={`Image ${index + 1} partagée par l'assistant`}
                        />
                      </div>
                    ))}
                    
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessage(message.content) 
                      }}
                    />
                    
                    {/* Afficher la barre de progression si le message est en cours de lecture */}
                    {currentSpeakingMessageId === message.id && (
                      <div className="speech-progress mt-2">
                        <div className="progress" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar bg-accent" 
                            role="progressbar" 
                            style={{ width: `${speakingProgress}%` }} 
                            aria-valuenow={speakingProgress} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <div className="speech-status text-center mt-1 small">
                          <i className="fas fa-volume-up me-1"></i> 
                          {speakingProgress < 100 ? (
                            <>Lecture en cours... <span className="badge bg-secondary">{speakingProgress}%</span></>
                          ) : (
                            <>Lecture terminée</>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mt-2">
                  <div 
                    className={`message-time small ${
                          message.role === 'user' ? 'text-light' : 'text-muted'
                        }`}
                  >
                    {message.timestamp}
                        {currentSpeakingMessageId === message.id && (
                          <span className="ms-2 speaking-indicator">
                            <i className="fas fa-volume-up fa-pulse"></i>
                            {speakingProgress > 0 && speakingProgress < 100 && (
                              <span className="ms-1">{speakingProgress}%</span>
                            )}
                          </span>
                        )}
                      </div>
                      
                      {/* Bouton pour lire le message à haute voix (uniquement pour les messages de l'assistant) */}
                      {message.role === 'assistant' && message.content && (
                        <div className="message-actions">
                          <button 
                            className={`btn btn-sm ${isSpeaking && currentSpeakingMessageId === message.id ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={() => {
                              if (isSpeaking && currentSpeakingMessageId === message.id) {
                                cancelSpeech();
                              } else {
                                handleSpeakMessage(message.content, message.id);
                              }
                            }}
                            title={isSpeechSynthesisSupported ? (isSpeaking && currentSpeakingMessageId === message.id ? "Arrêter la lecture" : "Lire à haute voix") : "Synthèse vocale non supportée"}
                            disabled={!isSpeechSynthesisSupported || (isSpeaking && currentSpeakingMessageId !== message.id)}
                          >
                            <i className={`fas ${isSpeaking && currentSpeakingMessageId === message.id ? 'fa-stop' : 'fa-volume-up'}`}></i>
                          </button>
                          
                          {/* Petits boutons pour la vitesse de lecture rapide */}
                          {!isSpeaking && (
                            <div className="btn-group btn-group-sm ms-2">
                              <button 
                                className="btn btn-outline-secondary btn-xs"
                                onClick={() => {
                                  setVoicePrefs({...voicePrefs, rate: 0.7});
                                  handleSpeakMessage(message.content, message.id);
                                }}
                                disabled={!isSpeechSynthesisSupported}
                                title="Lecture lente"
                              >
                                <i className="fas fa-walking"></i>
                              </button>
                              <button 
                                className="btn btn-outline-secondary btn-xs"
                                onClick={() => {
                                  setVoicePrefs({...voicePrefs, rate: 1.2});
                                  handleSpeakMessage(message.content, message.id);
                                }}
                                disabled={!isSpeechSynthesisSupported}
                                title="Lecture rapide"
                              >
                                <i className="fas fa-running"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="ms-2 align-self-end mb-1">
                      <div className="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user text-white"></i>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
            {isLoading && (
              <div className="d-flex justify-content-start mb-3">
                <div className="me-2 align-self-end mb-1">
                  <div className="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-robot text-white"></i>
                  </div>
                </div>
                <div className="message p-3 rounded-3 bg-light border">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input">
            {imagePreview && (
              <div className="selected-image-preview mb-2 position-relative">
                <img 
                  src={imagePreview} 
                  className="img-fluid rounded message-image"
                  aria-hidden="true"
                  alt=""
                />
                <button 
                  type="button" 
                  className="btn-close position-absolute top-0 end-0 bg-danger text-white" 
                  aria-label="Supprimer" 
                  onClick={clearSelectedImage}
                  style={{ padding: '0.25rem', margin: '0.25rem' }}
                ></button>
              </div>
            )}
            
            <div className="input-group mb-2">
              {/* Suppression des boutons de mode. Le chat guidera directement l'utilisateur */}
              <button
                type="button"
                className="btn btn-outline-primary w-100"
                onClick={toggleWritingPlanner}
                disabled={isLoading}
              >
                <i className="fas fa-pencil-alt me-2"></i>
                {showWritingPlanner ? "Fermer le planificateur" : "Ouvrir le planificateur de production écrite"}
              </button>
            </div>
            
            <div className="input-group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-image"
                onClick={triggerImageSelect}
                title="Joindre une image (JPG, PNG, GIF - max 5 Mo)"
                disabled={!isFileUploadEnabled || isLoading}
              >
                <i className="fas fa-image"></i>
              </button>
              
              {/* Bouton pour activer/désactiver la reconnaissance vocale */}
              <button
                type="button"
                className={`btn ${isListening ? 'btn-danger' : 'btn-outline-secondary'} btn-mic`}
                onClick={startSpeechRecognition}
                title={isSpeechRecognitionSupported ? (isListening ? "Arrêter l'enregistrement" : "Enregistrer un message vocal") : "Reconnaissance vocale non supportée"}
                disabled={isLoading || !isSpeechRecognitionSupported}
              >
                <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
              </button>
              
              <input
                type="text"
                className="form-control"
                placeholder="Écris ton message ici..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isLoading || isListening}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={(newMessage.trim() === '' && !selectedImage) || isLoading || isListening}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
                {' '}Envoyer
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              className="d-none"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              capture="environment"
            />
          </form>
        </div>
        
        <div className="tips text-center mt-4">
          <div className="card p-3 border-0 shadow-sm">
            <p className="text-muted small mb-0">
              <i className="fas fa-lightbulb me-2 text-warning"></i>
              <strong>Conseil :</strong> Tu peux joindre une image à ton message avec <i className="fas fa-image"></i>, parler avec <i className="fas fa-microphone"></i> ou écouter les réponses avec <i className="fas fa-volume-up"></i>.
            </p>
          </div>
        </div>
      </div>
      
      <footer className="py-3 bg-white border-top">
        <div className="container text-center">
          <p className="text-muted small mb-0">
            <strong>ChatAlimi</strong> - Assistant IA pour les productions écrites | Ministère de l'Éducation Tunisie
          </p>
        </div>
      </footer>

      {/* Afficher le planificateur au-dessus du chat si nécessaire */}
      {showWritingPlanner && (
        <div className="writing-planner-overlay">
          <div className="writing-planner-modal">
            <div className="writing-planner-header d-flex justify-content-between align-items-center mb-3">
              <h3>Planificateur de production écrite</h3>
              <button 
                className="btn-close" 
                onClick={toggleWritingPlanner}
                aria-label="Fermer"
              ></button>
            </div>
            <div className="writing-planner-content">
              <WritingPlanner onApplyTemplate={handleApplyWritingTemplate} />
            </div>
          </div>
        </div>
      )}
      
      {/* Le modal du planificateur est supprimé car non nécessaire */}
    </div>
  );
};

export default ChatPage; 