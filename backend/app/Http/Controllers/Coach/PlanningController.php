<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\Planning;
use App\Models\SeancePlanifiee;
use App\Models\SeanceRealisee;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    private function getCoach()
    {
        return Coach::where('user_id', auth('sanctum')->id())->firstOrFail();
    }

    public function index(Request $request)
    {
        $coach = $this->getCoach();
        $mois  = $request->mois  ?? now()->month;
        $annee = $request->annee ?? now()->year;

        $plannings = Planning::where('coach_id', $coach->id)
            ->where('mois', $mois)
            ->where('annee', $annee)
            ->with(['client', 'seances.seanceRealisee'])
            ->get();

        return response()->json([
            'mois'      => (int)$mois,
            'annee'     => (int)$annee,
            'plannings' => $plannings,
        ]);
    }

    public function marquerRealisee(Request $request, SeancePlanifiee $seance)
    {
        $coach = $this->getCoach();

        $request->validate([
            'present'             => 'required|boolean',
            'effort_percu'        => 'nullable|integer|min:1|max:10',
            'remarques_coach'     => 'nullable|string',
            'exercices_realises'  => 'nullable|array',
        ]);

        $seanceRealisee = SeanceRealisee::updateOrCreate(
            ['seance_planifiee_id' => $seance->id],
            [
                'present'            => $request->present,
                'effort_percu'       => $request->effort_percu,
                'remarques_coach'    => $request->remarques_coach,
                'exercices_realises' => $request->exercices_realises ?? [],
            ]
        );

        return response()->json([
            'message' => $request->present ? 'Session marked as completed.' : 'Absence recorded.',
            'seance'  => $seanceRealisee,
        ]);
    }

    public function storeSeance(Request $request)
    {
        $coach = $this->getCoach();

        $request->validate([
            'client_id'   => 'required|exists:clients,id',
            'date'        => 'required|date',
            'heure_debut' => 'required|date_format:H:i',
            'heure_fin'   => 'nullable|date_format:H:i|after:heure_debut',
            'lieu'        => 'nullable|string',
            'exercices_prevus' => 'nullable|array',
            'notes'       => 'nullable|string',
        ]);

        $dateCarbon = \Carbon\Carbon::parse($request->date);
        
        $client = \App\Models\Client::where('id', $request->client_id)->where('coach_id', $coach->id)->firstOrFail();

        $planning = Planning::firstOrCreate(
            [
                'client_id' => $request->client_id,
                'coach_id'  => $coach->id,
                'mois'      => $dateCarbon->month,
                'annee'     => $dateCarbon->year,
            ],
            ['statut' => 'actif']
        );

        $seance = SeancePlanifiee::create([
            'planning_id'      => $planning->id,
            'date'             => $request->date,
            'heure_debut'      => $request->heure_debut,
            'heure_fin'        => $request->heure_fin,
            'lieu'             => $request->lieu,
            'exercices_prevus' => $request->exercices_prevus ?? [],
            'notes'            => $request->notes,
        ]);

        return response()->json([
            'message' => 'Session scheduled successfully.',
            'seance'  => $seance,
        ], 201);
    }
}
