<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Coach;
use App\Models\Echeance;
use App\Models\Paiement;
use App\Models\SeanceRealisee;
use App\Models\BilanPhysique;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $mois  = now()->month;
        $annee = now()->year;

        // ── KPIs ──────────────────────────────────────────────
        $totalClients    = Client::where('statut', 'actif')->count();
        $totalCoaches    = Coach::count();
        $nouveauxCeMois  = Client::whereMonth('date_inscription', $mois)
            ->whereYear('date_inscription', $annee)->count();

        $revenusMois = Paiement::whereMonth('date_paiement', $mois)
            ->whereYear('date_paiement', $annee)
            ->sum('montant');

        $clientsImpayes = Echeance::where('statut', 'en_attente')
            ->where('date_echeance', '<', now())
            ->distinct('cotisation_id')
            ->count();

        // ── Séances par coach ──────────────────────────────────
        $coaches = Coach::with('user')->get();
        $seancesParCoach = $coaches->map(function ($coach) use ($mois, $annee) {
            $seances = SeanceRealisee::whereHas('seancePlanifiee.planning', function ($q) use ($coach, $mois, $annee) {
                $q->where('coach_id', $coach->id)
                    ->where('mois', $mois)
                    ->where('annee', $annee);
            })->count();

            return [
                'nom_complet' => $coach->prenom . ' ' . $coach->nom,
                'seances'     => $seances,
            ];
        })->sortByDesc('seances')->values();

        $maxSeances = $seancesParCoach->max('seances') ?: 1;

        // ── Clients en retard ──────────────────────────────────
        $echeancesEnRetard = Echeance::with(['cotisation.client.coach'])
            ->where('statut', 'en_attente')
            ->where('date_echeance', '<', now())
            ->orderBy('date_echeance')
            ->take(5)
            ->get();

        $clientsRetard = $echeancesEnRetard->map(function ($e) {
            $client = $e->cotisation->client;
            return [
                'nom'         => $client->nom,
                'prenom'      => $client->prenom,
                'coach'       => $client->coach ? $client->coach->prenom . ' ' . $client->coach->nom : null,
                'montant_du'  => $e->montant,
                'jours_retard' => (int) Carbon::parse($e->date_echeance)->diffInDays(now()),
            ];
        });

        // ── Alertes ────────────────────────────────────────────
        $alertes = [];

        // IMC anormaux
        $imcAbnormaux = BilanPhysique::whereIn('imc_statut', ['insuffisant', 'obesite'])
            ->whereMonth('created_at', $mois)->count();
        if ($imcAbnormaux > 0) {
            $alertes[] = [
                'type'    => 'warning',
                'titre'   => 'Abnormal BMI detected',
                'message' => "$imcAbnormaux client(s) with out-of-range BMI this month.",
            ];
        }

        // Paiements en retard
        if ($clientsImpayes > 0) {
            $alertes[] = [
                'type'    => 'danger',
                'titre'   => 'Overdue payments',
                'message' => "$clientsImpayes client(s) have not paid their installment.",
            ];
        }

        // Nouveaux clients
        if ($nouveauxCeMois > 0) {
            $alertes[] = [
                'type'    => 'info',
                'titre'   => 'New members',
                'message' => "$nouveauxCeMois new client(s) registered this month.",
            ];
        }

        return response()->json([
            'total_clients'     => $totalClients,
            'total_coaches'     => $totalCoaches,
            'nouveaux_ce_mois'  => $nouveauxCeMois,
            'revenus_mois'      => number_format($revenusMois, 2),
            'clients_impayes'   => $clientsImpayes,
            'seances_par_coach' => $seancesParCoach,
            'max_seances'       => $maxSeances,
            'clients_retard'    => $clientsRetard,
            'alertes'           => $alertes,
        ]);
    }
}
