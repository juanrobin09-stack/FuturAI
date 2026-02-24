import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding V7 database...");

  // ─── BADGES ──────────────────────────────────────────
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: "Innovateur du mois" },
      update: {},
      create: { name: "Innovateur du mois", description: "A soumis l'idee la plus votee du mois", icon: "trophy", category: "engagement" },
    }),
    prisma.badge.upsert({
      where: { name: "Top Vote" },
      update: {},
      create: { name: "Top Vote", description: "A recu plus de 100 votes positifs", icon: "star", category: "engagement" },
    }),
    prisma.badge.upsert({
      where: { name: "Equipe creative" },
      update: {},
      create: { name: "Equipe creative", description: "Membre d'une equipe ayant soumis 10+ idees", icon: "users", category: "general" },
    }),
    prisma.badge.upsert({
      where: { name: "Pionnier" },
      update: {},
      create: { name: "Pionnier", description: "Parmi les 100 premiers utilisateurs", icon: "rocket", category: "general" },
    }),
    prisma.badge.upsert({
      where: { name: "Codeur infatigable" },
      update: {},
      create: { name: "Codeur infatigable", description: "A contribue du code sur 5 projets differents", icon: "code", category: "contribution" },
    }),
    prisma.badge.upsert({
      where: { name: "Champion Hackathon" },
      update: {},
      create: { name: "Champion Hackathon", description: "A remporte un challenge", icon: "medal", category: "challenge" },
    }),
  ]);

  // Auto-awardable badges (matched by src/lib/badges.ts)
  const autoBadges = await Promise.all([
    prisma.badge.upsert({
      where: { name: "Premier Pas" },
      update: {},
      create: { name: "Premier Pas", description: "A soumis sa premiere idee", icon: "sparkles", category: "engagement" },
    }),
    prisma.badge.upsert({
      where: { name: "Collaborateur" },
      update: {},
      create: { name: "Collaborateur", description: "Membre de 3 projets ou plus", icon: "users", category: "general" },
    }),
    prisma.badge.upsert({
      where: { name: "Contributeur Actif" },
      update: {},
      create: { name: "Contributeur Actif", description: "A realise 10 contributions ou plus", icon: "code", category: "contribution" },
    }),
    prisma.badge.upsert({
      where: { name: "Voteur Assidu" },
      update: {},
      create: { name: "Voteur Assidu", description: "A vote 50 fois ou plus", icon: "thumbs-up", category: "engagement" },
    }),
    prisma.badge.upsert({
      where: { name: "Challenger" },
      update: {},
      create: { name: "Challenger", description: "A participe a 3 challenges ou plus", icon: "trophy", category: "challenge" },
    }),
    prisma.badge.upsert({
      where: { name: "Expert IA" },
      update: {},
      create: { name: "Expert IA", description: "A atteint 1000 points", icon: "award", category: "general" },
    }),
  ]);

  // V5 Global recognition badges
  const v5Badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: "Global Builder" },
      update: {},
      create: { name: "Global Builder", description: "Built a project with 3+ contributors", icon: "globe", category: "contribution" },
    }),
    prisma.badge.upsert({
      where: { name: "Top Innovator" },
      update: {},
      create: { name: "Top Innovator", description: "Reached #1 on the leaderboard", icon: "crown", category: "engagement" },
    }),
    prisma.badge.upsert({
      where: { name: "AI Pioneer" },
      update: {},
      create: { name: "AI Pioneer", description: "First to complete a special challenge", icon: "rocket", category: "challenge" },
    }),
    prisma.badge.upsert({
      where: { name: "Challenge Champion" },
      update: {},
      create: { name: "Challenge Champion", description: "Won 3+ challenges", icon: "trophy", category: "challenge" },
    }),
    prisma.badge.upsert({
      where: { name: "Open Contributor" },
      update: {},
      create: { name: "Open Contributor", description: "Contributed to 5+ different projects", icon: "git-merge", category: "contribution" },
    }),
  ]);
  console.log(`${badges.length + autoBadges.length + v5Badges.length} badges (${badges.length} manual + ${autoBadges.length} auto + ${v5Badges.length} v5)`);

  // ─── USERS ──────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "demo@futureai.dev" },
      update: { points: 250, bio: "Developpeur full-stack passionne par l'IA", role: "ADMIN" },
      create: { clerkId: "demo_clerk_id", username: "DemoUser", email: "demo@futureai.dev", country: "France", points: 250, bio: "Developpeur full-stack passionne par l'IA", role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "alice@futureai.dev" },
      update: { points: 420, role: "EXPERT_VOLUNTEER" },
      create: { clerkId: "clerk_alice", username: "AliceAI", email: "alice@futureai.dev", country: "Canada", points: 420, bio: "Chercheuse en NLP et vision par ordinateur", role: "EXPERT_VOLUNTEER" },
    }),
    prisma.user.upsert({
      where: { email: "bob@futureai.dev" },
      update: { points: 180 },
      create: { clerkId: "clerk_bob", username: "BobML", email: "bob@futureai.dev", country: "Allemagne", points: 180, bio: "Ingenieur machine learning" },
    }),
    prisma.user.upsert({
      where: { email: "carla@futureai.dev" },
      update: { points: 550, role: "EXPERT_INSTITUTION" },
      create: { clerkId: "clerk_carla", username: "CarlaDesign", email: "carla@futureai.dev", country: "Bresil", points: 550, bio: "UX designer specialisee en interfaces IA", role: "EXPERT_INSTITUTION" },
    }),
    prisma.user.upsert({
      where: { email: "david@futureai.dev" },
      update: { points: 95 },
      create: { clerkId: "clerk_david", username: "DavidCode", email: "david@futureai.dev", country: "Japon", points: 95, bio: "Etudiant en informatique" },
    }),
  ]);
  const [demoUser, alice, bob, carla, david] = users;
  console.log(`${users.length} users`);

  // Award some badges
  for (const [user, badgeIdx] of [[demoUser, 3], [alice, 0], [alice, 4], [carla, 1], [carla, 5]] as const) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: (user as any).id, badgeId: badges[badgeIdx as number].id } },
      update: {},
      create: { userId: (user as any).id, badgeId: badges[badgeIdx as number].id },
    });
  }
  console.log("Badges awarded");

  // ─── IDEAS ──────────────────────────────────────────
  const ideas = [];
  const ideaData = [
    { title: "Traducteur universel en temps reel", description: "Une IA capable de traduire instantanement n'importe quelle langue parlee, y compris les dialectes rares et les langues des signes.", category: "NLP", country: "France", latitude: 48.8566, longitude: 2.3522, authorId: demoUser.id },
    { title: "Diagnostic medical par imagerie IA", description: "Systeme d'analyse d'images medicales (IRM, scanner) pour detecter les pathologies avec une precision superieure aux radiologues.", category: "Sante", country: "Allemagne", latitude: 52.52, longitude: 13.405, authorId: alice.id },
    { title: "Assistant de conduite predictif", description: "IA embarquee qui predit les dangers routiers 10 secondes a l'avance en analysant le comportement des autres vehicules.", category: "Mobilite", country: "Japon", latitude: 35.6762, longitude: 139.6503, authorId: david.id },
    { title: "Generateur d'art IA collaboratif", description: "Plateforme ou plusieurs utilisateurs peuvent co-creer des oeuvres avec une IA generative en temps reel.", category: "Creation IA", country: "USA", latitude: 37.7749, longitude: -122.4194, authorId: carla.id },
    { title: "Tuteur IA personnalise", description: "Un tuteur IA qui s'adapte au rythme et style d'apprentissage de chaque eleve pour une education veritablement personnalisee.", category: "Education", country: "Bresil", latitude: -23.5505, longitude: -46.6333, authorId: carla.id },
    { title: "Surveillance environnementale par drone IA", description: "Reseau de drones equipes d'IA pour surveiller la deforestation, la pollution des oceans et les especes menacees en temps reel.", category: "Environnement", country: "Kenya", latitude: -1.2921, longitude: 36.8219, authorId: bob.id },
  ];

  for (const idea of ideaData) {
    const created = await prisma.idea.create({ data: idea });
    ideas.push(created);
  }
  console.log(`${ideas.length} ideas`);

  // ─── VOTES ──────────────────────────────────────────
  const voteData = [
    { userId: alice.id, ideaId: ideas[0].id, value: 1 },
    { userId: bob.id, ideaId: ideas[0].id, value: 1 },
    { userId: carla.id, ideaId: ideas[0].id, value: 1 },
    { userId: david.id, ideaId: ideas[0].id, value: 1 },
    { userId: demoUser.id, ideaId: ideas[1].id, value: 1 },
    { userId: bob.id, ideaId: ideas[1].id, value: 1 },
    { userId: carla.id, ideaId: ideas[3].id, value: 1 },
    { userId: demoUser.id, ideaId: ideas[3].id, value: 1 },
    { userId: alice.id, ideaId: ideas[4].id, value: 1 },
    { userId: demoUser.id, ideaId: ideas[5].id, value: 1 },
    { userId: alice.id, ideaId: ideas[5].id, value: 1 },
  ];
  for (const v of voteData) {
    await prisma.vote.create({ data: v });
  }
  console.log(`${voteData.length} votes`);

  // ─── PROJECTS ───────────────────────────────────────
  const projects = [];
  const projectData = [
    {
      title: "TranslateAI - Traducteur Universel",
      description: "Projet collaboratif pour construire un traducteur IA universel supportant 200+ langues incluant les dialectes et la langue des signes.",
      category: "NLP",
      status: "in_progress",
      country: "France",
      latitude: 48.8566,
      longitude: 2.3522,
      ideaId: ideas[0].id,
      // V7 Impact fields
      problemSeverity: 8,
      populationAffected: "500 million non-English speakers globally",
      geographicScope: "global",
      implementationReadiness: 5,
      scalabilityPotential: 4,
      verificationMethod: "BLEU score benchmarks + user satisfaction surveys",
    },
    {
      title: "MedVision - Diagnostic Imagerie",
      description: "Plateforme open-source d'analyse d'imagerie medicale utilisant des modeles de deep learning pour le diagnostic assiste.",
      category: "Sante",
      status: "open",
      country: "Allemagne",
      latitude: 52.52,
      longitude: 13.405,
      ideaId: ideas[1].id,
      // V7 Impact fields
      problemSeverity: 9,
      populationAffected: "3.5 billion people lacking reliable diagnostics",
      geographicScope: "continental",
      implementationReadiness: 3,
      scalabilityPotential: 5,
      verificationMethod: "Clinical trials with partner hospitals + AUC metrics",
    },
    {
      title: "ArtGen Collab",
      description: "Outil de creation artistique collaborative propulse par l'IA generative. Plusieurs artistes peuvent co-creer en temps reel.",
      category: "Creation IA",
      status: "in_progress",
      country: "USA",
      latitude: 37.7749,
      longitude: -122.4194,
      ideaId: ideas[3].id,
      // V7 Impact fields
      problemSeverity: 4,
      populationAffected: "Independent artists and creators worldwide",
      geographicScope: "global",
      implementationReadiness: 6,
      scalabilityPotential: 4,
      verificationMethod: "User growth metrics + creative output analysis",
    },
    {
      title: "EcoDrone Watch",
      description: "Reseau de surveillance environnementale par drones autonomes equipes de modeles de vision par ordinateur.",
      category: "Environnement",
      status: "open",
      country: "Kenya",
      latitude: -1.2921,
      longitude: 36.8219,
      ideaId: ideas[5].id,
      // V7 Impact fields
      problemSeverity: 10,
      populationAffected: "Ecosystems across Sub-Saharan Africa",
      geographicScope: "continental",
      implementationReadiness: 4,
      scalabilityPotential: 3,
      verificationMethod: "Species count accuracy vs. manual surveys + deforestation rate comparison",
    },
  ];

  for (const p of projectData) {
    const created = await prisma.project.create({ data: p });
    projects.push(created);
  }
  console.log(`${projects.length} projects`);

  // ─── PROJECT MEMBERS ────────────────────────────────
  const memberData = [
    // TranslateAI
    { userId: demoUser.id, projectId: projects[0].id, role: "creator" },
    { userId: alice.id, projectId: projects[0].id, role: "contributor" },
    { userId: bob.id, projectId: projects[0].id, role: "tester" },
    // MedVision
    { userId: alice.id, projectId: projects[1].id, role: "creator" },
    { userId: bob.id, projectId: projects[1].id, role: "contributor" },
    // ArtGen
    { userId: carla.id, projectId: projects[2].id, role: "creator" },
    { userId: demoUser.id, projectId: projects[2].id, role: "contributor" },
    { userId: david.id, projectId: projects[2].id, role: "tester" },
    // EcoDrone
    { userId: bob.id, projectId: projects[3].id, role: "creator" },
    { userId: alice.id, projectId: projects[3].id, role: "contributor" },
  ];

  for (const m of memberData) {
    await prisma.projectMember.create({ data: m });
  }
  console.log(`${memberData.length} project members`);

  // ─── PROJECT VERSIONS ───────────────────────────────
  await prisma.projectVersion.createMany({
    data: [
      { projectId: projects[0].id, version: "0.1", changelog: "Setup initial du projet, architecture NLP definie" },
      { projectId: projects[0].id, version: "0.2", changelog: "Integration du modele de traduction multi-langues" },
      { projectId: projects[2].id, version: "0.1", changelog: "Prototype de generation d'images collaboratif" },
    ],
  });
  console.log("Project versions");

  // ─── CONTRIBUTIONS ─────────────────────────────────
  const contribData = [
    { type: "code", description: "Implementation du pipeline NLP multi-langues", pointsEarned: 15, userId: demoUser.id, projectId: projects[0].id },
    { type: "code", description: "API de traduction avec support WebSocket", pointsEarned: 15, userId: alice.id, projectId: projects[0].id },
    { type: "testing", description: "Tests de performance sur 50 langues", pointsEarned: 10, userId: bob.id, projectId: projects[0].id },
    { type: "research", description: "Recherche sur les modeles de langue des signes", pointsEarned: 10, userId: alice.id, projectId: projects[0].id },
    { type: "design", description: "Maquettes UI/UX pour l'interface de diagnostic", pointsEarned: 15, userId: carla.id, projectId: projects[1].id },
    { type: "code", description: "Module de preprocessing d'images DICOM", pointsEarned: 15, userId: bob.id, projectId: projects[1].id },
    { type: "code", description: "Moteur de generation d'art avec Stable Diffusion", pointsEarned: 15, userId: carla.id, projectId: projects[2].id },
    { type: "design", description: "Interface collaborative temps reel", pointsEarned: 15, userId: carla.id, projectId: projects[2].id },
    { type: "testing", description: "Tests utilisateurs sur le mode collaboratif", pointsEarned: 10, userId: david.id, projectId: projects[2].id },
    { type: "feedback", description: "Rapport de suggestions pour l'UX mobile", pointsEarned: 5, userId: demoUser.id, projectId: projects[2].id },
    { type: "research", description: "Etude des modeles de detection par drone", pointsEarned: 10, userId: alice.id, projectId: projects[3].id },
    { type: "code", description: "Integration de YOLOv8 pour detection d'especes", pointsEarned: 15, userId: bob.id, projectId: projects[3].id },
  ];

  for (const c of contribData) {
    await prisma.contribution.create({ data: c });
  }
  console.log(`${contribData.length} contributions`);

  // ─── COMMENTS ───────────────────────────────────────
  const comment1 = await prisma.comment.create({
    data: { content: "Super avancement sur le pipeline NLP ! Le support multi-langues est impressionnant.", userId: alice.id, projectId: projects[0].id },
  });
  await prisma.comment.create({
    data: { content: "Merci ! Il reste encore a optimiser la latence pour le temps reel.", userId: demoUser.id, projectId: projects[0].id, parentId: comment1.id },
  });
  const comment2 = await prisma.comment.create({
    data: { content: "J'ai commence les maquettes pour l'interface mobile. Qui veut faire la review ?", userId: carla.id, projectId: projects[2].id },
  });
  await prisma.comment.create({
    data: { content: "Je peux m'en charger ! Je fais les tests utilisateurs.", userId: david.id, projectId: projects[2].id, parentId: comment2.id },
  });
  await prisma.comment.create({
    data: { content: "Le modele YOLOv8 donne de bons resultats sur les images satellite.", userId: bob.id, projectId: projects[3].id },
  });
  console.log("Comments");

  // ─── CHALLENGES ─────────────────────────────────────
  await prisma.expertEvaluation.deleteMany();
  await prisma.challengePanel.deleteMany();
  await prisma.challengeEntry.deleteMany();
  await prisma.challenge.deleteMany();

  const now = new Date();
  const challenges = await Promise.all([
    prisma.challenge.create({
      data: {
        title: "Hackathon IA pour le Climat",
        description: "Developpez une solution IA innovante pour lutter contre le changement climatique. Les projets seront evalues sur leur impact potentiel, leur faisabilite technique et leur originalite.",
        category: "Environnement",
        type: "monthly",
        status: "open",
        prize: "Featured on Homepage + Global Builder Badge + Community Spotlight",
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        measurableGoal: "Developper un modele capable de predire la deforestation avec >85% de precision sur des images satellite",
        evaluationCriteria: "Impact potentiel (30%), Faisabilite technique (25%), Originalite (20%), Documentation (15%), Qualite du code (10%)",
        impactArea: "Climate",
        sdgAlignment: "13,15",
        context: "La deforestation est responsable de 10% des emissions mondiales de GES. Les outils actuels de surveillance sont lents et manuels. L'IA peut accelerer la detection et la prevention.",
        // V7 fields
        measurableOutcome: "Prediction model with >85% accuracy on satellite deforestation detection",
        geographicScope: "continental",
        estimatedBudget: "5,000 EUR",
        implementationPartnerNeeded: true,
        verificationMethod: "Satellite image comparison + independent environmental audit",
      },
    }),
    prisma.challenge.create({
      data: {
        title: "Challenge NLP Multilingual",
        description: "Creez un modele ou outil NLP qui supporte au minimum 10 langues differentes. Bonus pour le support de langues peu representees.",
        category: "NLP",
        type: "weekly",
        status: "open",
        prize: "Top Innovator Badge + Profile Highlight + Featured Project",
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        measurableGoal: "Supporter 10+ langues avec un score BLEU >30 sur chacune",
        evaluationCriteria: "Nombre de langues supportees, qualite de traduction (BLEU score), couverture de langues sous-representees",
        impactArea: "Education",
        sdgAlignment: "4,10",
        context: "90% des contenus en ligne sont dans 10 langues. Le NLP multilingue est essentiel pour l'inclusion numerique.",
        // V7 fields
        measurableOutcome: "NLP model supporting 10+ languages with BLEU score >30 each",
        geographicScope: "global",
        estimatedBudget: "1,000 EUR",
        verificationMethod: "BLEU benchmark suite + community review",
      },
    }),
    prisma.challenge.create({
      data: {
        title: "AI Art Battle",
        description: "Utilisez l'IA generative pour creer une oeuvre d'art sur le theme 'Futur de l'Humanite'. Vote de la communaute pour designer le gagnant.",
        category: "Creation IA",
        type: "weekly",
        status: "voting",
        prize: "AI Pioneer Badge + Permanent Spotlight + Challenge Champion Title",
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        impactArea: "Accessibility",
        context: "L'art genere par IA ouvre de nouvelles possibilites pour les artistes et democratise la creation visuelle.",
        // V7 fields
        geographicScope: "global",
        verificationMethod: "Community voting + expert panel review",
      },
    }),
  ]);
  console.log(`${challenges.length} challenges`);

  // ─── CHALLENGE ENTRIES ──────────────────────────────
  await Promise.all([
    prisma.challengeEntry.create({
      data: { description: "Modele de prediction de deforestation base sur des images satellite", userId: bob.id, challengeId: challenges[0].id, projectId: projects[3].id, score: 42 },
    }),
    prisma.challengeEntry.create({
      data: { description: "Pipeline NLP 15 langues avec fine-tuning", userId: alice.id, challengeId: challenges[1].id, projectId: projects[0].id, score: 28 },
    }),
    prisma.challengeEntry.create({
      data: { description: "Serie de portraits generes par IA fusion art deco et cyberpunk", userId: carla.id, challengeId: challenges[2].id, projectId: projects[2].id, score: 65 },
    }),
    prisma.challengeEntry.create({
      data: { description: "Paysage futuriste genere avec controle de style avance", userId: david.id, challengeId: challenges[2].id, score: 38 },
    }),
  ]);
  console.log("Challenge entries");

  // ─── EXPERT PANELS ─────────────────────────────────
  const panel1 = await prisma.challengePanel.create({
    data: { role: "EXPERT_VOLUNTEER", status: "accepted", challengeId: challenges[0].id, userId: alice.id },
  });
  const panel2 = await prisma.challengePanel.create({
    data: { role: "EXPERT_INSTITUTION", status: "accepted", challengeId: challenges[0].id, userId: carla.id },
  });
  await prisma.challengePanel.create({
    data: { role: "EXPERT_VOLUNTEER", status: "invited", challengeId: challenges[1].id, userId: alice.id },
  });
  console.log("3 expert panel members");

  // ─── EXPERT EVALUATIONS ────────────────────────────
  // Get the climate challenge entry for evaluation
  const climateEntry = await prisma.challengeEntry.findFirst({ where: { challengeId: challenges[0].id } });
  if (climateEntry) {
    await prisma.expertEvaluation.create({
      data: {
        technicalQuality: 8, relevance: 9, feasibility: 7, impactPotential: 9, documentation: 7,
        comments: "Excellent approche avec les images satellite. La faisabilite pourrait etre amelioree avec plus de donnees d'entrainement.",
        panelId: panel1.id, entryId: climateEntry.id,
      },
    });
    await prisma.expertEvaluation.create({
      data: {
        technicalQuality: 7, relevance: 8, feasibility: 8, impactPotential: 9, documentation: 6,
        comments: "Tres prometteur. L'impact environnemental est clairement mesurable. Documentation a renforcer.",
        panelId: panel2.id, entryId: climateEntry.id,
      },
    });
    // Recalculate entry score from evaluations
    const avgAlice = (8 + 9 + 7 + 9 + 7) / 5; // 8.0 x 1.0 weight
    const avgCarla = (7 + 8 + 8 + 9 + 6) / 5; // 7.6 x 1.5 weight
    const weightedScore = Math.round(((avgAlice * 1.0 + avgCarla * 1.5) / 2.5) * 10);
    await prisma.challengeEntry.update({ where: { id: climateEntry.id }, data: { score: weightedScore } });
    console.log("2 expert evaluations");
  }

  // ─── NOTIFICATIONS ──────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { type: "vote", title: "Nouveau vote", message: "Votre idee 'Traducteur universel' a recu un vote positif", link: `/ideas/${ideas[0].id}`, userId: demoUser.id },
      { type: "comment", title: "Nouveau commentaire", message: "AliceAI a commente sur TranslateAI", link: `/projects/${projects[0].id}`, userId: demoUser.id },
      { type: "contribution", title: "Contribution ajoutee", message: "BobML a ajoute une contribution sur TranslateAI", link: `/projects/${projects[0].id}`, userId: demoUser.id },
      { type: "badge", title: "Nouveau badge !", message: "Vous avez obtenu le badge Pionnier", userId: demoUser.id },
      { type: "challenge", title: "Nouveau challenge", message: "Le Hackathon IA pour le Climat est ouvert !", link: `/challenges/${challenges[0].id}`, userId: demoUser.id },
      { type: "project_invite", title: "Invitation projet", message: "CarlaDesign vous a invite a rejoindre ArtGen Collab", link: `/projects/${projects[2].id}`, userId: demoUser.id, read: true },
    ],
  });
  console.log("Notifications");

  // ─── ARENA SESSIONS ──────────────────────────────
  await prisma.sandboxComment.deleteMany();
  await prisma.sandboxVersion.deleteMany();
  await prisma.sandboxParticipant.deleteMany();
  await prisma.sandboxSession.deleteMany();

  const session1 = await prisma.sandboxSession.create({
    data: {
      name: "Prototype detection especes",
      description: "Session collaborative pour generer du code de detection d'especes par drone",
      problemStatement: "Les gardes forestiers manquent d'outils automatises pour identifier les especes menacees sur de grandes zones",
      proposedImpact: "Reduire le temps de surveillance de 80% et ameliorer la precision d'identification des especes",
      documentation: "# Prototype Detection Especes\n\n## Architecture\n- YOLOv8 pour la detection d'objets\n- GPS logging pour le georeferencement\n- Pipeline de traitement d'images satellite\n\n## Utilisation\n1. Installer les dependances: `pip install ultralytics`\n2. Executer la detection: `python detect.py --image satellite.jpg`\n3. Les resultats sont loggues en JSON avec coordonnees GPS",
      type: "text-to-code",
      isPublic: true,
      shareSlug: "eco-detection-v1",
      creatorId: bob.id,
      projectId: projects[3].id,
    },
  });
  const session2 = await prisma.sandboxSession.create({
    data: {
      name: "Art generatif cyberpunk",
      description: "Exploration de styles artistiques IA",
      problemStatement: "Creer des visuels uniques fusion art deco et cyberpunk pour des projets creatifs",
      proposedImpact: "Democratiser la creation artistique assistee par IA pour les artistes independants",
      type: "text-to-image",
      isPublic: true,
      shareSlug: "cyberpunk-art",
      creatorId: carla.id,
      projectId: projects[2].id,
    },
  });

  // Participants
  await Promise.all([
    prisma.sandboxParticipant.create({ data: { userId: bob.id, sessionId: session1.id, role: "editor" } }),
    prisma.sandboxParticipant.create({ data: { userId: alice.id, sessionId: session1.id, role: "editor" } }),
    prisma.sandboxParticipant.create({ data: { userId: demoUser.id, sessionId: session1.id, role: "viewer" } }),
    prisma.sandboxParticipant.create({ data: { userId: carla.id, sessionId: session2.id, role: "editor" } }),
    prisma.sandboxParticipant.create({ data: { userId: david.id, sessionId: session2.id, role: "editor" } }),
  ]);

  // Versions
  await Promise.all([
    prisma.sandboxVersion.create({
      data: { version: 1, prompt: "Generate YOLOv8 detection code for African wildlife", resultText: "import ultralytics\nfrom ultralytics import YOLO\n\nmodel = YOLO('yolov8n.pt')\nresults = model.predict('wildlife.jpg')", changelog: "Initial version with basic YOLO setup", authorId: bob.id, sessionId: session1.id },
    }),
    prisma.sandboxVersion.create({
      data: { version: 2, prompt: "Add species classification and GPS logging", resultText: "import ultralytics\nfrom ultralytics import YOLO\nimport json, datetime\n\nmodel = YOLO('yolov8n.pt')\n\ndef detect_and_log(image_path, gps_coords):\n  results = model.predict(image_path)\n  species = [r.names[int(c)] for r in results for c in r.boxes.cls]\n  log = {'timestamp': str(datetime.datetime.now()), 'gps': gps_coords, 'species': species}\n  return json.dumps(log)", changelog: "Added GPS logging and species classification", authorId: alice.id, sessionId: session1.id },
    }),
    prisma.sandboxVersion.create({
      data: { version: 1, prompt: "Cyberpunk city at sunset, neon lights, flying cars", resultUrl: "https://placehold.co/1024x1024/1a1a2e/e94560?text=Cyberpunk+City", changelog: "First art generation", authorId: carla.id, sessionId: session2.id },
    }),
  ]);

  // Arena comments
  await Promise.all([
    prisma.sandboxComment.create({ data: { content: "Le modele YOLO fonctionne bien sur les images satellite !", userId: alice.id, sessionId: session1.id } }),
    prisma.sandboxComment.create({ data: { content: "Il faudrait ajouter un filtre pour les faux positifs", userId: bob.id, sessionId: session1.id } }),
    prisma.sandboxComment.create({ data: { content: "J'adore le style neon ! On pourrait ajouter plus de details.", userId: david.id, sessionId: session2.id } }),
  ]);
  console.log("2 arena sessions with participants, versions & comments");

  // ─── ACTIVITY FEED ────────────────────────────────
  await prisma.activity.deleteMany();
  const activityData = [
    { type: "contribution", message: `${demoUser.username} contributed to "TranslateAI"`, userId: demoUser.id },
    { type: "vote", message: `${alice.username} voted on "Traducteur universel en temps reel"`, userId: alice.id },
    { type: "project_join", message: `${bob.username} joined "TranslateAI"`, userId: bob.id },
    { type: "challenge_entry", message: `${bob.username} entered challenge "Hackathon IA pour le Climat"`, userId: bob.id },
    { type: "contribution", message: `${alice.username} contributed to "TranslateAI"`, userId: alice.id },
    { type: "sandbox", message: `${carla.username} created arena session "Art generatif cyberpunk"`, userId: carla.id },
    { type: "version", message: `${alice.username} added version 2 to "Prototype detection especes"`, userId: alice.id },
    { type: "comment", message: `${david.username} commented on "Art generatif cyberpunk"`, userId: david.id },
    { type: "badge", message: `${carla.username} earned badge "Top Vote"`, userId: carla.id },
    { type: "vote", message: `${demoUser.username} voted on "Generateur d'art IA collaboratif"`, userId: demoUser.id },
    { type: "project_join", message: `${david.username} joined "ArtGen Collab"`, userId: david.id },
    { type: "challenge_entry", message: `${carla.username} entered challenge "AI Art Battle"`, userId: carla.id },
  ];
  for (let i = 0; i < activityData.length; i++) {
    await prisma.activity.create({
      data: {
        ...activityData[i],
        createdAt: new Date(now.getTime() - (activityData.length - i) * 3600000),
      },
    });
  }
  console.log(`${activityData.length} activities`);

  // ─── V7 BADGES ─────────────────────────────────────
  const v7Badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: "Verified Impact Builder" },
      update: {},
      create: { name: "Verified Impact Builder", description: "Project reached 'High Impact' tier on the Impact Dashboard", icon: "target", category: "contribution" },
    }),
    prisma.badge.upsert({
      where: { name: "Institutional Collaboration" },
      update: {},
      create: { name: "Institutional Collaboration", description: "Contributed to a challenge with institutional expert evaluation", icon: "building", category: "challenge" },
    }),
    prisma.badge.upsert({
      where: { name: "Top 1% Global" },
      update: {},
      create: { name: "Top 1% Global", description: "Ranked in the top 1% of all contributors globally", icon: "crown", category: "engagement" },
    }),
    prisma.badge.upsert({
      where: { name: "Governance Participant" },
      update: {},
      create: { name: "Governance Participant", description: "Declared a conflict of interest or participated in governance review", icon: "shield", category: "general" },
    }),
  ]);
  console.log(`${v7Badges.length} V7 badges`);

  // ─── V7 AUDIT LOG ──────────────────────────────────
  await prisma.auditLog.deleteMany();
  const auditData = [
    { action: "role_change", targetType: "user", targetId: alice.id, metadata: JSON.stringify({ from: "USER", to: "EXPERT_VOLUNTEER" }), performedById: demoUser.id },
    { action: "role_change", targetType: "user", targetId: carla.id, metadata: JSON.stringify({ from: "USER", to: "EXPERT_INSTITUTION" }), performedById: demoUser.id },
    { action: "challenge_created", targetType: "challenge", targetId: challenges[0].id, metadata: JSON.stringify({ title: "Hackathon IA pour le Climat" }), performedById: demoUser.id },
    { action: "evaluation_submitted", targetType: "challenge_entry", targetId: climateEntry?.id || "unknown", metadata: JSON.stringify({ panelMember: alice.username, score: "8.0" }), performedById: alice.id },
    { action: "evaluation_submitted", targetType: "challenge_entry", targetId: climateEntry?.id || "unknown", metadata: JSON.stringify({ panelMember: carla.username, score: "7.6" }), performedById: carla.id },
  ];
  for (let i = 0; i < auditData.length; i++) {
    await prisma.auditLog.create({
      data: {
        ...auditData[i],
        createdAt: new Date(now.getTime() - (auditData.length - i) * 7200000),
      },
    });
  }
  console.log(`${auditData.length} audit log entries`);

  console.log("\nV7 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
