# Documentation des Routes API - SGQ LigneG Beta

## Table des matières
- [Routes administratives](#routes-administratives)
- [Frontend](#frontend)
- [LiveSession](#livesession)
- [Catalog](#catalog)
- [WCM (World Class Manufacturing)](#wcm-world-class-manufacturing)
- [Production](#production)

---

## Routes administratives

### Django Admin
- **URL**: `/admin/`
- **Méthode**: GET, POST
- **Description**: Interface d'administration Django pour gérer les modèles
- **Permissions**: Authentification requise (superuser ou staff)
- **Paramètres**: Selon l'interface admin
- **Réponse**: Interface web Django Admin

---

## Frontend

### Page d'accueil
- **URL**: `/`
- **Méthode**: GET
- **Description**: Page d'accueil de l'application
- **Permissions**: Aucune
- **Paramètres**: Aucun
- **Réponse**: Page HTML (frontend/pages/index.html)

### Page de production
- **URL**: `/production/`
- **Méthode**: GET
- **Description**: Interface principale de gestion de la production
- **Permissions**: Aucune
- **Paramètres**: Aucun
- **Réponse**: Page HTML avec les données suivantes :
  - Liste des opérateurs actifs
  - Ordres de fabrication non terminés
  - Ordres de découpe
  - Données de session (shift, roll, checklist, quality control, lost time)

---

## LiveSession

### API de gestion de session
- **URL**: `/api/session/`
- **Méthode**: GET
- **Description**: Récupère toutes les données stockées en session
- **Permissions**: Aucune
- **Paramètres**: Aucun
- **Réponse**: JSON contenant toutes les données de session :
  ```json
  {
    "profile_id": int,
    "shift_id": int,
    "operator_id": int,
    "shift_date": "YYYY-MM-DD",
    "vacation": string,
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "machine_started_start": boolean,
    "machine_started_end": boolean,
    "length_start": string,
    "length_end": string,
    "comment": string,
    "of_en_cours": string,
    "target_length": string,
    "of_decoupe": string,
    "roll_number": string,
    "tube_mass": string,
    "roll_length": string,
    "total_mass": string,
    "next_tube_mass": string,
    "roll_data": object,
    "checklist_responses": object,
    "checklist_signature": string,
    "checklist_signature_time": string,
    "quality_control": object
  }
  ```

### API de mise à jour de session
- **URL**: `/api/session/`
- **Méthode**: PATCH
- **Description**: Met à jour partiellement les données de session
- **Permissions**: Aucune
- **Paramètres** (tous optionnels) :
  - `profile_id`: ID du profil sélectionné
  - `shift_id`: ID du poste
  - `operator_id`: ID de l'opérateur
  - `shift_date`: Date du poste (format YYYY-MM-DD)
  - `vacation`: Vacation (matin/jour/soir/nuit)
  - `start_time`: Heure de début (format HH:MM)
  - `end_time`: Heure de fin (format HH:MM)
  - `machine_started_start`: État machine au début
  - `machine_started_end`: État machine à la fin
  - `length_start`: Longueur début
  - `length_end`: Longueur fin
  - `comment`: Commentaire
  - `of_en_cours`: Ordre de fabrication en cours
  - `target_length`: Longueur cible
  - `of_decoupe`: Ordre de découpe
  - `roll_number`: Numéro du rouleau
  - `tube_mass`: Masse du tube
  - `roll_length`: Longueur du rouleau
  - `total_mass`: Masse totale
  - `next_tube_mass`: Masse du prochain tube
  - `roll_data`: Données du rouleau (JSON)
  - `checklist_responses`: Réponses checklist (JSON)
  - `checklist_signature`: Signature checklist
  - `checklist_signature_time`: Heure de signature
  - `quality_control`: Contrôle qualité (JSON)
  - `lost_time_entries`: Entrées temps perdus (JSON)
  - `temps_total`: Temps total
  - `has_startup_time`: A un temps de démarrage
- **Réponse**: JSON avec toutes les données de session mises à jour
- **Note**: Si `profile_id` est mis à jour, met également à jour le `CurrentProfile` dans la BD

---

## Catalog

### Liste des profils
- **URL**: `/api/profiles/`
- **Méthode**: GET
- **Description**: Récupère la liste des profils actifs
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des profils avec serializer simplifié

### Détail d'un profil
- **URL**: `/api/profiles/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails complets d'un profil
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du profil (dans l'URL)
- **Réponse**: JSON avec toutes les informations du profil

### Activer un profil
- **URL**: `/api/profiles/{id}/set_active/`
- **Méthode**: POST
- **Description**: Marque ce profil comme actif et désactive les autres
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du profil (dans l'URL)
- **Réponse**: 
  ```json
  {
    "status": "success",
    "message": "Profile {name} set as active"
  }
  ```

### Liste des types de défauts
- **URL**: `/api/defect-types/`
- **Méthode**: GET
- **Description**: Récupère la liste des types de défauts qualité actifs
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des types de défauts

### Détail d'un type de défaut
- **URL**: `/api/defect-types/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails d'un type de défaut
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du type de défaut (dans l'URL)
- **Réponse**: JSON avec les informations du type de défaut

---

## WCM (World Class Manufacturing)

### Liste des motifs de temps perdu
- **URL**: `/api/lost-time-reasons/`
- **Méthode**: GET
- **Description**: Récupère la liste des motifs de temps perdu actifs
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des motifs triés par catégorie, ordre et nom

### Détail d'un motif de temps perdu
- **URL**: `/api/lost-time-reasons/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails d'un motif de temps perdu
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du motif (dans l'URL)
- **Réponse**: JSON avec les informations du motif

### Liste des entrées de temps perdu
- **URL**: `/api/lost-time-entries/`
- **Méthode**: GET
- **Description**: Récupère les entrées de temps perdu de la session courante
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des entrées triées par date de création (décroissant)

### Créer une entrée de temps perdu
- **URL**: `/api/lost-time-entries/`
- **Méthode**: POST
- **Description**: Crée une nouvelle entrée de temps perdu
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Selon le serializer LostTimeEntrySerializer
- **Réponse**: JSON de l'entrée créée

### Détail d'une entrée de temps perdu
- **URL**: `/api/lost-time-entries/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails d'une entrée de temps perdu
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID de l'entrée (dans l'URL)
- **Réponse**: JSON avec les informations de l'entrée

### Mettre à jour une entrée de temps perdu
- **URL**: `/api/lost-time-entries/{id}/`
- **Méthode**: PUT, PATCH
- **Description**: Met à jour une entrée de temps perdu
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Selon le serializer LostTimeEntrySerializer
- **Réponse**: JSON de l'entrée mise à jour

### Supprimer une entrée de temps perdu
- **URL**: `/api/lost-time-entries/{id}/`
- **Méthode**: DELETE
- **Description**: Supprime une entrée de temps perdu
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID de l'entrée (dans l'URL)
- **Réponse**: 204 No Content

### Statistiques des temps perdus
- **URL**: `/api/lost-time-entries/stats/`
- **Méthode**: GET
- **Description**: Obtient les statistiques de temps perdu de la session
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: 
  ```json
  {
    "total_duration": int,
    "count": int,
    "by_category": [
      {
        "reason__category": string,
        "reason__name": string,
        "duration_sum": int
      }
    ]
  }
  ```

### Liste des modes
- **URL**: `/api/modes/`
- **Méthode**: GET
- **Description**: Récupère la liste des modes de fonctionnement actifs
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des modes triés par nom

### Détail d'un mode
- **URL**: `/api/modes/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails d'un mode
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du mode (dans l'URL)
- **Réponse**: JSON avec les informations du mode

### Basculer l'état d'un mode
- **URL**: `/api/modes/{id}/toggle/`
- **Méthode**: POST
- **Description**: Active/désactive un mode
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du mode (dans l'URL)
- **Réponse**: 
  ```json
  {
    "id": int,
    "name": string,
    "is_enabled": boolean
  }
  ```

### Template de checklist par défaut
- **URL**: `/api/checklist-template-default/`
- **Méthode**: GET
- **Description**: Retourne le template de checklist par défaut
- **Permissions**: Aucune
- **Paramètres**: Aucun
- **Réponse**: 
  ```json
  {
    "id": int | null,
    "name": string,
    "items": [
      {
        "id": int,
        "text": string,
        "category": string,
        "is_required": boolean,
        "order": int
      }
    ]
  }
  ```
- **Note**: Retourne une réponse vide valide si aucun template n'est trouvé

---

## Production

### Liste des rouleaux
- **URL**: `/api/production/rolls/`
- **Méthode**: GET
- **Description**: Récupère la liste des rouleaux de la session courante
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des rouleaux triés par date de création (décroissant)
- **Note**: Inclut les mesures d'épaisseur et les défauts

### Créer un rouleau
- **URL**: `/api/production/rolls/`
- **Méthode**: POST
- **Description**: Crée un nouveau rouleau avec ses mesures
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Selon le serializer RollSerializer
  - `shift_id_str`: ID du poste (optionnel, utilise la session si non fourni)
  - Autres champs selon le modèle Roll
- **Réponse**: JSON du rouleau créé (201 Created)
- **Erreurs possibles**:
  - 400 Bad Request: "Aucun poste actif trouvé dans la session"
  - 500 Internal Server Error: "Erreur lors de la création du rouleau"

### Détail d'un rouleau
- **URL**: `/api/production/rolls/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails d'un rouleau
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du rouleau (dans l'URL)
- **Réponse**: JSON avec toutes les informations du rouleau

### Mettre à jour un rouleau
- **URL**: `/api/production/rolls/{id}/`
- **Méthode**: PUT, PATCH
- **Description**: Met à jour un rouleau
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Selon le serializer RollSerializer
- **Réponse**: JSON du rouleau mis à jour

### Supprimer un rouleau
- **URL**: `/api/production/rolls/{id}/`
- **Méthode**: DELETE
- **Description**: Supprime un rouleau
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du rouleau (dans l'URL)
- **Réponse**: 204 No Content

### Liste des postes
- **URL**: `/api/production/shifts/`
- **Méthode**: GET
- **Description**: Récupère la liste des postes
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Aucun
- **Réponse**: Liste JSON des postes triés par date et création (décroissant)
- **Note**: Inclut l'opérateur, les réponses de checklist, temps perdus et rouleaux

### Créer un poste
- **URL**: `/api/production/shifts/`
- **Méthode**: POST
- **Description**: Crée un nouveau poste avec ses associations
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Selon le serializer ShiftSerializer
  - `date`: Date du poste (YYYY-MM-DD)
  - `operator`: ID de l'opérateur
  - `vacation`: Type de vacation (Matin/ApresMidi/Nuit/Journee)
  - `start_time`: Heure de début (HH:MM)
  - `end_time`: Heure de fin (HH:MM)
  - `started_at_beginning`: Machine démarrée au début (boolean)
  - `meter_reading_start`: Métrage début (si machine démarrée)
  - `started_at_end`: Machine démarrée à la fin (boolean)
  - `meter_reading_end`: Métrage fin (si machine démarrée)
  - `operator_comments`: Commentaires (optionnel)
- **Réponse**: JSON du poste créé avec statistiques calculées (201 Created)
- **Actions automatiques**:
  - Association des temps perdus de la session
  - Association des rouleaux créés
  - Calcul des totaux de production
  - Calcul des moyennes d'épaisseur et grammage
  - Nettoyage de la session après sauvegarde
- **Erreurs possibles**:
  - 400 Bad Request: Erreurs de validation
  - 500 Internal Server Error: Erreur lors de la création

### Détail d'un poste
- **URL**: `/api/production/shifts/{id}/`
- **Méthode**: GET
- **Description**: Récupère les détails d'un poste
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du poste (dans l'URL)
- **Réponse**: JSON avec toutes les informations du poste

### Mettre à jour un poste
- **URL**: `/api/production/shifts/{id}/`
- **Méthode**: PUT, PATCH
- **Description**: Met à jour un poste
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: Selon le serializer ShiftSerializer
- **Réponse**: JSON du poste mis à jour

### Supprimer un poste
- **URL**: `/api/production/shifts/{id}/`
- **Méthode**: DELETE
- **Description**: Supprime un poste
- **Permissions**: Aucune (AllowAny)
- **Paramètres**: 
  - `id`: ID du poste (dans l'URL)
- **Réponse**: 204 No Content

---

## Notes générales

1. **Authentification**: La plupart des endpoints n'ont pas d'authentification requise (AllowAny). Un système d'authentification devrait être mis en place pour la production.

2. **Gestion de session**: L'application utilise intensivement les sessions Django pour persister l'état entre les requêtes. La clé de session est utilisée pour filtrer les données.

3. **Format des réponses**: Toutes les API REST retournent du JSON, sauf les vues frontend qui retournent du HTML.

4. **CSRF**: Pour les requêtes POST/PUT/PATCH/DELETE depuis le frontend, le token CSRF Django doit être inclus.

5. **API Browser**: Django REST Framework fournit une interface navigable pour toutes les API ViewSet à leurs URLs respectives.