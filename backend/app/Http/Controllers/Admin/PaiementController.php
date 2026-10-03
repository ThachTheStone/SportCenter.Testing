<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Echeance;
use App\Models\Cotisation;
use App\Models\Client;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PaiementController extends Controller
{
    public function index(Request $request)
    {
        $query = Echeance::with(['cotisation.client.coach', 'paiement']);

        if ($request->statut) {
            if ($request->statut === 'retard') {
                // Retard = en_attente ET date dépassée
                $query->where('statut', 'en_attente')
                    ->where('date_echeance', '<', now());
            } elseif ($request->statut === 'en_attente') {
                // En attente = en_attente ET date pas encore dépassée
                $query->where('statut', 'en_attente')
                    ->where('date_echeance', '>=', now());
            } else {
                $query->where('statut', $request->statut);
            }
        }

        if ($request->search) {
            $query->whereHas('cotisation.client', function ($q) use ($request) {
                $q->where('nom', 'like', "%{$request->search}%")
                    ->orWhere('prenom', 'like', "%{$request->search}%");
            });
        }

        $echeances = $query->orderBy('date_echeance')->paginate(15);

        return response()->json($echeances);
    }

    public function store(Request $request)
    {
        $request->validate([
            'echeance_id'  => 'required|exists:echeances,id',
            'montant'      => 'required|numeric|min:1',
            'methode'      => 'required|in:carte,virement,cheque,especes',
            'date_paiement' => 'required|date',
            'reference'    => 'nullable|string',
            'notes'        => 'nullable|string',
        ]);

        $echeance = Echeance::findOrFail($request->echeance_id);

        if ($echeance->statut === 'paye') {
            return response()->json(['message' => 'This installment is already paid.'], 422);
        }

        $paiement = Paiement::create([
            'echeance_id'   => $request->echeance_id,
            'enregistre_par' => auth('sanctum')->id(),
            'date_paiement' => $request->date_paiement,
            'montant'       => $request->montant,
            'methode'       => $request->methode,
            'reference'     => $request->reference,
            'notes'         => $request->notes,
        ]);

        return response()->json([
            'message'  => 'Payment recorded successfully.',
            'paiement' => $paiement,
        ], 201);
    }

    public function stats()
    {
        $mois  = now()->month;
        $annee = now()->year;

        $totalEncaisse = Paiement::whereMonth('date_paiement', $mois)
            ->whereYear('date_paiement', $annee)
            ->sum('montant');

        $totalEnAttente = Echeance::where('statut', 'en_attente')->sum('montant');
        $totalEnRetard  = Echeance::where('statut', 'en_attente')
            ->where('date_echeance', '<', now())
            ->sum('montant');

        $parMethode = Paiement::whereMonth('date_paiement', $mois)
            ->whereYear('date_paiement', $annee)
            ->selectRaw('methode, SUM(montant) as total, COUNT(*) as count')
            ->groupBy('methode')
            ->get();

        return response()->json([
            'total_encaisse'   => (float) $totalEncaisse,
            'total_en_attente' => (float) $totalEnAttente,
            'total_en_retard'  => (float) $totalEnRetard,
            'par_methode'      => $parMethode,
        ]);
    }
}
