<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\SeanceRealisee;
use App\Models\SeancePlanifiee;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user  = auth('sanctum')->user();
        $coach = Coach::where('user_id', $user->id)->firstOrFail();

        $mois  = now()->month;
        $annee = now()->year;

        // Clients du coach
        $clients = $coach->clients()->where('statut', 'actif')->with('user')->get();

        // Séances ce mois
        $seancesPlanifiees = SeancePlanifiee::whereHas(
            'planning',
            fn($q) =>
            $q->where('coach_id', $coach->id)->where('mois', $mois)->where('annee', $annee)
        )->count();

        $seancesRealisees = SeanceRealisee::whereHas(
            'seancePlanifiee.planning',
            fn($q) =>
            $q->where('coach_id', $coach->id)->where('mois', $mois)->where('annee', $annee)
        )->where('present', true)->count();

        // Prochaines séances (7 jours)
        $prochainesSeances = SeancePlanifiee::whereHas(
            'planning',
            fn($q) =>
            $q->where('coach_id', $coach->id)
        )
            ->whereBetween('date', [now()->toDateString(), now()->addDays(7)->toDateString()])
            ->with('planning.client')
            ->orderBy('date')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'id'     => $s->id,
                'date'   => $s->date,
                'heure'  => $s->heure_debut,
                'lieu'   => $s->lieu,
                'client' => $s->planning->client->prenom . ' ' . $s->planning->client->nom,
            ]);

        // Taux de présence
        $tauxPresence = $seancesPlanifiees > 0
            ? round(($seancesRealisees / $seancesPlanifiees) * 100)
            : 0;

        return response()->json([
            'coach'               => [
                'id'         => $coach->id,
                'nom_complet' => $coach->prenom . ' ' . $coach->nom,
                'specialite' => $coach->specialite,
                'code'       => $coach->code_coach,
            ],
            'total_clients'       => $clients->count(),
            'seances_planifiees'  => $seancesPlanifiees,
            'seances_realisees'   => $seancesRealisees,
            'taux_presence'       => $tauxPresence,
            'prochaines_seances'  => $prochainesSeances,
            'clients'             => $clients->map(fn($c) => [
                'id'     => $c->id,
                'nom'    => $c->prenom . ' ' . $c->nom,
                'statut' => $c->statut,
                'email'  => $c->user?->email,
            ]),
        ]);
    }
}
