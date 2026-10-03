<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\SeancePlanifiee;
use App\Models\SeanceRealisee;

class DashboardController extends Controller
{
    public function index()
    {
        $user   = auth('sanctum')->user();
        $client = Client::where('user_id', $user->id)
            ->with(['coach', 'cotisations.echeances', 'bilansPhysiques' => fn($q) => $q->latest()->limit(1)])
            ->firstOrFail();

        $mois  = now()->month;
        $annee = now()->year;

        // Séances ce mois
        $seancesPlanifiees = SeancePlanifiee::whereHas(
            'planning',
            fn($q) =>
            $q->where('client_id', $client->id)->where('mois', $mois)->where('annee', $annee)
        )->count();

        $seancesRealisees = SeanceRealisee::whereHas(
            'seancePlanifiee.planning',
            fn($q) =>
            $q->where('client_id', $client->id)->where('mois', $mois)->where('annee', $annee)
        )->where('present', true)->count();

        // Prochaines séances
        $prochaines = SeancePlanifiee::whereHas(
            'planning',
            fn($q) =>
            $q->where('client_id', $client->id)
        )
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')->take(3)->get()
            ->map(fn($s) => [
                'date'  => $s->date,
                'heure' => $s->heure_debut,
                'lieu'  => $s->lieu,
            ]);

        // Cotisation active
        $cotisation   = $client->cotisations->first();
        $echeances    = $cotisation?->echeances ?? collect();
        $prochaine_echeance = $echeances->where('statut', 'en_attente')->sortBy('date_echeance')->first();

        // Dernier bilan
        $dernierBilan = $client->bilansPhysiques->first();

        // Alertes
        $alertes = \App\Models\ClientNotification::where('client_id', $client->id)
            ->where('lu', false)
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'titre' => $a->titre,
                'message' => $a->message,
                'date' => $a->created_at->diffForHumans()
            ]);

        return response()->json([
            'client' => [
                'nom'    => $client->prenom . ' ' . $client->nom,
                'statut' => $client->statut,
            ],
            'coach' => $client->coach ? [
                'nom'       => $client->coach->prenom . ' ' . $client->coach->nom,
                'specialite' => $client->coach->specialite,
                'telephone' => $client->coach->telephone,
            ] : null,
            'seances_planifiees' => $seancesPlanifiees,
            'seances_realisees'  => $seancesRealisees,
            'taux_presence'      => $seancesPlanifiees > 0 ? round(($seancesRealisees / $seancesPlanifiees) * 100) : 0,
            'prochaines_seances' => $prochaines,
            'dernier_bilan'      => $dernierBilan ? [
                'date'       => $dernierBilan->date,
                'imc'        => $dernierBilan->imc,
                'imc_statut' => $dernierBilan->imc_statut,
                'poids_kg'   => $dernierBilan->poids_kg,
                'taille_cm'  => $dernierBilan->taille_cm,
            ] : null,
            'cotisation' => $cotisation ? [
                'statut'             => $cotisation->statut,
                'montant_annuel'     => $cotisation->montant_annuel,
                'prochaine_echeance' => $prochaine_echeance ? [
                    'montant'       => $prochaine_echeance->montant,
                    'date_echeance' => $prochaine_echeance->date_echeance,
                    'statut'        => $prochaine_echeance->statut,
                ] : null,
            ] : null,
            'alertes' => $alertes,
        ]);
    }
}
