import React, { useState } from 'react';

const WritingPlanner = ({ onApplyTemplate }) => {
  const [selectedType, setSelectedType] = useState('récit');
  const [selectedReason, setSelectedReason] = useState('car le maître me l\'a demandé');
  
  // Les sections du plan d'écriture
  const sections = {
    initialState: {
      title: "L'état initial",
      description: "L'état initial présente la situation de départ et les éléments fondamentaux du récit (personnages, lieu, temps).",
      fields: [
        { id: "why", label: "Pourquoi ?", 
          description: "Le contexte ou l'occasion où vont se dérouler les événements : une promenade, une visite à un professionnel, une rencontre inattendue, une découverte, etc.",
          placeholder: "Décrivez le contexte des événements" },
        { id: "who", label: "Qui ?", 
          description: "Le personnage principal : toi-même, un ami, un voisin, un héros imaginaire... (En donner une idée sommaire : âge, métier ou profession, occupation, description physique et morale, lieu de résidence...)",
          placeholder: "Décrivez le personnage principal en détail" },
        { id: "where", label: "Où ?", 
          description: "Le lieu où vont se dérouler les événements (la ville, la campagne, l'école, un pays lointain, un château, une grotte, etc.)",
          placeholder: "Décrivez le lieu des événements avec des détails" },
        { id: "when", label: "Quand ?", 
          description: "Le moment de la journée, du mois ou de l'année où vont se dérouler les événements (un matin d'été, un soir pluvieux, pendant les vacances...)",
          placeholder: "Précisez le moment des événements" }
      ],
      note: "Nombre de phrases recommandé : 4 à 5 phrases"
    },
    eventsSequence: {
      title: "La suite des événements",
      description: "La suite des événements raconte comment la situation évolue, quels obstacles apparaissent et comment les personnages y réagissent.",
      fields: [
        { id: "what", label: "Quoi ?", 
          description: "La complication, le problème, le nœud de l'histoire qui va perturber l'état initial (un obstacle, un conflit, une surprise...)",
          placeholder: "Décrivez précisément le problème ou la complication" },
        { id: "mainChar", label: "Qui ?", 
          description: "Comment le personnage principal réagit face au problème, ce qu'il ressent, ce qu'il décide de faire",
          placeholder: "Décrivez les actions et réactions du personnage principal" },
        { id: "helpers", label: "Les adjuvants (alliés)", 
          description: "Les personnages qui vont aider le personnage principal (amis, mentors, animaux, objets magiques...)",
          placeholder: "Décrivez les alliés et comment ils aident le héros" },
        { id: "opponents", label: "Les opposants (ennemis)", 
          description: "Les personnages ou éléments qui vont entraver le personnage principal (ennemis, obstacles naturels, peurs intérieures...)",
          placeholder: "Décrivez les ennemis et comment ils s'opposent au héros" },
        { id: "eventWhere", label: "Où ?", 
          description: "Les nouveaux lieux où se déroule l'action (peuvent être différents de l'état initial)",
          placeholder: "Décrivez les lieux de l'action" },
        { id: "eventWhen", label: "Quand ?", 
          description: "Les moments où se déroulent les différentes étapes de l'action",
          placeholder: "Précisez le déroulement temporel des événements" },
        { id: "resolution", label: "Résolution", 
          description: "Comment l'histoire se termine, comment le problème est résolu ou non",
          placeholder: "Décrivez la fin de l'histoire et la résolution du problème" }
      ],
      note: "Nombre de phrases recommandé : 6 à 8 phrases"
    }
  };

  // État pour stocker les valeurs des champs
  const [formValues, setFormValues] = useState({
    // Section 1
    why: '',
    who: '',
    where: '',
    when: '',
    // Section 2
    what: '',
    mainChar: '',
    helpers: '',
    opponents: '',
    eventWhere: '',
    eventWhen: '',
    resolution: ''
  });

  // Gère le changement d'une valeur de champ
  const handleInputChange = (id, value) => {
    setFormValues({
      ...formValues,
      [id]: value
    });
  };

  // Génère le texte à envoyer au chat
  const generateTemplate = () => {
    let template = `# PLANIFICATION DE MA PRODUCTION ÉCRITE\n\n`;
    template += `## Informations générales\n`;
    template += `Type de texte : **${selectedType}**\n`;
    template += `Raison de l'écriture : **${selectedReason}**\n\n`;
    
    // Section État initial
    template += `## 1. L'état initial\n`;
    template += `*Cette section présente la situation de départ et les éléments fondamentaux du récit.*\n\n`;
    
    if (formValues.why) template += `**Pourquoi ?** ${formValues.why}\n\n`;
    if (formValues.who) template += `**Qui ?** ${formValues.who}\n\n`;
    if (formValues.where) template += `**Où ?** ${formValues.where}\n\n`;
    if (formValues.when) template += `**Quand ?** ${formValues.when}\n\n`;
    
    // Section Suite des événements
    template += `## 2. La suite des événements\n`;
    template += `*Cette section raconte comment la situation évolue, quels obstacles apparaissent et comment les personnages y réagissent.*\n\n`;
    
    if (formValues.what) template += `**Le problème/La complication :** ${formValues.what}\n\n`;
    if (formValues.mainChar) template += `**Réactions du personnage principal :** ${formValues.mainChar}\n\n`;
    
    if (formValues.helpers) template += `**Les alliés :** ${formValues.helpers}\n\n`;
    if (formValues.opponents) template += `**Les opposants :** ${formValues.opponents}\n\n`;
    
    if (formValues.eventWhere) template += `**Lieux de l'action :** ${formValues.eventWhere}\n\n`;
    if (formValues.eventWhen) template += `**Moments de l'action :** ${formValues.eventWhen}\n\n`;
    if (formValues.resolution) template += `**Résolution :** ${formValues.resolution}\n\n`;
    
    template += `---\n\nMaintenant que j'ai planifié mon texte, je peux l'écrire en respectant cette structure et en développant chaque élément.`;
    
    return template;
  };

  const handleSubmit = () => {
    const template = generateTemplate();
    onApplyTemplate(template);
  };

  return (
    <div className="writing-planner-container p-3 rounded border bg-light">
      <h2 className="text-center mb-3">Planificateur de production écrite</h2>
      <p className="text-center text-muted mb-4">Organise tes idées avant d'écrire ton texte</p>
      
      <div className="mb-4 bg-white p-3 rounded shadow-sm">
        <h4 className="border-bottom pb-2">Configuration générale</h4>
        
        <div className="form-group mb-3">
          <label className="fw-bold mb-2">Type de texte à produire :</label>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {['récit', 'lettre', 'récit avec dialogue', 'récit avec description'].map(type => (
              <div key={type} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="textType"
                  id={`type-${type}`}
                  checked={selectedType === type}
                  onChange={() => setSelectedType(type)}
                />
                <label className="form-check-label" htmlFor={`type-${type}`}>
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label className="fw-bold mb-2">Raison de l'écriture :</label>
          <div className="d-flex flex-wrap gap-2 mt-2">
            {[
              'car le maître me l\'a demandé',
              'car j\'ai senti le besoin d\'écrire',
              'car je veux avoir des nouvelles d\'un ami',
              'car j\'ai des idées que je veux exprimer',
              'car il y a un concours auquel je vais participer'
            ].map(reason => (
              <div key={reason} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="reason"
                  id={`reason-${reason}`}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                />
                <label className="form-check-label" htmlFor={`reason-${reason}`}>
                  {reason}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Sections du plan d'écriture */}
      {Object.entries(sections).map(([sectionKey, section]) => (
        <div key={sectionKey} className="section-container mb-4 p-3 bg-white border rounded shadow-sm">
          <h4 className="border-bottom pb-2 mb-3">{section.title}</h4>
          <p className="text-muted mb-3">{section.description}</p>
          
          {section.fields.map(field => (
            <div key={field.id} className="mb-3">
              <label htmlFor={field.id} className="form-label fw-bold">{field.label}</label>
              {field.description && <p className="text-muted small">{field.description}</p>}
              <textarea
                id={field.id}
                className="form-control"
                rows="3"
                placeholder={field.placeholder}
                value={formValues[field.id]}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
              />
            </div>
          ))}
          
          <p className="text-muted fst-italic small">{section.note}</p>
        </div>
      ))}
      
      <div className="d-grid">
        <button 
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
        >
          Envoyer le plan au chat
        </button>
      </div>
    </div>
  );
};

export default WritingPlanner;