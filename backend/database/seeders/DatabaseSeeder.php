<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Coach;
use App\Models\Client;
use App\Models\Programme;
use App\Models\Planning;
use App\Models\SeancePlanifiee;
use App\Models\SeanceRealisee;
use App\Models\BilanPhysique;
use App\Models\BilanSanitaire;
use App\Models\Cotisation;
use App\Models\Ressource;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. ADMIN ──────────────────────────────────────────
        $admin = User::create([
            'name'     => 'Administrateur',
            'email'    => 'admin@sportcenter.ma',
            'password' => Hash::make('Admin@1234'),
            'role'     => 'admin',
            'active'   => true,
        ]);

        // ── 2. COACHS ─────────────────────────────────────────
        $coachsData = [
            ['Karim',  'Benali',    'Musculation',   'COACH-001'],
            ['Sara',   'Elhajjami', 'Cardio & Yoga', 'COACH-002'],
            ['Omar',   'Tazi',      'Crossfit',      'COACH-003'],
        ];

        $coaches = [];
        foreach ($coachsData as [$prenom, $nom, $specialite, $code]) {
            $user = User::create([
                'name'     => "$prenom $nom",
                'email'    => strtolower($prenom) . '@sportcenter.ma',
                'password' => Hash::make('Coach@1234'),
                'role'     => 'coach',
                'active'   => true,
            ]);
            $coaches[] = Coach::create([
                'user_id'      => $user->id,
                'code_coach'   => $code,
                'nom'          => $nom,
                'prenom'       => $prenom,
                'specialite'   => $specialite,
                'date_embauche' => now()->subMonths(rand(6, 24))->toDateString(),
            ]);
        }

        // ── 3. CLIENTS ────────────────────────────────────────
        $clientsData = [
            ['Yassine', 'Amrani',    '0661234567', '1990-05-14', 75, 178, 0],
            ['Fatima',  'Ouali',     '0662345678', '1995-08-22', 62, 165, 1],
            ['Mehdi',   'Chraibi',   '0663456789', '1988-03-10', 90, 182, 0],
            ['Nadia',   'Kettani',   '0664567890', '1993-11-30', 58, 160, 1],
            ['Anas',    'Lahlou',    '0665678901', '1985-07-05', 85, 175, 2],
            ['Salma',   'Benkirane', '0666789012', '1997-02-18', 55, 163, 2],
            ['Hamza',   'Filali',    '0667890123', '1992-09-25', 78, 180, 0],
            ['Leila',   'Tahiri',    '0668901234', '1991-04-12', 70, 170, 1],
            ['Younes',  'Berrada',   '0669012345', '1987-12-08', 95, 183, 2],
            ['Rim',     'Alaoui',    '0660123456', '1999-06-20', 52, 158, 0],
        ];

        $clients = [];
        foreach ($clientsData as [$prenom, $nom, $tel, $dob, $poids, $taille, $coachIdx]) {
            $user = User::create([
                'name'     => "$prenom $nom",
                'email'    => strtolower($prenom) . '.' . strtolower($nom) . '@gmail.com',
                'password' => Hash::make('Client@1234'),
                'role'     => 'client',
                'active'   => true,
            ]);

            $dateInscription = now()->subMonths(rand(1, 6))->toDateString();

            $client = Client::create([
                'user_id'          => $user->id,
                'coach_id'         => $coaches[$coachIdx]->id,
                'nom'              => $nom,
                'prenom'           => $prenom,
                'date_naissance'   => $dob,
                'telephone'        => $tel,
                'statut'           => 'actif',
                'date_inscription' => $dateInscription,
            ]);

            // Bilan physique
            BilanPhysique::create([
                'client_id' => $client->id,
                'coach_id'  => $coaches[$coachIdx]->id,
                'date'      => now()->subDays(rand(5, 30))->toDateString(),
                'taille_cm' => $taille,
                'poids_kg'  => $poids,
                'imc'       => round($poids / (($taille / 100) ** 2), 2),
                'remarques' => 'Bilan initial.',
            ]);

            // Bilan sanitaire
            BilanSanitaire::create([
                'client_id'           => $client->id,
                'coach_id'            => $coaches[$coachIdx]->id,
                'date'                => now()->subDays(rand(5, 30))->toDateString(),
                'tension_arterielle'  => rand(110, 130) . '/' . rand(70, 85),
                'frequence_cardiaque' => rand(60, 80),
                'allergies'           => 'Aucune connue',
                'pathologies'         => 'Aucune',
            ]);

            // Cotisation (les 3 échéances sont créées automatiquement)
            Cotisation::create([
                'client_id'        => $client->id,
                'montant_annuel'   => 3600.00,
                'date_inscription' => $dateInscription,
                'date_expiration'  => Carbon::parse($dateInscription)->addYear()->toDateString(),
                'statut'           => 'active',
            ]);

            $clients[] = $client;
        }

        // ── 4. PROGRAMMES ─────────────────────────────────────
        $prog1 = Programme::create([
            'coach_id'       => $coaches[0]->id,
            'nom'            => 'Prise de masse débutant',
            'objectif'       => 'Augmenter la masse musculaire',
            'duree_semaines' => 12,
            'niveau'         => 'debutant',
            'est_template'   => true,
            'exercices'      => [
                ['nom' => 'Squat',             'sets' => 4, 'reps' => '8-10'],
                ['nom' => 'Développé couché',  'sets' => 4, 'reps' => '8-10'],
                ['nom' => 'Rowing barre',      'sets' => 3, 'reps' => '10-12'],
                ['nom' => 'Curl biceps',       'sets' => 3, 'reps' => '12'],
            ],
        ]);

        $prog2 = Programme::create([
            'coach_id'       => $coaches[1]->id,
            'nom'            => 'Perte de poids cardio',
            'objectif'       => 'Brûler les graisses et améliorer l\'endurance',
            'duree_semaines' => 8,
            'niveau'         => 'intermediaire',
            'est_template'   => true,
            'exercices'      => [
                ['nom' => 'Course tapis', 'duree' => '20min'],
                ['nom' => 'Burpees',      'sets'  => 3, 'reps' => '15'],
                ['nom' => 'Jump rope',    'duree' => '10min'],
                ['nom' => 'Planche',      'sets'  => 3, 'duree' => '60s'],
            ],
        ]);

        $prog3 = Programme::create([
            'coach_id'       => $coaches[2]->id,
            'nom'            => 'CrossFit Force & Condition',
            'objectif'       => 'Force fonctionnelle et conditionnement',
            'duree_semaines' => 16,
            'niveau'         => 'avance',
            'est_template'   => false,
            'exercices'      => [
                ['nom' => 'Clean & Jerk',     'sets' => 5, 'reps' => '3'],
                ['nom' => 'Box jumps',        'sets' => 4, 'reps' => '10'],
                ['nom' => 'Pull-ups',         'sets' => 4, 'reps' => 'max'],
                ['nom' => 'Kettlebell swing', 'sets' => 3, 'reps' => '20'],
            ],
        ]);

        // Assigner programmes aux clients
        $prog1->clients()->attach($clients[0]->id, ['date_debut' => now()->subMonths(1)->toDateString(), 'statut' => 'en_cours']);
        $prog1->clients()->attach($clients[2]->id, ['date_debut' => now()->subMonths(2)->toDateString(), 'statut' => 'en_cours']);
        $prog1->clients()->attach($clients[6]->id, ['date_debut' => now()->subMonths(1)->toDateString(), 'statut' => 'en_cours']);
        $prog2->clients()->attach($clients[1]->id, ['date_debut' => now()->subMonths(1)->toDateString(), 'statut' => 'en_cours']);
        $prog2->clients()->attach($clients[3]->id, ['date_debut' => now()->subMonths(2)->toDateString(), 'statut' => 'en_cours']);
        $prog3->clients()->attach($clients[4]->id, ['date_debut' => now()->subMonths(3)->toDateString(), 'statut' => 'en_cours']);

        // ── 5. PLANNINGS & SÉANCES ────────────────────────────
        foreach (array_slice($clients, 0, 5) as $idx => $client) {
            $planning = Planning::create([
                'client_id' => $client->id,
                'coach_id'  => $client->coach_id,
                'mois'      => now()->month,
                'annee'     => now()->year,
                'statut'    => 'publie',
            ]);

            for ($semaine = 0; $semaine < 4; $semaine++) {
                foreach ([1, 3, 5] as $jour) {
                    $date = Carbon::now()->startOfMonth()->addWeeks($semaine)->startOfWeek()->addDays($jour - 1);
                    if ($date->month !== now()->month) continue;

                    $seance = SeancePlanifiee::create([
                        'planning_id'      => $planning->id,
                        'date'             => $date->toDateString(),
                        'heure_debut'      => '09:00',
                        'heure_fin'        => '10:30',
                        'lieu'             => 'Salle ' . chr(65 + $idx),
                        'exercices_prevus' => [
                            ['nom' => 'Échauffement',      'duree' => '10min'],
                            ['nom' => 'Exercice principal', 'sets'  => 4, 'reps' => '10'],
                            ['nom' => 'Stretching',        'duree' => '10min'],
                        ],
                    ]);

                    if ($date->isPast()) {
                        SeanceRealisee::create([
                            'seance_planifiee_id' => $seance->id,
                            'present'             => true,
                            'exercices_realises'  => $seance->exercices_prevus,
                            'remarques_coach'     => 'Bonne séance, client motivé.',
                            'effort_percu'        => rand(6, 9),
                        ]);
                    }
                }
            }
        }

        // ── 6. RESSOURCES PUBLIQUES ───────────────────────────
        $articles = [
            [
                'titre' => '5 règles d\'or pour une séance efficace',
                'categorie' => 'sport',
                'contenu' => 'La constance est la clé du succès sportif. Voici les 5 règles essentielles : 1. Toujours commencer par un échauffement de 10 minutes. 2. Respecter les temps de repos. 3. Maintenir une technique parfaite. 4. S\'hydrater régulièrement. 5. Terminer par des étirements.'
            ],
            [
                'titre' => 'Nutrition optimale pour la prise de masse',
                'categorie' => 'nutrition',
                'contenu' => 'Pour augmenter votre masse musculaire, consommez 2g de protéines par kg de poids. Ajoutez un surplus calorique de 300-500 kcal. Privilégiez poulet, oeufs, poisson et légumineuses. Répartissez en 4-5 repas par jour.'
            ],
            [
                'titre' => 'Les bienfaits du cardio pour la santé',
                'categorie' => 'sport',
                'contenu' => '30 minutes de cardio modéré 5 fois par semaine réduisent le risque cardiovasculaire. Le cardio améliore le sommeil, réduit le stress et booste l\'énergie. Débutez par 20 minutes de marche rapide.'
            ],
            [
                'titre' => 'Plan alimentaire semaine type',
                'categorie' => 'nutrition',
                'contenu' => 'Petit-déjeuner : flocons d\'avoine + fruits + oeufs. Déjeuner : protéines + légumes + riz complet. Collation : yaourt grec + noix. Dîner : poisson + légumes vapeur + quinoa.'
            ],
        ];

        foreach ($articles as $article) {
            Ressource::create([
                'auteur_id'  => $admin->id,
                'titre'      => $article['titre'],
                'slug'       => Str::slug($article['titre']),
                'contenu'    => $article['contenu'],
                'categorie'  => $article['categorie'],
                'publie'     => true,
                'publie_at'  => now()->subDays(rand(1, 30)),
            ]);
        }

        $this->command->info('');
        $this->command->info('✅ Base de données remplie avec succès !');
        $this->command->info('');
        $this->command->info('📋 Comptes de test :');
        $this->command->info('   Admin  → admin@sportcenter.ma          / Admin@1234');
        $this->command->info('   Coach  → karim@sportcenter.ma          / Coach@1234');
        $this->command->info('   Client → yassine.amrani@gmail.com      / Client@1234');
        $this->command->info('');
    }
}
